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
import chalk from 'chalk';
import completion from './completion';
import debug from './debug';
import * as minimist from 'minimist';
import * as util from 'util';

// Define Constants

export enum ReturnValue {
  FAILURE = 0,
  SUCCESS = 1,
}

export type OptionHash = {
  [key:string]: any,
};
export type CommandContext = Map<string, any>;
export type Action = (
  command: Commando,
  rootCommand: Commando,
  context?: CommandContext,
) => ReturnValue | void | Promise<ReturnValue|void>;

export type ArgumentsMap = Immutable.Map<string, Immutable.List<string>>;
export interface CommandConfig {
  readonly name: string;
  readonly version?: string;
  readonly description: string;
  readonly options: Immutable.List<Option>;
  readonly arguments: Immutable.List<Argument>;
  readonly action?: Action;
  readonly before?: Action;
  readonly commands: Immutable.Map<string, Commando>;
  readonly aliases: Immutable.List<string>;
  // TODO: add explicit type.
  readonly rootArgs: ArgumentsMap;
  // TODO:
  readonly args: Immutable.Map<string, Immutable.List<string>>;
  readonly formatter: Formatter;
}

/**
 * Commando default configuration.
 */
const defaultConfig: CommandConfig = {
  formatter,
  name: '',
  description: '',
  options: Immutable.List(),
  arguments: Immutable.List(),
  commands: Immutable.Map(),
  aliases: Immutable.List(),
  rootArgs: Immutable.Map(),
  args: Immutable.Map(),
};

/**
 * Represents a command or subcommand.
 */
export default class Commando {
  private config!: CommandConfig;

  // TODO: remove
  // config!; : Immutable.Map<string, any>;
  /**
   * Create a Commando from a string, object or Commando.
   *
   * @param config A name, config object or Commando.
   */
  constructor(name: string)
  constructor(command: Partial<CommandConfig>)
  constructor(command: Commando)
  constructor(config: string | Partial<CommandConfig> | Commando) {
    if (config instanceof Commando) {
      return config;
    }

    let configObject: Partial<CommandConfig>;
    if (typeof config === 'string') {
        // Allow to set name as the parameter.
      configObject = { name: config };
    } else {
      configObject = config;
    }

    if (!configObject.name) {
      throw new Error('Command needs a name.');
    }

    this.config = Object.freeze({ ...defaultConfig, ...configObject });
    Object.freeze(this);
  }

  /**
   * Returns a new Commando with the same config and a given version number.
   *
   * @param  version A version number.
   * @return         A Commando with the given version number.
   */
  version(version: string): Commando {
    return new Commando({ ...this.config, version });
  }

  /**
   * Returns a new Commando with the same config and a given name.
   *
   * @param  name  A name string.
   * @return       A Commando with the given name apllied to it.
   */
  name(name: string): Commando {
    return new Commando({ ...this.config, name });
  }

  /**
   * Returns a new Commando with the same config and a given description.
   *
   * @param  description  A description string.
   * @return              A Commando with the given description apllied to it.
   */
  description(description: string) : Commando {
    return new Commando({ ...this.config, description });
  }

  /**
   * Gets a property of the Commando instance.
   *
   * @param  key The name of the property to get.
   * @return     The value of the property.
   */
  get<K extends keyof CommandConfig>(key: K): CommandConfig[K] {
    return this.config[key];
  }

  /**
   * Returns a commando with a new subcommand added to it.
   *
   * @param  command  A sub command to add to the current instance.
   * @return          A Commando with the given command.
   */
  command(command: Commando) : Commando {
    const newCommand = new Commando(command);
    if (!newCommand.get('name')) {
      throw new Error('Command needs a name');
    }
    const name = newCommand.get('name');
    if (this.config.commands.some(c => c.get('name') === name)) {
      throw new Error(`Subcommand named ${name} already exists.`);
    }
    const newConfig = {
      ...this.config,
      commands: this.config.commands.set(name, newCommand),
    };
    return new Commando(newConfig);
  }

  /**
   * Returns a commando with a new option added to it.
   *
   * @param  optstring     An opstring for the new Option.
   * @param  description   A description for the new Option.
   * @param  defaultValue  A default value for the Option.
   *
   * @return               A Commando with the given option.
   *
   * @see {@link Option#constructor}
   */
  option(optstring: string, description ? : string, defaultValue ? : any) : Commando {
    const option = new Option(optstring, description, defaultValue);
    const options = this.get('options');

    return new Commando({ ...this.config, options: options.push(option) });
  }

