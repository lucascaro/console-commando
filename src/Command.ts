import * as immutable from 'immutable';
import { addOption, combinedOptions, combinedArguments, parseArgv } from './helpers/args';
import colors from './helpers/colors';
import { formatParsedArgs, formatHelp } from './helpers/format';
import * as Debug from 'debug';
import * as completion from './helpers/completion';

const debug = Debug('console-commando:Command');

export enum ReturnValue {
  FAILURE = 0,
  SUCCESS = 1,
}

export interface Option<T> {
  name: string;
  short?: string;
  long?: string;
  description?: string;
  multiple?: boolean;
  required?: boolean;
  default?: T | T[];
}

export interface TypeNamedOption<T> extends Option<T>{
  typeName: string;
}

export interface Argument<T> {
  name: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  default?: T | T [];
}

export interface TypeNamedArgument<T> extends Argument<T> {
  typeName: string;
}

export type RuntimeState = immutable.Map<string, any>;
export type Handler = (command: Command, runtimeState: RuntimeState) => Promise<ReturnValue> | void;
export type PreProcessor = (command: Command, runtimeState: RuntimeState) => RuntimeState | void;

export type StoredOption<T> = immutable.Map<string, Readonly<TypeNamedOption<T>>>;
export type AllStoredOptions = StoredOption<boolean|string|number>;

export type StoredArgument<T> = immutable.Map<string, Readonly<TypeNamedArgument<T>>>;
export type AllStoredArguments = StoredArgument<string|number>;
export type ParsedRuntimeArgs = immutable.Map<string, boolean|string|number|string[]>;

export type SubCommands = immutable.Map<string, Command>;

export interface Command {
  withVersion: (version: string) => Command;
  withDescription: (description: string) => Command;
  withFlag: (definition: Option<boolean>) => Command;
  withStringOption: (definition: Option<string>) => Command;
  withNumberOption: (definition: Option<number>) => Command;
  withPositionalString: (definition: Argument<string>) => Command;
  withPositionalNumber: (definition: Argument<number>) => Command;
  getFlag: (name: string) => boolean;
  getStringOption: (name: string) => string;
  getNumberOption: (name: string) => number;
  getStringArrayOption: (name: string) => string[];
  getPositionalString: (name: string) => string;
  getPositionalNumber: (name: string) => number;
  withSubCommand: (subCommand: Command) => Command;
  withRuntimeArgs: (args?: string[], parsed?: ParsedRuntimeArgs) => Command;
  withHandler: (fn: Handler) => Command;
  withPreProcessor: (fn: PreProcessor) => Command;
  showHelp: () => void;
  run: (state?: RuntimeState) => Promise<ReturnValue>;

  state: CommandState;
}

export interface CommandState {
  name: string;
  version?: string;
  description?: string;
  handler?: Handler;
  preProcessor?: PreProcessor;
  flags: StoredOption<boolean>;
  stringOptions: StoredOption<string>;
  numberOptions: StoredOption<number>;
  positionalStringArgs: StoredArgument<string>;
  positionalNumberArgs: StoredArgument<number>;
  subCommands: SubCommands;
  runtimeArgs: immutable.List<string>;
  parsedRuntimeArgs: ParsedRuntimeArgs;
}

