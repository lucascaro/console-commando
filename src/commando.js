'use strict';

// Classes
var Formatter = require('./formatter');
var Immutable = require('immutable');
// var Command = require('./command');
var Option = require('./option');

// Libraries
var chalk = require('chalk');
var debug = require('./debug');
var minimist = require('minimist');
var util = require('util');

// Constants
const RETURN_VALUE_SUCCESS = true;
const RETURN_VALUE_FAILURE = false;

class Commando {
  constructor (config) {
    if (config instanceof Commando) {
      return config;
    }
    if (typeof config === 'string') {
      // Allow to set name as the parameter.
      config = { name: config };
    }
    this._config = Commando.defaultConfig().merge(Immutable.fromJS(config));
    Object.freeze(this);
  }

  // Class methods
  // Setters / getters
  version (version) {
    return new Commando(this._config.set('version', version));
  }

  name (name) {
    return new Commando(this._config.set('name', name));
  }

  description (description) {
    return new Commando(this._config.set('description', description));
  }

  get (key) {
    return this._config.get(key);
  }

  // Command related methods
  command (options) {
    var command = new Commando(options);
    if (!command.get('name')) {
      throw new Error('Command needs a name');
    }
    var newConfig = this._config.setIn(
      ['commands', command.get('name')],
      command);
    return new Commando(newConfig);
  }

  option (optstring, description, defaultValue) {
    var option = new Option(optstring, description, defaultValue);
    var options = this.get('options');

    return new Commando(this._config.set('options', options.push(option)));
  }

  action (action) {
    return new Commando(this._config.set('action', action));
  }

  before (before) {
    return new Commando(this._config.set('before', before));
  }

  debug () {
    debug.log('Command:');
    debug.log('Name: %s, Version: %s', this.get('name'), this.get('version'));
    this.get('options').forEach(option => {
      option.debug();
    });
    this.get('commands').forEach(command => {
      command.debug();
    });
  }

  usage () {
    console.log();
    console.log(chalk.yellow('Usage:'));

    console.log('%s    %s%s      %s',
      chalk.green(this.get('name')),
      this.get('options').isEmpty() ? '' : '[options] ',
      this.get('commands').isEmpty() ? '' : '[commands] ',
      this.get('description')
    );
  }

  help () {
    var fmt      = this.get('formatter');
    var padCmd   = fmt.padCommand();
    var padOpt   = fmt.padOption();
    var padShort = fmt.padShortOption();
    var padDesc  = fmt.padDescription();
    var version  = this.get('version');
    console.log('%s %s',
      chalk.green(this.get('name')),
      version ? chalk.yellow('v' + version) : '');

    this.usage();

    if (!this.get('options').isEmpty()) {
      console.log();
      console.log(chalk.yellow('Options:'));
      this.get('options').forEach(option => {
        console.log('%s %s%s',
          padShort(option.get('short')),
          padOpt(option.get('long')),
          option.get('description'));
      });
    }
    if (!this.get('commands').isEmpty()) {
      console.log();
      console.log(chalk.yellow('Available Subcommands:'));

      this.get('commands').forEach(command => {
        var subCommands = command.get('commands').keySeq().toArray();
        if (subCommands.length > 0) {
          subCommands = util.format('[%s]', subCommands.join(' | '));
        }
        console.log('  %s %s %s',
          padCmd(chalk.green(command.get('name'))),
          padDesc(command.get('description')),
          subCommands
        );
      });
    }
    console.log();
  }

  getCommand (name) {
    return this._config.getIn(['commands', name]);
  }

  /**
   * Returns the value for an applied option.
   *
   * @param  {string} key the option key (short, long, or key)
   * @return {string}     the value for the specified option.
   */
  getOption (key) {
    var args = this.get('args');
    var option = this.get('options').find(v => {

      var res = v.get('arg') === key ||
        v.get('short') === key ||
        v.get('long') === key;
      return res;
    });

    if (option !== undefined) {
      return option.getArgValue(args);
    } else {
      // If not here, serach for the option in subcommands.
      this.get('commands').forEach(command => {
        debug.log('GETOPTION: SEARCH SUBCOMMAND');
        var subOption = command.getOption(key);
        if (subOption !== undefined) {
          return subOption;
        }
      });
    }
  }