  /**
   * Returns a commando with a new option added to it.
   *
   * @param  optstring     An opstring for the new Option.
   * @param  description   A description for the new Option.
   * @param  defaultValue  A default value for the Option.
   *
   * @return               A Commando with the given option.
   *
   * @see {@link Option#constructor}
   */
  argument(optstring: string, description ? : string, defaultValue ? : any) : Commando {
    const arg = new Argument(optstring, description, defaultValue);
    const args = this.get('arguments');
    const newConfig = { ...this.config, arguments: args.push(arg) };
    return new Commando(newConfig);
  }

  /**
   * Returns a commando with a new action added to it.
   *
   * @param  action  An action callback for this command.
   * @return         A Commando with the given action.
   */
  action(action: Action) : Commando {
    return new Commando({ ...this.config, action });
  }

  /**
   * Returns a commando with a before callback set to 'before'.
   *
   * @param  before  A sub command to add to the current instance.
   * @return         A Commando with the given command.
   */
  before(before: Action) : Commando {
    return new Commando({ ...this.config, before });
  }

  /**
   * Prints out debugging information.
   */
  debug() {
    debug.log('Command:');
    debug.log('Name: %s, Version: %s', this.get('name'), this.get('version'));
    this.get('options').forEach((option: Option) => {
      option.debug();
    });
    this.get('commands').forEach((command: Commando) => {
      command.debug();
    });
  }