export function withState(initialState: CommandState): Command {
  const cmd: Command = {
    withVersion,
    withDescription,
    withFlag,
    withStringOption,
    withNumberOption,
    withPositionalString,
    withPositionalNumber,
    getFlag,
    getStringOption,
    getNumberOption,
    getStringArrayOption,
    getPositionalString,
    getPositionalNumber,
    withSubCommand,
    withRuntimeArgs,
    withHandler,
    withPreProcessor,
    showHelp,
    run,

    state: Object.freeze(initialState),
  };

  function withVersion(version: string): Command {
    debug('adding version:', version);
    return withState({ ...cmd.state, version });
  }

  function withDescription(description: string): Command {
    debug('adding description:', description);
    return withState({ ...cmd.state, description });
  }

  function withFlag(definition: Option<boolean>): Command {
    debug('adding flag:', definition);
    return addOption(cmd.state, { ...definition, typeName: '' }, 'flags');
  }

  function withHelp() :Command {
    debug('adding auto help.');
    return cmd.withFlag({
      name: 'help',
      long: 'help',
      short: 'h',
      description: 'Show this help.',
    });
  }

  function withStringOption(definition: Option<string>): Command {
    debug('adding string option:', definition);
    if (definition.default !== undefined
      && !!definition.multiple !== Array.isArray(definition.default)
    ) {
      throw new TypeError('Default value should be an array if multiple is set.');
    }
    return addOption(cmd.state, { ...definition, typeName: 'string' }, 'stringOptions');
  }

  function withNumberOption(definition: Option<number>): Command {
    debug('adding number optino:', definition);
    return addOption(cmd.state, { ...definition, typeName: 'number' }, 'numberOptions');
  }

  function withPositionalString(definition: Argument<string>): Command {
    debug('adding positional string:', definition);
    return addOption(cmd.state, { ...definition, typeName: 'string' }, 'positionalStringArgs');
  }

  function withPositionalNumber(definition: Argument<number>): Command {
    debug('adding positional number:', definition);
    return addOption(cmd.state, { ...definition, typeName: 'number' }, 'positionalNumberArgs');
  }

  function withSubCommand(subCommand: Command): Command {
    debug('adding subcommand:', subCommand.state.name);
    if (cmd.state.subCommands.has(subCommand.state.name)) {
      throw new TypeError(`arg already exists: ${subCommand.state.name}`);
    }
    const subCommands = cmd.state.subCommands.set(subCommand.state.name, subCommand);
    return withState({ ...cmd.state, subCommands });
  }

  function withRuntimeArgs(args?: string[], parsed?: ParsedRuntimeArgs): Command {
    debug('adding runtime arguments:', args);
    debug('inheriting parsed arguments:', parsed);
    const commandArgs = args || process.argv.slice(2);
    const runtimeArgs = cmd.state.runtimeArgs.push(...commandArgs);
    const cmdWithHelp = withHelp();
    if (commandArgs) {
      try {
        const parsedRuntimeArgs = parseArgv(
          commandArgs,
          cmdWithHelp.state.flags,
          combinedOptions(cmdWithHelp.state),
          combinedArguments(cmdWithHelp.state),
          parsed,
        );
        return withState({ ...cmdWithHelp.state, runtimeArgs, parsedRuntimeArgs });
      } catch (e) {
        console.error(colors.red(`\nError: ${e.message}\n`));
        showHelp();
        process.exit(ReturnValue.FAILURE);
      }
    }
    if (parsed) {
      return withState({ ...cmdWithHelp.state, runtimeArgs, parsedRuntimeArgs: parsed });
    }
    return withState({ ...cmdWithHelp.state, runtimeArgs });
  }

  function getFlag(name: string): boolean {
    return !!cmd.state.parsedRuntimeArgs.get(name);
  }

  function getStringOption(name: string): string {
    if (!cmd.state.stringOptions.has(name)) {
      throw new TypeError(`${name} is not a string argument`);
    }
    return cmd.state.parsedRuntimeArgs.get(name) as string;
  }

  function getNumberOption(name: string): number {
    if (!cmd.state.numberOptions.has(name)) {
      throw new TypeError(`${name} is not a numeric argument`);
    }
    return cmd.state.parsedRuntimeArgs.get(name) as number;
  }

  function getStringArrayOption(name: string): string[] {
    const args = cmd.state.stringOptions;
    if (!args.has(name) || !args.get(name)!.multiple) {
      throw new TypeError(`${name} is not a multi argument`);
    }
    return cmd.state.parsedRuntimeArgs.get(name) as string[];
  }

  function getPositionalString(name: string): string {
    if (!cmd.state.positionalStringArgs.has(name)) {
      throw new TypeError(`${name} is not a string positional argument`);
    }
    return cmd.state.parsedRuntimeArgs.get(name) as string;
  }

  function getPositionalNumber(name: string): number {
    if (!cmd.state.positionalNumberArgs.has(name)) {
      throw new TypeError(`${name} is not a string positional argument`);
    }
    return cmd.state.parsedRuntimeArgs.get(name) as number;
  }

  function withHandler(fn: Handler): Command {
    return withState({ ...cmd.state, handler: fn });
  }

  function withPreProcessor(fn: PreProcessor): Command {
    return withState({ ...cmd.state, preProcessor: fn });
  }

  function showHelp(): void {
    console.log(formatHelp(cmd.state));
  }

  async function run(state: RuntimeState = immutable.Map()): Promise<ReturnValue> {
    debug('running command:', cmd.state.name);
    const parsedArgs = cmd.state.parsedRuntimeArgs || immutable.Map();
    const positionalArgs = parsedArgs.get('_', []) as string[];
    const arg0 = positionalArgs[0] as string | undefined;
    const preProcessor = cmd.state.preProcessor;
    const shouldRunSubCommand = !!arg0 && cmd.state.subCommands.has(arg0);
    const helpRequested = arg0 === 'help' || parsedArgs.get('help', false);

    // Default subcommands:
    // help: Show help text if requested.
    if (!shouldRunSubCommand && helpRequested) {
      cmd.showHelp();
      return ReturnValue.SUCCESS;
    }

    // completion: Show help text if requested.
    if (arg0 === 'completion') {
      console.log(completion.bashCompletion(cmd));
      return ReturnValue.SUCCESS;
    }

    if (arg0 === 'get-completions') {
      console.log(completion.getCompletions(cmd));
      return ReturnValue.SUCCESS;
    }

    if (!shouldRunSubCommand && helpRequested) {
      cmd.showHelp();
      return ReturnValue.SUCCESS;
    }

    // Allow optional preprocessor to modify run-time state.
    // TODO: allow async preprocessors.
    const runtimeState = preProcessor ? preProcessor(cmd, state) || state : state;

    // If a subCommand exists with name as the first argument, recurse into it.
    if (shouldRunSubCommand) {
      // We know arg0 is defined because is checked
      const subCommand = cmd.state.subCommands.get(arg0!)!;
      const subArgs = parsedArgs.get('_', []) as string[];
      return subCommand
      .withRuntimeArgs(cmd.state.runtimeArgs.toArray(), parsedArgs.set('_', subArgs.slice(1)))
      .run(runtimeState);
    }

    if (!cmd.state.handler) {
      console.warn(colors.yellow(`No handler defined for command ${cmd.state.name}`));
      cmd.showHelp();
      return ReturnValue.FAILURE;
    }
    // Handle the current command.
    return cmd.state.handler(cmd, runtimeState) || ReturnValue.SUCCESS;
  }

  return Object.freeze(cmd);
}
