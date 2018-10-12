'use strict';

/**
 * Commando class definition.
 */
// Import Classes
import { formatter, Formatter } from './Formatter';
import Option from './Option';
import Argument from './Argument';

// Import Libraries
import * as Immutable from 'immutable';
import * as chalk from 'chalk';
import completion from './completion';
import debug from './debug';
import * as minimist from 'minimist';
import * as util from 'util';

// Polyfills
import 'ts-polyfill/lib/es2015-collection';
import { parse } from 'path';

// Define Constants
const RETURN_VALUE_SUCCESS = true;
const RETURN_VALUE_FAILURE = false;

/**
 * Represents a command or subcommand.
 */
export default class Commando {
  config!: Immutable.Map<string, any>;
  /**
   * Create a Commando from a string, object or Commando.
   *
   * @param config A name, config object or Commando.
   */
  constructor(config?: string | object | Commando) {
    if (config instanceof Commando) {
      return config;
    }

    let configObject = config;
    if (typeof config === 'string') {
      // Allow to set name as the parameter.
      configObject = { name: config };
    }

    this.config = Commando.defaultConfig().merge(Immutable.fromJS(configObject));
    Object.freeze(this);
  }

  /**
   * Returns a new Commando with the same config and a given version number.
   *
   * @param  {string} version A version number.
   * @return {Commando}       A Commando with the given version number.
   */
  version(version) {
    return new Commando(this.config.set('version', version));
  }

  /**
   * Returns a new Commando with the same config and a given name.
   *
   * @param  {string} name  A name string.
   * @return {Commando}     A Commando with the given name apllied to it.
   */
  name(name) {
    return new Commando(this.config.set('name', name));
  }

  /**
   * Returns a new Commando with the same config and a given description.
   *
   * @param  {string} description  A description string.
   * @return {Commando}     A Commando with the given description apllied to it.
   */
  description(description) {
    return new Commando(this.config.set('description', description));
  }

  /**
   * Gets a property of the Commando instance.
   *
   * @param  {string} key The name of the property to get.
   * @return {*}          The value of the property.
   */
  get(key) {
    return this.config.get(key);
  }

