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

var RETURN_VALUE_SUCCESS = true;
var RETURN_VALUE_FAILURE = false;
// var Commando = Immutable.fromJS({});

function Commando(config) {
  if (config instanceof Commando) {
    return config;
  } else if (this instanceof Commando) {
    if (typeof config === 'string') {
      // Allow to set name as the parameter.
      config = { name: config };
    }
    this._config = defaultConfig().merge(Immutable.fromJS(config));
    Object.freeze(this);
  } else {
    return new Commando(config);
  }
}

// Class methods
// Setters / getters
Commando.prototype.version = function (version) {
  return new Commando(this._config.set('version', version));
};

Commando.prototype.name = function (name) {
  return new Commando(this._config.set('name', name));
};

Commando.prototype.description = function (description) {
  return new Commando(this._config.set('description', description));
};

Commando.prototype.get = function (key) {
  return this._config.get(key);
};

// Command related methods
Commando.prototype.command = function (options) {
  var command = new Commando(options);
  var newConfig = this._config.setIn(
    ['commands', command.get('name')],
    command);

  return new Commando(newConfig);
};

Commando.prototype.option = function (optstring, description, defaultValue) {
  var option = new Option(optstring, description, defaultValue);
  var options = this.get('options');

  return new Commando(this._config.set('options', options.push(option)));
};

Commando.prototype.action = function (action) {
  return new Commando(this._config.set('action', action));
};

Commando.prototype.before = function (before) {
  return new Commando(this._config.set('before', before));
};

Commando.prototype.debug = function () {
  debug.log('Command:');
  debug.log('Name: %s, Version: %s', this.get('name'), this.get('version'));
  this.get('options').forEach(function (option) {
    option.debug();
  });
  this.get('commands').forEach(function (command) {
    command.debug();
  });
};

Commando.prototype.usage = function () {
  console.log();
  console.log(chalk.yellow('Usage:'));

  console.log('%s    %s%s      %s',
    chalk.green(this.get('name')),
    this.get('options').isEmpty() ? '' : '[options] ',
    this.get('commands').isEmpty() ? '' : '[commands] ',
    this.get('description')
  );
};

Commando.prototype.help = function () {
  var fmt     = this.get('formatter');
  var padCmd  = fmt.padCommand();
  var padOpt  = fmt.padOption();
  var padDesc = fmt.padDescription();
  var version = this.get('version');
  console.log('%s %s',
    chalk.green(this.get('name')),
    version ? chalk.yellow('v' + version) : '');

  this.usage();

  if (!this.get('options').isEmpty()) {
    console.log();
    console.log(chalk.yellow('Options:'));
    this.get('options').forEach(function (option) {
      console.log('    -%s --%s%s',
        option.get('short'),
        padOpt(option.get('long')),
        option.get('description'));
    });
  }
  if (!this.get('commands').isEmpty()) {
    console.log();
    console.log(chalk.yellow('Available Subcommands:'));

    this.get('commands').forEach(function (command) {
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
};

Commando.prototype.getCommand = function (name) {
  return this._config.getIn(['commands', name]);
};

/**
 * Returns the value for an applied option.
 * @param  {[type]} key the option key (short, long, or key)
 * @return {[type]}     the value for the specified option.
 */
Commando.prototype.getOption = function (key) {
  var args = this.get('args');
  var option = this.get('options').find(function (v) {

    var res = v.get('arg') === key ||
      v.get('short') === key ||
      v.get('long') === key;
    return res;
  });

  if (option !== undefined) {
    return option.getArgValue(args);
  } else {
    // If not here, serach for the option in subcommands.
    this.get('commands').forEach(function (command) {
      debug.log('SERACH SUBC')
      var subOption = command.getOption(key);
      if (subOption !== undefined) {
        return subOption;
      }
    });
  }
};

Commando.prototype.run = function (optionsList, rootCommand) {
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
      var res = command.run(optionsList);
      if (res === RETURN_VALUE_FAILURE) {
        // command.help();
      }
      return res;
    } else {
      if (commandArg == 'help') {
        var index = 1;
        var subCommandArg = positionalArgs.get(index);
        var subCommand = this;
        // Show sub command help if there's another parameter
        while (subCommandArg) {
          var subSubCommand = subCommand.getCommand(subCommandArg);
          if (subSubCommand) {
            debug.log('SUBCOMMAND', subCommand)
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

};

Commando.prototype.args = function (args, rootArgs) {
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
};

Commando.prototype.subcommandsWitArgs = function (args, rootArgs) {
  var positionalArgs = args.get('_');
  var subcommands = this.get('commands');
  // debug.log('subcommandsWitArgs', args);
  if (positionalArgs && positionalArgs.size > 0) {
    var commandArg = positionalArgs.get(0);
    // debug.log('subcommandsWitArgs arg', commandArg);
    subcommands = subcommands.map(function (command, name) {
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
};

Commando.prototype.validateArgs = function (args) {
  debug.log('validate', args);
  var valid = true;
  this.get('options').forEach(function (option) {

  });
  return valid;
};

/**
 * Commando default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
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
Commando.prototype.defaultConfig = defaultConfig;

Commando.prototype.helpCommand = function () {
  var parentCommand = this;
  return new Commando({ name: 'help' })
  .action(function (command) {
    debug.log('args', arguments);
    return parentCommand.help();
  });
};

function setDebugLevel (level) {
  debug.debugLevel = level;
};

// Expose sub classes.
Commando.Command = Commando;
Commando.Option = Option;
Commando.setDebugLevel = setDebugLevel;

module.exports = Commando;
