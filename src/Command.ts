import * as immutable from 'immutable';
import argvParser from './helpers/argvParser';
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

interface CommandState {
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
    return withState({ ...cmd.state, version });
  }

  function withDescription(description: string): Command {
    return withState({ ...cmd.state, description });
  }

  function withFlag(definition: Option<boolean>): Command {
    return addOption(cmd.state, { ...definition, typeName: '' }, 'flags');
  }

  function withHelp() :Command {
    return cmd.withFlag({
      name: 'help',
      long: 'help',
      short: 'h',
      description: 'Show this help.',
    });
  }

  function withStringOption(definition: Option<string>): Command {
    if (definition.default !== undefined
      && !!definition.multiple !== Array.isArray(definition.default)
    ) {
      throw new TypeError('Default value should be an array if multiple is set.');
    }
    return addOption(cmd.state, { ...definition, typeName: 'string' }, 'stringOptions');
  }

  function withNumberOption(definition: Option<number>): Command {
    return addOption(cmd.state, { ...definition, typeName: 'number' }, 'numberOptions');
  }

  function withPositionalString(definition: Argument<string>): Command {
    return addOption(cmd.state, { ...definition, typeName: 'string' }, 'positionalStringArgs');
  }

  function withPositionalNumber(definition: Argument<number>): Command {
    return addOption(cmd.state, { ...definition, typeName: 'number' }, 'positionalNumberArgs');
  }

  function withSubCommand(subCommand: Command): Command {
    if (cmd.state.subCommands.has(subCommand.state.name)) {
      throw new TypeError(`arg already exists: ${subCommand.state.name}`);
    }
    const subCommands = cmd.state.subCommands.set(subCommand.state.name, subCommand);
    return withState({ ...cmd.state, subCommands });
  }

  function withRuntimeArgs(args?: string[], parsed?: ParsedRuntimeArgs): Command {
    const commandArgs = args || process.argv.slice(2);
    const runtimeArgs = cmd.state.runtimeArgs.push(...commandArgs);
    const cmdWithHelp = withHelp();
    if (commandArgs) {
      try {
        const parsedRuntimeArgs = argvParser.parse(
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
    const s = cmd.state;
    console.log(colors.green(s.name), colors.yellow(s.version || ''));
    if (s.description) {
      console.log(s.description);
    }
    const options = combinedOptions(cmd.state);
    const optsHelp = !options.isEmpty() ? '[...options]' : '';

    const args = combinedArguments(cmd.state);
    const argsHelp = formatArgHelp(args);

    console.log(colors.yellow('\nUsage:'));
    console.log(`    ${colors.green(s.name)} ${optsHelp} ${argsHelp}`);

    if (!options.isEmpty()) {
      console.log(colors.yellow('\nOptions:'));
      printOptions(options);
    }

    if (!s.subCommands.isEmpty()) {
      console.log(colors.yellow('\nSub Commands:'));
      printSubCommands(s.subCommands);
    }
    console.log('');
  }

  function run(state?: RuntimeState): Promise<ReturnValue> {
    const parsedArgs = cmd.state.parsedRuntimeArgs || immutable.Map();
    const positionalArgs = parsedArgs.get('_', []) as string[];
    const arg0 = positionalArgs[0] as string | undefined;

    let runtimeState: RuntimeState = state || immutable.Map();
    if (cmd.state.preProcessor) {
      // Allow preprocessors that do not return a new runtime state.
      runtimeState = cmd.state.preProcessor(cmd, runtimeState) || runtimeState;
    }

    // If a subCommand exists with name as the first argument, recurse into it.
    if (arg0 && cmd.state.subCommands.has(arg0)) {
      const subCommand = cmd.state.subCommands.get(arg0)!;
      const subArgs = parsedArgs.get('_', []) as string[];
      console.log('FPA', formatParsedArgs(parsedArgs));
      return subCommand
      .withRuntimeArgs(cmd.state.runtimeArgs.toArray(), parsedArgs.set('_', subArgs.slice(1)))
      .run(runtimeState);
    }

      // Show help text if requested, or if no handler is defined.
    if (arg0 === 'help' || parsedArgs.get('help', false)) {
      cmd.showHelp();
      return Promise.resolve(ReturnValue.SUCCESS);
    }

    if (!cmd.state.handler) {
      console.warn(colors.yellow(`No handler defined for command ${cmd.state.name}`));
      cmd.showHelp();
      return Promise.resolve(ReturnValue.FAILURE);
    }
    // Handle the current command.
    return cmd.state.handler(cmd, runtimeState) || Promise.resolve(ReturnValue.SUCCESS);
  }

  return Object.freeze(cmd);
}

function checkUniqueDefinition<T>(definition: Option<T>, list: AllStoredOptions) {
  if (list.has(definition.name)
    || list.some(o => !!(o.short && o.short === definition.short))
    || list.some(o => !!(o.long && o.long === definition.long))
  ) {
    throw new TypeError(
      `arg already exists: ${definition.name} -${definition.short} --${definition.long}`,
    );
  }
}

function addOption<T>(
  state: CommandState,
  definition: TypeNamedOption<T>,
  key: keyof CommandState,
): Command {
  const map = state[key] as StoredOption<T>;
  checkUniqueDefinition(definition, combinedOptions(state));
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
    const name = [short, long].filter(n => n !== '').join(',');
    return [name, o.description || ''];
  });
  printColumns(optHelp);
}

function printSubCommands(commands: SubCommands) {
  const columns = commands.map((c) => {
    return [c.state.name, c.state.description || ''];
  });
  printColumns(columns);
}

function formatArgHelp(args: AllStoredArguments): string {
  return args
  .map(({ required, name }) => required ? `<${name}>` : `[${name}]`)
  .join(' ');
}

function combinedOptions(state: CommandState): AllStoredOptions {
  const res = state.flags.merge(
    state.stringOptions as AllStoredOptions,
    state.numberOptions,
  ).sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

function combinedArguments(state: CommandState): AllStoredArguments {
  const res = state.positionalNumberArgs.merge(
    state.positionalStringArgs,
  ).sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

function formatParsedArgs(parsed: ParsedRuntimeArgs): string[] {
  const argv = parsed.toArray().map(([key, val]) => {
    const name = key.length === 1 ? `-${key}` : `--${key}`;
    if (Array.isArray(val)) {
      return ([] as string[]).concat(...val.map(v => [name, String(v)]));
    }
    return [name, String(val)];
  });
  return ([] as string[]).concat(...argv);
}
