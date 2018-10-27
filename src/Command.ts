import immutable from 'immutable';
import { Runtime } from 'inspector';
import colors from './helpers/colors';

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
  default?: T;
}

export interface TypeNamedOption<T> extends Option<T>{
  typeName: string;
}

export interface Argument<T> {
  name: string;
  description?: string;
  required?: boolean;
  default?: T;
}

export interface TypeNamedArgument<T> extends Argument<T> {
  typeName: string;
}

export type RuntimeState = immutable.Map<string, any>;
export type Handler = (command: Command, runtimeState: RuntimeState) => Promise<ReturnValue> | void;
export type PreProcessor = (command: Command, runtimeState: RuntimeState) => RuntimeState;

export type StoredOption<T> = immutable.Map<string, Readonly<TypeNamedOption<T>>>;
export type AllStoredOptions = StoredOption<boolean|string|number|string[]>;

export type StoredArgument<T> = immutable.Map<string, Readonly<TypeNamedArgument<T>>>;
export type AllStoredArguments = StoredArgument<string|number|string[]>;

export interface Command {
  withVersion: (version: string) => Command;
  withDescription: (description: string) => Command;
  withFlag: (definition: Option<boolean>) => Command;
  withStringArg: (definition: Option<string>) => Command;
  withNumberArg: (definition: Option<number>) => Command;
  withStringArrayArg: (definition: Option<string[]>) => Command;
  withPositionalString: (definition: Argument<string>) => Command;
  withPositionalNumber: (definition: Argument<number>) => Command;
  withSubCommand: (subCommand: Command) => Command;
  withRuntimeArgs: (args?: string[]) => Command;
  withHandler: (fn: Handler) => Command;
  withPreProcessor: (fn: PreProcessor) => Command;
  showHelp: () => void;
  run: (state?: RuntimeState) => Promise<ReturnValue>;

  state: CommandState;
}

interface CommandState {
  name: string;
  version?: string;
  description?: string;
  handler?: Handler;
  preProcessor?: PreProcessor;
  flags: StoredOption<boolean>;
  stringArgs: StoredOption<string>;
  numberArgs: StoredOption<number>;
  stringArrayArgs: StoredOption<string[]>;
  positionalStringArgs: StoredArgument<string>;
  positionalNumberArgs: StoredArgument<number>;
  subCommands: immutable.Map<string, Command>;
  runtimeArgs: immutable.List<string>;
}

export function create(name: string): Command {
  return withState({
    name,
    flags: immutable.Map(),
    stringArgs: immutable.Map(),
    numberArgs: immutable.Map(),
    stringArrayArgs: immutable.Map(),
    positionalStringArgs: immutable.Map(),
    positionalNumberArgs: immutable.Map(),
    subCommands: immutable.Map(),
    runtimeArgs: immutable.List(),
  });
}