  /**
   * Returns a commando with a new subcommand added to it.
   *
   * @param  {Commando} command  A sub command to add to the current instance.
   * @return {Commando}          A Commando with the given command.
   */
  command(command: Commando) {
    const newCommand = new Commando(command);
    if (!newCommand.get('name')) {
      throw new Error('Command needs a name');
    }
    const newConfig = this.config.setIn(
      ['commands', newCommand.get('name')],
      newCommand,
    );
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
  option(optstring: string, description?: string, defaultValue?: any) {
    const option = new Option(optstring, description, defaultValue);
    const options = this.get('options');

    return new Commando(this.config.set('options', options.push(option)));
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
  argument(optstring: string, description?: string, defaultValue?: any) {
    const arg = new Argument(optstring, description, defaultValue);
    const args = this.get('arguments');
    const newConfig = this.config.set('arguments', args.push(arg));
    return new Commando(newConfig);
  }

  /**
   * Returns a commando with a new action added to it.
   *
   * @param  {function} action  An action callback for this command.
   * @return {Commando}         A Commando with the given action.
   */
  action(action) {
    return new Commando(this.config.set('action', action));
  }

  /**
   * Returns a commando with a before callback set to 'before'.
   *
   * @param  {Commando} before  A sub command to add to the current instance.
   * @return {Commando}         A Commando with the given command.
   */
  before(before) {
    return new Commando(this.config.set('before', before));
  }

  /**
   * Prints out debugging information.
   */
  debug() {
    debug.log('Command:');
    debug.log('Name: %s, Version: %s', this.get('name'), this.get('version'));
    this.get('options').forEach((option) => {
      option.debug();
    });
    this.get('commands').forEach((command) => {
      command.debug();
    });
  }

  /**
   * Prints usage information.
   *
   * @access private
   */
  usage() {
    const fmt: Formatter = this.get('formatter');
    const padCmd = fmt.padSubCommand();
    const padOpts = fmt.padSubCommandOption();
    const options = this.get('options').isEmpty() ? '' : '[options] ';
    const commands = this.get('commands').isEmpty() ? '' : '[commands]';
    console.log();
    console.log(chalk.yellow('Usage:'));

    console.log(
      '%s%s%s',
      padCmd(chalk.green(this.get('name'))),
      padOpts(options + commands),
      this.get('description'),
    );
  }

  /**
   * Prints user facing command help.
   */
  help() {
    const fmt = this.get('formatter');
    const padCmd = fmt.padCommand();
    const padOpt = fmt.padOption();
    const padArg = fmt.padArgument();
    const padShort = fmt.padShortOption();
    const padDesc = fmt.padDescription();
    const version = this.get('version');
    console.log(
      '%s %s',
      chalk.green(this.get('name')),
      version ? chalk.yellow(`v${version}`) : '',
    );

    this.usage();

    if (!this.get('options').isEmpty()) {
      console.log();
      console.log(chalk.yellow('Options:'));
      this.get('options').forEach((option) => {
        console.log(
          '%s %s%s',
          padShort(option.get('short')),
          padOpt(option.get('long')),
          padArg(option.get('arg'), option.get('required')),
          option.get('description'),
        );
      });
    }
    if (!this.get('commands').isEmpty()) {
      console.log();
      console.log(chalk.yellow('Available Subcommands:'));

      this.get('commands').forEach((command) => {
        let subCommands = command
          .get('commands')
          .keySeq()
          .toArray();
        if (subCommands.length > 0) {
          subCommands = util.format('[%s]', subCommands.join(' | '));
        }
        console.log(
          '  %s %s %s',
          padCmd(chalk.green(command.get('name'))),
          padDesc(command.get('description')),
          subCommands,
        );
        const cmdArguments = command.get('arguments');
        if (cmdArguments.size > 0) {
          const argsArr = cmdArguments.map(a => a.get('arg')).toArray();
          let paramList = '';
          if (argsArr.length > 0) {
            paramList = `<${argsArr.join('> <')}>`;
          }
          console.log(
            '  %s %s',
            padCmd(''),
            padDesc(chalk.bold('parameters: ') + paramList),
          );
        }
        console.log('');
      });
      console.log(
        '\n run %s for more help.',
        chalk.yellow(this.get('name'), ' help <subcommand>'),
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
  handleDefaultCommands(commandArg, positionalArgs) {
    if (commandArg === 'help') {
      handleHelpCommand(this, positionalArgs);
      return true;
    }

    if (commandArg === 'completion') {
      console.log(completion.bashCompletion(this));
      return true;
    }

    if (commandArg === 'get-commando-completions') {
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
  getCommand(name) {
    return this.config.getIn(['commands', name]);
  }

  /**
   * Returns the value for an applied option.
   *
   * @param  {string} key the option key (short, long, or key)
   * @return {string}     the value for the specified option.
   */
  getOption(key) {
    const args = this.get('args');
    const option = this.get('options').find((v) => {
      const res =
        v.get('arg') === key || v.get('short') === key || v.get('long') === key;
      return res;
    });

    if (option !== undefined) return option.getArgValue(args);

    // If not here, serach for the option in subcommands.
    this.get('commands').forEach((command) => {
      debug.log('GETOPTION: SEARCH SUBCOMMAND');
      const subOption = command.getOption(key);
      if (subOption !== undefined) {
        return subOption;
      }
    });
  }

  getArgument(key: string): string | null {
    const index = this.get('arguments').findIndex(a => a.get('arg') === key);
    const positional = this.get('args').get('_');
    return positional.get(index);
  }

  requireArgument(key: string) {
    const value = this.getArgument(key);
    if (!value) {
      console.log(chalk.red('Error: required argument <%s> not found.'), key);
      this.help();
      process.exit();
    }
    return value;
  }

  requireOption(key) {
    const value = this.getOption(key);
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
  getOptionsHash() {
    const args = this.get('args');
    const optHash = {};
    this.get('options').forEach((v) => {
      const val = v.getArgValue(args);
      optHash[v.get('arg')] = val;
      optHash[v.get('short')] = val;
      optHash[v.get('long')] = val;
    });
    return optHash;
  }

  /**
   * Runs the command based on set arguments.
   *
   * @param  {Command} [rootCommand] The root command, if different from this.
   * @return {boolean}               The return value from the run.
   *
   * @see {@link Commando#args}
   */
  run(rootCommand = this, cmdContext?: Map<string, any>) {
    const args = this.get('args');
    const positionalArgs = args.get('_');
    const before = this.get('before');
    const context = cmdContext || new Map<string, any>();

    if (before) {
      debug.log('RUN ACTION: %s', this.get('name'));
      const res = before(this, this.get('rootArgs'), context);
    }
    debug.log('running %s with args:', this.get('name'), args);
    if (positionalArgs && positionalArgs.size > 0) {
      const commandArg = positionalArgs.get(0);
      const command = this.config.getIn(['commands', commandArg]);
      if (command !== undefined) {
        // let recursionArgs = args.set('_', positionalArgs.shift())
        const res = command.run(rootCommand, context);
        return res;
      }

      if (this.handleDefaultCommands(commandArg, positionalArgs)) {
        return;
      }
    }
    const action = this.get('action');
    if (action) {
      debug.log('RUN ACTION: %s', this.get('name'));
      let res = action(this, rootCommand, context);
      if (res === undefined) {
        res = RETURN_VALUE_SUCCESS;
      }
      return res;
    }

    console.error('No action defined for the given command');
    this.help();
    return RETURN_VALUE_FAILURE;
  }

  /**
   * Returns a Command with arguments applied to it.
   *
   * @param  {array} args               Arguments array. Usually they will be
   * process.argv.slice([2]).
   * @param  {Immutable.Map} [rootArgs] Arguments of the root command.
   * @return {Commando}                 The new Commando.
   */
  args(args?, rootArgs?) {
    if (!args) {
      return this;
    }
    let parsedArguments = args;
    if (!(args instanceof Immutable.Map)) {
      parsedArguments = Immutable.fromJS(minimist(args));
    }

    const rootArguments = rootArgs || parsedArguments;

    if (this.validateArgs(parsedArguments)) {
      return new Commando(
        this.config
          .set('args', parsedArguments)
          .set('rootArgs', rootArguments)
          .set('commands', this.subcommandsWitArgs(parsedArguments, rootArguments)),
      );
    }
    debug.log('invalid args');
    this.help();
    return this;
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
  subcommandsWitArgs(args, rootArgs) {
    const positionalArgs = args.get('_');
    let subcommands = this.get('commands');
    // debug.log('subcommandsWitArgs', args)
    if (positionalArgs && positionalArgs.size > 0) {
      const commandArg = positionalArgs.get(0);
      // debug.log('subcommandsWitArgs arg', commandArg)
      subcommands = subcommands.map((command, name) => {
        // debug.log('subcommandsWitArgs cmd', name)
        if (name === commandArg) {
          const recursionArgs = args.set('_', positionalArgs.shift());
          return command.args(recursionArgs, rootArgs);
        }
        return command;
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
  validateArgs(args) {
    debug.log('validate', args);
    const valid = true;
    debug.log('validate arguments', args);
    args.forEach((value, arg) => {
      debug.log('arg', arg);
      if (arg !== '_') {
        const option = this.getOption('arg');
        if (option) {
          debug.log('option', option);
          debug.log('val', typeof value);

          if (option.get('required') === true && typeof value === 'boolean') {
            debug.error(`Missing required value for argument ${arg}`);
            this.help();
            process.exit();
          }
        }
      } else {
        // Positional arguments
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
  helpCommand(...args) {
    return new Commando({ name: 'help' }).action(() => {
      debug.log('args', ...args);
      return this.help();
    });
  }

  /**
   * Commando default configuration.
   *
   * @access private
   * @return {Immutable.Map} the default (empty) configuration for commando.
   */
  static defaultConfig() {
    return Immutable.fromJS({
      action: null,
      aliases: Immutable.List(),
      args: Immutable.Map<string, Immutable.List<string>>(),
      before: null,
      commands: Immutable.Map(),
      description: '',
      name: null,
      options: Immutable.List(),
      arguments: Immutable.List(),
      rootArgs: Immutable.Map(),
      version: null,
    }).set('formatter', formatter);
  }

  /**
   * Sets the debug level for which messages will be printed.
   *
   * @param {int} level the debug level
   *
   * @see {@link option.js}
   */
  static setDebugLevel(level) {
    debug.debugLevel = level;
  }

  // Static class variables
  // tslint:disable-next-line:variable-name
  static Command = Commando;
  static Option = Option;
  static RETURN_VALUE_SUCCESS = RETURN_VALUE_SUCCESS;
  static RETURN_VALUE_FAILURE = RETURN_VALUE_FAILURE;
}

// Helper functions
function handleHelpCommand(command, positionalArgs) {
  let index = 1;
  let subCommand = command;
  let subCommandArg = positionalArgs.get(index);
  // Show sub command help if there's another parameter
  while (subCommandArg) {
    const subSubCommand = subCommand.getCommand(subCommandArg);
    if (subSubCommand) {
      debug.log('HELP: SUBCOMMAND', subCommand);
      // We need to go deeper!
      subCommand = subSubCommand;
      index += 1;
      subCommandArg = positionalArgs.get(index);
    } else {
      break;
    }
  }
  return subCommand.help();
}
