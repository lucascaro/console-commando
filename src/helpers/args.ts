import {
  AllStoredOptions,
  AllStoredArguments,
  StoredOption,
  Option,
  ParsedRuntimeArgs,
  CommandState,
  TypeNamedOption,
  Command,
  withState,
} from '../Command';
import * as minimist from 'minimist';
import * as immutable from 'immutable';
import * as Debug from 'debug';

const debug = Debug('console-commando:args');

export function parseArgv(
  argv: string[],
  flags: StoredOption<boolean>,
  options: AllStoredOptions,
  args: AllStoredArguments,
  merge?: ParsedRuntimeArgs,
): ParsedRuntimeArgs {
  let parsed = immutable.Map(minimist(argv));
  if (merge) {
    parsed = parsed.merge(merge);
  }
  const resultOptions = new Map<string, boolean|string|number|string[]>();
  debug('parsed argv:', parsed);
  flags.forEach((f) => {
    if (f.short && parsed.has(f.short) && f.long && parsed.has(f.long)) {
      throw new Error(`flag should be either ${f.short} or ${f.long}`);
    }

    const value = !!getValue(f, parsed);
    resultOptions.set(f.name, value);
  });

  options.forEach((o) => {
    if (o.short && parsed.has(o.short) && o.long && parsed.has(o.long)) {
      throw new Error(`option should be either ${o.short} or ${o.long}, not both.`);
    }
    const value = getValue(o, parsed);
    if (Array.isArray(value) && !o.multiple) {
      throw new Error(`option can only be specified once: ${o.long}`);
    }
    if (value) {
      // Make sure value is of the correct type.
      debug(`found value for option: ${o.name}=${value}`);
      if (o.typeName === 'number') {
        if (Number.isNaN(Number(value))) {
          throw new Error(`expected number value for --${o.long} but got '${value}'`);
        }
        resultOptions.set(o.name, Number(value));
      } else if (o.typeName === 'string') {
        if (!o.multiple) {
          resultOptions.set(o.name, String(value));
          return;
        }
        if (Array.isArray(value)) {
          resultOptions.set(o.name, value.map(String));
        } else {
          resultOptions.set(o.name, [String(value)]);
        }
      }

    }
  });

  // TODO: Validate arguments
  resultOptions.set('_', parsed.get('_'));
  return immutable.Map(resultOptions);
}

function getValue<T>(o: Option<T>, parsed: immutable.Map<string, any>): T | T[] | void {
  if (o.short && parsed.has(o.short)) {
    return parsed.get(o.short);
  }

  if (o.long && parsed.has(o.long)) {
    return parsed.get(o.long);
  }

  if (o.default !== undefined) {
    return o.default;
  }
}

export function addOption<T>(
  state: CommandState,
  definition: TypeNamedOption<T>,
  key: keyof CommandState,
): Command {
  const map = state[key] as StoredOption<T>;
  checkUniqueDefinition(definition, combinedOptions(state));
  const val = map.set(definition.name, Object.freeze(definition));
  return withState({ ...state, [key]: val });
}

export function combinedOptions(state: CommandState): AllStoredOptions {
  const res = state.flags.merge(
    state.stringOptions as AllStoredOptions,
    state.numberOptions,
  ).sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

export function combinedArguments(state: CommandState): AllStoredArguments {
  const res = state.positionalNumberArgs.merge(
    state.positionalStringArgs,
  ).sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

export function checkUniqueDefinition<T>(definition: Option<T>, list: AllStoredOptions) {
  if (list.has(definition.name)
    || list.some(o => !!(o.short && o.short === definition.short))
    || list.some(o => !!(o.long && o.long === definition.long))
  ) {
    throw new TypeError(
      `arg already exists: ${definition.name} -${definition.short} --${definition.long}`,
    );
  }
}