function withState(initialState: CommandState): Command {
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
    showHelp,
    run,

    state: Object.freeze(initialState),
  };

  function withVersion(version: string): Command {
    return withState({ ...cmd.state, version });
  }

  function withDescription(description: string): Command {
    return withState({ ...cmd.state, description });
  }

  function withFlag(definition: Option<boolean>): Command {
    return replacing(cmd.state, { ...definition, typeName: '' }, 'flags');
  }

  function withStringArg(definition: Option<string>): Command {
    return replacing(cmd.state, { ...definition, typeName: 'string' }, 'stringArgs');
  }

  function withNumberArg(definition: Option<number>): Command {
    return replacing(cmd.state, { ...definition, typeName: 'number' }, 'numberArgs');
  }

  function withStringArrayArg(definition: Option<string[]>): Command {
    return replacing(
      cmd.state,
      {
        ...definition,
        typeName: 'string',
        multiple: true,
      },
      'stringArrayArgs',
    );
  }

  function withPositionalString(definition: Argument<string>): Command {
    return replacing(cmd.state, { ...definition, typeName: 'string' }, 'positionalStringArgs');
  }

  function withPositionalNumber(definition: Argument<number>): Command {
    return replacing(cmd.state, { ...definition, typeName: 'number' }, 'positionalNumberArgs');
  }

  function withSubCommand(subCommand: Command): Command {
    if (cmd.state.subCommands.has(subCommand.state.name)) {
      throw new TypeError(`arg already exists: ${subCommand.state.name}`);
    }
    const subCommands = cmd.state.subCommands.set(subCommand.state.name, subCommand);
    return withState({ ...cmd.state, subCommands });
  }

  function withRuntimeArgs(args?: string[]): Command {
    const commandArgs = args || process.argv.slice(2);
    const runtimeArgs = cmd.state.runtimeArgs.push(...commandArgs);
    // TODO: parse the arguments!
    return withState({ ...cmd.state, runtimeArgs });
  }

  function withHandler(fn: Handler): Command {
    return withState({ ...cmd.state, handler: fn });
  }

  function withPreProcessor(fn: PreProcessor): Command {
    return withState({ ...cmd.state, preProcessor: fn });
  }

  function showHelp(): void {
    const s = cmd.state;
    console.log(colors.green(s.name), colors.yellow(s.version || ''));
    if (s.description) {
      console.log(s.description);
    }
    const options = combinedOptions(cmd);
    const optsHelp = !options.isEmpty() ? '[...options]' : '';

    const args = combinedArguments(cmd);
    const argsHelp = formatArgHelp(args);

    console.log(colors.yellow('\nUsage:'));
    console.log(`    ${colors.green(s.name)} ${optsHelp} ${argsHelp}`);

    if (!options.isEmpty()) {
      console.log(colors.yellow('\nOptions:'));
      printOptions(options);
    }
    console.log('');
  }

  function run(state?: RuntimeState): Promise<ReturnValue> {
    let runtimeState: RuntimeState = state || immutable.Map();
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
      cmd.showHelp();
      return Promise.resolve(ReturnValue.FAILURE);
    }
    return cmd.state.handler(cmd, runtimeState) || Promise.resolve(ReturnValue.SUCCESS);
  }

  return Object.freeze(cmd);
}

function checkUniqueDefinition<T>(definition: Option<T>, list: immutable.Map<string, Option<T>>) {
  if (list.has(definition.name)) {
    throw new TypeError(`arg already exists: ${definition.short} ${definition.long}`);
  }
}

function replacing<T>(
  state: CommandState,
  definition: TypeNamedOption<T>,
  key: keyof CommandState,
): Command {
  const map = state[key] as StoredOption<T>;
  checkUniqueDefinition(definition, map);
  const val = map.set(definition.name, Object.freeze(definition));
  return withState({ ...state, [key]: val });
}

function printColumns(columns: immutable.Map<string, string[]>) {
  if (columns.isEmpty()) { return []; }
  const nCols = (columns.first() as string[]).length;
  const colWidths = columns
    .map(o => o.map(c => c.length))
    .reduce(
      // Reduce to the maximum lengts for each column.
      (p, c) => {
        return p.map((v, i) => Math.max(v, c[i]));
      },
      Array(nCols).fill(0),
    );
  // Pad all cells to the maximum cell width in that column + 3
  const padded = columns.map((o, k) => {
    return o.map((v, i) => v.padEnd(colWidths[i] + 2));
  });

  padded.forEach((opt) => {
    console.log('   ', ...opt);
  });
}
function printOptions(options: AllStoredOptions) {
  const longParam = <T>(o: TypeNamedOption<T>) =>
    o.long && o.typeName !== '' ? `=<${o.typeName}>` : '';
  const optHelp = options.map((o) => {
    const short = o.short ? `-${o.short}` : '';
    const long = o.long ? `--${o.long + longParam(o)}` :'';
    return [`${short},${long}`, o.description || ''];
  });
  printColumns(optHelp);
}

function formatArgHelp(args: AllStoredArguments): string {
  return args
  .map(({ required, name }) => required ? `<${name}>` : `[${name}]`)
  .join(' ');
}

function combinedOptions(cmd: Command): AllStoredOptions {
  const res = cmd.state.flags.merge(
    cmd.state.stringArgs as AllStoredOptions,
    cmd.state.numberArgs,
    cmd.state.stringArrayArgs,
  ).sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

function combinedArguments(cmd: Command): AllStoredArguments {
  const res = cmd.state.positionalNumberArgs.merge(
    cmd.state.positionalStringArgs,
  ).sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

export default {
  create,
};
