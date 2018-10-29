import {
  AllStoredOptions,
  AllStoredArguments,
  StoredOption,
  Option,
  ParsedRuntimeArgs,
} from '../Command';
import * as minimist from 'minimist';
import * as immutable from 'immutable';

export function parse(
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
  console.log(parsed);
  flags.forEach((f) => {
    if (f.short && parsed.has(f.short) && f.long && parsed.has(f.long)) {
      throw new Error(`flag should be either ${f.short} or ${f.long}`);
    }

    const value = !!getValue(f, parsed);
    resultOptions.set(f.name, value);
  });

  options.forEach((o) => {
    console.log(o);
    if (o.short && parsed.has(o.short) && o.long && parsed.has(o.long)) {
      throw new Error(`option should be either ${o.short} or ${o.long}, not both.`);
    }
    const value = getValue(o, parsed);
    if (Array.isArray(value) && !o.multiple) {
      throw new Error(`option can only be specified once: ${o.long}`);
    }
    if (value) {
      // Make sure value is of the correct type.
      console.log(o, value);
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
export default {
  parse,
};
