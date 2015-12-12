'use strict';

/**
 * Commando class definition.
 */

// Import Classes
import Formatter  from './formatter';
import Immutable  from 'immutable';
import Option     from './option';
import Argument   from './arguments';

// Import Libraries
import chalk      from 'chalk';
import completion from './completion';
import debug      from './debug';
import minimist   from 'minimist';
import util       from 'util';

// Define Constants
const RETURN_VALUE_SUCCESS = true;
const RETURN_VALUE_FAILURE = false;

/**
 * Represents a command or subcommand.
 */
export default class Commando {
  /**
   * Create a Commando from a string, object or Commando.
   *
   * @param  {string|object|Commando} config A name, config object or Commando.
   * @return {Commando}               A Commando with the fiven config.
   */
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

  /**
   * Returns a new Commando with the same config and a given version number.
   *
   * @param  {string} version A version number.
   * @return {Commando}       A Commando with the given version number.
   */
  version (version) {
    return new Commando(this._config.set('version', version));
  }

  /**
   * Returns a new Commando with the same config and a given name.
   *
   * @param  {string} name  A name string.
   * @return {Commando}     A Commando with the given name apllied to it.
   */
  name (name) {
    return new Commando(this._config.set('name', name));
  }

  /**
   * Returns a new Commando with the same config and a given description.
   *
   * @param  {string} description  A description string.
   * @return {Commando}     A Commando with the given description apllied to it.
   */
  description (description) {
    return new Commando(this._config.set('description', description));
  }

  /**
   * Gets a property of the Commando instance.
   *
   * @param  {string} key The name of the property to get.
   * @return {*}          The value of the property.
   */
  get (key) {
    return this._config.get(key);
  }

  /**
   * Returns a commando with a new subcommand added to it.
   *
   * @param  {Commando} command  A sub command to add to the current instance.
   * @return {Commando}          A Commando with the given command.
   */
  command (command) {
    var command = new Commando(command);
    if (!command.get('name')) {
      throw new Error('Command needs a name');
    }
    var newConfig = this._config.setIn(
      ['commands', command.get('name')],
      command);
    return new Commando(newConfig);
  }

  /**
   * Returns a commando with a new option added to it.
   *
   * @param  {string} optstring     An opstring for the new Option.
   * @param  {string} description   A description for the new Option.
   * @param  {*}      defaultValue  A default value for the Option.
   *
   * @return {Commando}       A Commando with the given option.
   *
   * @see {@link Option#constructor}
   */
  option (optstring, description, defaultValue) {
    var option = new Option(optstring, description, defaultValue);
    var options = this.get('options');

    return new Commando(this._config.set('options', options.push(option)));
  }

    /**
     * Returns a commando with a new option added to it.
     *
     * @param  {string} optstring     An opstring for the new Option.
     * @param  {string} description   A description for the new Option.
     * @param  {*}      defaultValue  A default value for the Option.
     *
     * @return {Commando}       A Commando with the given option.
     *
     * @see {@link Option#constructor}
     */
    argument (optstring, description, defaultValue) {
      let argument = new Argument(optstring, description, defaultValue);
      let args = this.get('arguments');
      let newConfig = this._config.set('arguments', args.push(argument));
      return new Commando(newConfig);
    }

  /**
   * Returns a commando with a new action added to it.
   *
   * @param  {function} action  An action callback for this command.
   * @return {Commando}         A Commando with the given action.
   */
  action (action) {
    return new Commando(this._config.set('action', action));
  }

  /**
   * Returns a commando with a before callback set to 'before'.
   *
   * @param  {Commando} before  A sub command to add to the current instance.
   * @return {Commando}         A Commando with the given command.
   */
  before (before) {
    return new Commando(this._config.set('before', before));
  }

  /**
   * Prints out debugging information.
   */
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

  /**
   * Prints usage information.
   *
   * @access private
   */
  usage () {
    let fmt      = this.get('formatter');
    let padCmd   = fmt.padSubCommand();
    let padOpts  = fmt.padSubCommandOption();
    let options  = this.get('options').isEmpty() ? '' : '[options] ';
    let commands = this.get('commands').isEmpty() ? '' : '[commands]';
    console.log();
    console.log(chalk.yellow('Usage:'));

    console.log('%s%s%s',
      padCmd(chalk.green(this.get('name'))),
      padOpts(options + commands),
      this.get('description')
    );
  }

