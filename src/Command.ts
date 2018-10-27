import Immutable from 'immutable';
import { Runtime } from 'inspector';



export enum ReturnValue {
  FAILURE = 0,
  SUCCESS = 1,
}

export type ArgDefinition<T> = {
  name: string,
  short?: string,
  long?: string,
  description?: string,
  default?: T,
}

export type PositionalArgDefinition<T> = {
  name: string,
  description?: string,
  default?: T,
}

export type RuntimeState = Immutable.Map<string, any>;
export type Handler = (command: Command, runtimeState: RuntimeState) => Promise<ReturnValue> | void;
export type PreProcessor = (command: Command, runtimeState: RuntimeState) => RuntimeState;

export type StoredArgDefinition<T> = Immutable.Map<string, Readonly<ArgDefinition<T>>>;

export interface Command {
  withVersion: (version: string) => Command;
  withDescription: (description: string) => Command;
  withFlag: (definition: ArgDefinition<boolean>) => Command;
  withStringArg: (definition: ArgDefinition<string>) => Command;
  withNumberArg: (definition: ArgDefinition<number>) => Command;
  withStringArrayArg: (definition: ArgDefinition<string[]>) => Command;
  withPositionalString: (definition: PositionalArgDefinition<string>) => Command;
  withPositionalNumber: (definition: PositionalArgDefinition<number>) => Command;
  withSubCommand: (subCommand: Command) => Command;
  withRuntimeArgs: (args?: string[]) => Command;
  withHandler: (fn: Handler) => Command;
  withPreProcessor: (fn: PreProcessor) => Command;
  run: (state?: RuntimeState) => Promise<ReturnValue>;

  state: CommandState;
}

interface CommandState {
  name: string;
  version?: string;
  description?: string;
  handler?: Handler;
  preProcessor?: PreProcessor;
  flags: StoredArgDefinition<boolean>;
  stringArgs: StoredArgDefinition<string>;
  numberArgs: StoredArgDefinition<number>;
  stringArrayArgs: StoredArgDefinition<string[]>;
  positionalStringArgs: Immutable.Map<string, PositionalArgDefinition<string>>;
  positionalNumberArgs: Immutable.Map<string, PositionalArgDefinition<number>>;
  subCommands: Immutable.Map<string, Command>;
  runtimeArgs: Immutable.List<string>;
}

export function create(name: string): Command {
  return withState({
    name,
    flags: Immutable.Map(),
    stringArgs: Immutable.Map(),
    numberArgs: Immutable.Map(),
    stringArrayArgs: Immutable.Map(),
    positionalStringArgs: Immutable.Map(),
    positionalNumberArgs: Immutable.Map(),
    subCommands: Immutable.Map(),
    runtimeArgs: Immutable.List(),
  });
}

function withState (initialState: CommandState): Command {
  const cmd: Command = {
    withVersion,
    withDescription,
    withFlag,
    withStringArg,
    withNumberArg,
    withStringArrayArg,
    withPositionalString,
    withPositionalNumber,
    withSubCommand,
    withRuntimeArgs,
    withHandler,
    withPreProcessor,
    run,
    
    state: Object.freeze(initialState),
  };


  function withVersion(version: string): Command {
    return withState({...cmd.state, version});
  }

  function withDescription(description: string): Command {
    return withState({...cmd.state, description});
  }

  function withFlag(definition: ArgDefinition<boolean>): Command {
    return replacing(cmd.state, definition, 'flags');
  }

  function withStringArg(definition: ArgDefinition<string>): Command {
    return replacing(cmd.state, definition, 'stringArgs');
  }

  function withNumberArg(definition: ArgDefinition<number>): Command {
    return replacing(cmd.state, definition, 'numberArgs');
  }

  function withStringArrayArg(definition: ArgDefinition<string[]>): Command {
    return replacing(cmd.state, definition, 'stringArrayArgs');
  }

  function withPositionalString(definition: PositionalArgDefinition<string>): Command {
    return replacing(cmd.state, definition, 'positionalStringArgs');
  }

  function withPositionalNumber(definition: PositionalArgDefinition<number>): Command {
    return replacing(cmd.state, definition, 'positionalNumberArgs');
  }

  function withSubCommand(subCommand: Command): Command {
    if (cmd.state.subCommands.has(subCommand.state.name)) {
      throw new TypeError(`arg already exists: ${subCommand.state.name}`);
    }
    const subCommands = cmd.state.subCommands.set(subCommand.state.name, subCommand);
    return withState({...cmd.state, subCommands});
  }

  function withRuntimeArgs(args?: string[]): Command {
    const commandArgs = args || process.argv.slice(2);
    const runtimeArgs = cmd.state.runtimeArgs.push(...commandArgs);
    // TODO: parse the arguments!
    return withState({...cmd.state, runtimeArgs});
  }

  function withHandler(fn: Handler): Command {
    return withState({...cmd.state, handler: fn});
  }
  
  function withPreProcessor(fn: PreProcessor): Command {
    return withState({...cmd.state, preProcessor: fn});
  }

  function run(state?: RuntimeState): Promise<ReturnValue> {
    let runtimeState: RuntimeState = state || Immutable.Map();
    if (cmd.state.preProcessor) {
      runtimeState = cmd.state.preProcessor(cmd, runtimeState);
    }
    // Subcommand
    const arg0 = cmd.state.runtimeArgs.first() as string | undefined;
    // If a subCommand exists with name as the first argument, recurse.
    if (arg0 && cmd.state.subCommands.has(arg0)) {
      const subCommand = cmd.state.subCommands.get(arg0)!;
      return subCommand
      .withRuntimeArgs(cmd.state.runtimeArgs.slice(1).toArray())
      .run(runtimeState);
    }
    // Handler for the current command
    if (!cmd.state.handler) {
      console.warn(`no handler set for command ${cmd.state.name}`);
      return Promise.resolve(ReturnValue.FAILURE);
    }
    return cmd.state.handler(cmd, runtimeState) || Promise.resolve(ReturnValue.SUCCESS);
  }

  return Object.freeze(cmd);
}

function checkUniqueDefinition<T>(definition: ArgDefinition<T>, list: Immutable.Map<string, ArgDefinition<T>>) {
  if (list.has(definition.name)) {
    throw new TypeError(`arg already exists: ${definition.short} ${definition.long}`);
  }
}

function replacing<T>(state: CommandState, definition: ArgDefinition<T>, key: keyof CommandState): Command {
  const map = state[key] as StoredArgDefinition<T>;
  checkUniqueDefinition(definition, map);
  const val = map.set(definition.name, Object.freeze({...definition}));
  return withState({...state, [key]: val});
}

const Command = {
  create,
};

export default Command;