  run (optionsList, rootCommand) {
    var args = this.get('args');

    if (optionsList === undefined) {
      optionsList = this.get('options');
    } else {
      optionsList = optionsList.concat(this.get('options'));
    }

    var before = this.get('before');
    if (before) {
      debug.log('RUN ACTION: %s', this.get('name'));
      var res = before(this, this.get('rootArgs'), optionsList);
    }
    debug.log('running %s with args:', this.get('name'), args);
    var positionalArgs = args.get('_');
    if (positionalArgs && positionalArgs.size > 0) {
      var commandArg = positionalArgs.get(0);
      var command = this._config.getIn(['commands', commandArg]);
      if (command !== undefined) {
        // var recursionArgs = args.set('_', positionalArgs.shift());
        var res = command.run(optionsList, rootCommand);
        if (res === RETURN_VALUE_FAILURE) {
          // command.help();
        }
        return res;
      } else {
        if (commandArg === 'help') {
          _handleHelpCommand(this, positionalArgs);
        }
      }
    }
    var action = this.get('action');
    if (action) {
      debug.log('RUN ACTION: %s', this.get('name'));
      var res = action(this, this.get('rootArgs'), optionsList);
      if (res === undefined) {
        res = RETURN_VALUE_SUCCESS;
      }
      return res;
    } else {
      console.error('No action defined for the given command');
      this.help();
      return RETURN_VALUE_FAILURE;
    }
  }

  args (args, rootArgs) {
    if (!args) {
      return this;
    }
    if (!(args instanceof Immutable.Map)) {
      args = Immutable.fromJS(minimist(args));
    }
    if (rootArgs === undefined || rootArgs === null) {
      rootArgs = args;
    }

    if (this.validateArgs(args)) {

      return new Commando(this._config.set('args', args)
      .set('rootArgs', rootArgs)
      .set('commands', this.subcommandsWitArgs(args, rootArgs))
    );
    } else {
      debug.log('invalid args');
      this.help();
      return this;
    }
  }

  subcommandsWitArgs (args, rootArgs) {
    var positionalArgs = args.get('_');
    var subcommands = this.get('commands');
    // debug.log('subcommandsWitArgs', args);
    if (positionalArgs && positionalArgs.size > 0) {
      var commandArg = positionalArgs.get(0);
      // debug.log('subcommandsWitArgs arg', commandArg);
      subcommands = subcommands.map((command, name) => {
        // debug.log('subcommandsWitArgs cmd', name);
        if (name === commandArg) {
          var recursionArgs = args.set('_', positionalArgs.shift());
          return command.args(recursionArgs, rootArgs);
        } else {
          return command;
        }
      });
    }
    return subcommands;
  }

  validateArgs (args) {
    debug.log('validate', args);
    var valid = true;
    // this.get('options').forEach(function (option) {
    //
    // });
    return valid;
  }

  helpCommand () {
    var parentCommand = this;
    return new Commando({ name: 'help' })
    .action(() => {
      debug.log('args', arguments);
      return parentCommand.help();
    });
  }

  /**
   * Commando default configuration.
   *
   * @return {Immutable.Map} the default (empty) configuration for commando.
   */
  static defaultConfig () {
    return Immutable.fromJS({
      action: null,
      aliases: Immutable.List(),
      args: Immutable.Map(),
      before: null,
      commands: Immutable.Map(),
      formatter: new Formatter(),
      description: '',
      name: null,
      options: Immutable.List(),
      rootArgs: Immutable.Map(),
      version: null,
    });
  }

  static setDebugLevel (level) {
    debug.debugLevel = level;
  }
}

// Helper functions
function _handleHelpCommand(command, positionalArgs) {
  var index = 1;
  var subCommand = command;
  var subCommandArg = positionalArgs.get(index);
  // Show sub command help if there's another parameter
  while (subCommandArg) {
    var subSubCommand = subCommand.getCommand(subCommandArg);
    if (subSubCommand) {
      debug.log('HELP: SUBCOMMAND', subCommand);
      // We need to go deeper!
      subCommand = subSubCommand;
      index++;
      subCommandArg = positionalArgs.get(index);
    } else {
      break;
    }
  }
  return subCommand.help();
}

// Static class variables
Commando.Command = Commando;
Commando.Option = Option;
Commando.RETURN_VALUE_SUCCESS = RETURN_VALUE_SUCCESS;
Commando.RETURN_VALUE_FAILURE = RETURN_VALUE_FAILURE;

module.exports = Commando;