  /**
   * Prints user facing command help.
   */
  help () {
    var fmt      = this.get('formatter');
    var padCmd   = fmt.padCommand();
    var padOpt   = fmt.padOption();
    var padArg   = fmt.padArgument();
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
          padArg(option.get('arg'), option.get('required')),
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
      console.log('\n run %s for more help.',
        chalk.yellow(
          this.get('name'),
          ' help <subcommand>'
        )
      );
    }
    console.log();
  }

  /**
   * Utility function for handling default help and completion commands.
   *
   * @param  {string} commandArg             The command argument.
   * @param  {Immutable.List} positionalArgs The list of remaining positional
   * arguments.
   * @return {boolean}                       True if a default command was found
   *
   * @access private
   */
  handleDefaultCommands (commandArg, positionalArgs) {
    if (commandArg === 'help') {
      _handleHelpCommand(this, positionalArgs);
      return true;
    } else if (commandArg === 'completion') {
      console.log(completion.bashCompletion(this));
      return true;
    } else if (commandArg === 'get-commando-completions') {
      console.log(completion.getCompletions(this));
      return true;
    }
    return false;
  }

  /**
   * Gets a sub command by name.
   *
   * @param  {string} name          The name of the desired sub command.
   * @return {Commando|undefined}   The requested command or undefined if
   *  not found.
   */
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
    let args = this.get('args');
    let option = this.get('options').find(v => {

      let res = v.get('arg') === key ||
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
        let subOption = command.getOption(key);
        if (subOption !== undefined) {
          return subOption;
        }
      });
    }
  }

  requireOption (key) {
    let value = this.getOption(key);
    if (!value) {
      console.log(chalk.red('Error: required option <%s> not found.'), key);
      this.help();
      process.exit();
    }
    return value;
  }

  /**
   * Returns an object with option names as keys and option values as values.
   *
   * @return {object}     the option hash.
   */
  getOptionsHash () {
    let args = this.get('args');
    let optHash = {};
    this.get('options').forEach(v => {
      let val = v.getArgValue(args);
      optHash[v.get('arg')] = val;
      optHash[v.get('short')] = val;
      optHash[v.get('long')] = val;
    });
    return optHash;
  }

  /**
   * Runs the command based on previously set arguments.
   *
   * @param  {Command} [rootCommand] The root command, if different from this.
   * @return {boolean}               The return value from the run.
   *
   * @see {@link Commando#args}
   */
  run (rootCommand = this) {
    var args = this.get('args');
    var positionalArgs = args.get('_');
    var before = this.get('before');

    if (before) {
      debug.log('RUN ACTION: %s', this.get('name'));
      var res = before(this, this.get('rootArgs'), positionalArgs);
    }
    debug.log('running %s with args:', this.get('name'), args);
    if (positionalArgs && positionalArgs.size > 0) {
      var commandArg = positionalArgs.get(0);
      var command = this._config.getIn(['commands', commandArg]);
      if (command !== undefined) {
        // var recursionArgs = args.set('_', positionalArgs.shift());
        var res = command.run(rootCommand, positionalArgs);
        return res;
      } else {
        if (this.handleDefaultCommands(commandArg, positionalArgs)) {
          return;
        }
      }
    }
    var action = this.get('action');
    if (action) {
      debug.log('RUN ACTION: %s', this.get('name'));
      var res = action(this, rootCommand, positionalArgs);
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

  /**
   * Returns a Command with arguments applied to it.
   *
   * @param  {array} args               Arguments array. Usually they will be
   * process.argv.slice([2]).
   * @param  {Immutable.Map} [rootArgs] Arguments of the root command.
   * @return {Commando}                 The new Commando.
   */
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

  /**
   * Returns all subcommands with 'args' applied to them.
   *
   * @access private
   * @param  {array|Immutable.Map} args     Arguments
   * @param  {array|Immutable.Map} rootArgs Root level arguments.
   * @return {Immutable.List}               Commands with arguments applied
   *
   * @see {@link Commando#args}
   */
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

  /**
   * Validates arguments.
   *
   * @access private
   * @param  {Immutable.Map} args Arguments map to validate.
   * @return {boolean}            True if arguments are valid.
   */
  validateArgs (args) {
    debug.log('validate', args);
    var valid = true;
    debug.log('validate arguments', args);
    args.forEach((value, arg) => {
      debug.log('arg', arg);
      if (arg !== '_') {
        let option = this.getOption('arg');
        if (option) {
          debug.log('option', option);
          debug.log('val', typeof value);

          if (option.get('required') === true && typeof value === 'boolean') {
            debug.error(`Missing required value for argument ${arg}`);
            this.help();
            process.exit();
          }
        }
      }
    });
    return valid;
  }

  /**
   * Returns a new Command that prints help.
   *
   * @access private
   * @return {Commando} A command with an action that prints help.
   */
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
   * @access private
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
      arguments: Immutable.List(),
      rootArgs: Immutable.Map(),
      version: null,
    });
  }

  /**
   * Sets the debug level for which messages will be printed.
   *
   * @param {int} level the debug level
   *
   * @see {@link option.js}
   */
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