  /**
   * Prints usage information.
   */
  private usage() {
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
   * TODO: refactor / break down.
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
      this.get('options').forEach((option: Option) => {
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

      this.get('commands').forEach((command: Commando) => {
        let subCommands = command
            .get('commands')
            .keySeq()
            .toArray()
            .join(' | ');
        if (subCommands !== '') {
          subCommands = util.format('[%s]', subCommands);
        }
        console.log(
            '  %s %s %s',
            padCmd(chalk.green(command.get('name'))),
            padDesc(command.get('description')),
            subCommands,
          );
        const cmdArguments = command.get('arguments') as Immutable.List<Argument>;
        if (cmdArguments.size > 0) {
          const argsArr = cmdArguments.map(a => a ? a.get('arg') : '').toArray();
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
   * @param commandArg     The command argument.
   * @param positionalArgs The list of remaining positional arguments.
   * @return               True if a default command was found
   */
  private handleDefaultCommands(
    commandArg: string,
    positionalArgs: Immutable.List < any > ,
  ): ReturnValue {
    if (commandArg === 'help') {
      handleHelpCommand(this, positionalArgs);
      return ReturnValue.SUCCESS;
    }

    if (commandArg === 'completion') {
      console.log(completion.bashCompletion(this));
      return ReturnValue.SUCCESS;
    }

    if (commandArg === 'get-commando-completions') {
      console.log(completion.getCompletions(this));
      return ReturnValue.SUCCESS;
    }
    return ReturnValue.FAILURE;
  }

  /**
   * Gets a sub command by name.
   *
   * @param name The name of the desired sub command.
   * @return     The requested command or undefined if not found.
   */
  getCommand(name: string): Commando  | undefined {
    return this.get('commands').get(name);
  }

  /**
   * Returns the value for an applied option.
   *
   * @param key the option key (short, long, or key)
   * @return     the value for the specified option.
   * TODO: return type
   */
  getOption(key: string) : any {
    const args = this.get('args');
    const option = this.get('options').find((v: Option) => {
      const res =
        v.get('arg') === key || v.get('short') === key || v.get('long') === key;
      return res;
    });

    if (option !== undefined) return option.getArgValue(args);

    // If not here, serach for the option in subcommands.
    // TODO: should this search upwards?
    this.get('commands').forEach((command: Commando) => {
      debug.log('GETOPTION: SEARCH SUBCOMMAND');
      const subOption = command.getOption(key);
      if (subOption !== undefined) {
        return subOption;
      }
    });
  }

  /**
   * Returns the value for a positional argument.
   *
   * @param key the option key (short, long, or key)
   * @return     the value for the specified argument.
   */
  getArgument(key: string) : string | undefined {
    const index = this.get('arguments').findIndex((a: Argument) => a.get('arg') === key);
    const positional = this.get('args').get('_');
    return positional ? positional.get(index) : undefined;
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

  requireOption(key: string) {
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
   * @return the option hash.
   */
  getOptionsHash() : OptionHash {
    const args = this.get('args');
    const optHash: OptionHash = {};
    this.get('options').forEach((v: Option) => {
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
   * @param  [rootCommand] The root command, if different from this.
   * @return               The return value from the run.
   *
   * @see {@link Commando#args}
   */
  run(
    rootCommand: Commando = this,
    cmdContext ? : CommandContext,
  ): Promise<ReturnValue> {
    const args = this.get('args');
    const positionalArgs = args.get('_');
    const before = this.get('before');
    const context = cmdContext || new Map<string, any>();

    if (before) {
      debug.log('RUN ACTION: %s', this.get('name'));
      before(this, rootCommand, context);
    }
    debug.log('running %s with args:', this.get('name'), args);
    if (positionalArgs && positionalArgs.size > 0) {
      // existence of commandArg validated on the if above.
      const commandArg = positionalArgs.get(0) as string;
      const command = this.config.commands.get(commandArg);
      if (command !== undefined) {
        return command.run(rootCommand, context);
      }

      const res = this.handleDefaultCommands(commandArg, positionalArgs);
      if (res) {
        return Promise.resolve(res);
      }
    }
    const action = this.get('action');
    if (action) {
      debug.log('RUN ACTION: %s', this.get('name'));
      const res = action(this, rootCommand, context);
      return Promise.resolve(res)
      .then((res) => {
        return res !== undefined ? res : ReturnValue.SUCCESS;
      });
    }

    console.error('No action defined for the given command');
    this.help();
    return Promise.resolve(ReturnValue.FAILURE);
  }

  /**
   * Returns a Command with arguments applied to it.
   *
   * @param  args       Arguments array. Usually they will be process.argv.slice([2]).
   * @param  [rootArgs] Arguments of the root command.
   * @return            The new Commando.
   */
  args(
    args ? : string[] | ArgumentsMap ,
    rootArgs ? : ArgumentsMap,
  ) : Commando {
    if (!args) {
      return this;
    }
    let parsedArguments: ArgumentsMap;
    if (Array.isArray(args)) {
      parsedArguments = Immutable.fromJS(minimist(args));
    } else {
      parsedArguments = args;
    }

    const rootArguments = rootArgs || parsedArguments;

    if (this.validateArgs(parsedArguments)) {
      return new Commando({
        ...this.config,
        args: parsedArguments,
        rootArgs: rootArguments,
        commands: this.subcommandsWitArgs(parsedArguments, rootArguments),
      });
    }
    debug.log('invalid args');
    this.help();
    return this;
  }

  /**
   * Returns all subcommands with 'args' applied to them.
   *
   * @param  args     Arguments
   * @param  rootArgs Root level arguments.
   * @return          Commands with arguments applied
   *
   * @see {@link Commando#args}
   */
  private subcommandsWitArgs(
    args: ArgumentsMap,
    rootArgs: ArgumentsMap,
  ) : Immutable .Map < string, Commando > {
    const positionalArgs = args.get('_');
    let subcommands = this.get('commands');
      // debug.log('subcommandsWitArgs', args)
    if (positionalArgs && positionalArgs.size > 0) {
      const commandArg = positionalArgs.get(0);
        // debug.log('subcommandsWitArgs arg', commandArg)
      subcommands = subcommands.map((command: Commando, name: string) => {
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
  validateArgs(args: ArgumentsMap) {
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
   * Sets the debug level for which messages will be printed.
   *
   * @param level the debug level
   *
   * @see {@link option.js}
   */
  static setDebugLevel(level: number) {
    debug.debugLevel = level;
  }

  // Static class variables
  // tslint:disable-next-line:variable-name
  static Command = Commando;
  static Option = Option;
  static RETURN_VALUE_SUCCESS = ReturnValue.SUCCESS;
  static RETURN_VALUE_FAILURE = ReturnValue.FAILURE;
}

// Helper functions
function handleHelpCommand(command: Commando, positionalArgs: Immutable.List<any>) {
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
