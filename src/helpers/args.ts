import Debug from "debug";
import * as immutable from "immutable";
import minimist from "minimist";
import {
  Argument,
  Option,
  OptionValue,
  ParsedRuntimeArgs,
  StoredArguments,
  StoredOptions,
  MultiStringArgument,
} from "../Command";

const debug = Debug("console-commando:args");

export interface ParsingResults {
  options: StoredOptions;
  arguments: StoredArguments;
  raw: immutable.Map<string, OptionValue>;
}

export function parseArgv(
  argv: string[],
  merge: ParsedRuntimeArgs = immutable.Map(),
): ParsedRuntimeArgs {
  return immutable.Map(minimist(argv)).merge(merge);
}

function getValue(
  o: Option,
  parsed: immutable.Map<string, OptionValue>,
): OptionValue | undefined {
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

export function parseOptions(
  parsed: ParsedRuntimeArgs,
  options: StoredOptions,
): StoredOptions {
  debug("parsing options for:", parsed);
  return options.map(
    (o: Option): Option => {
      if (o.short && parsed.has(o.short) && o.long && parsed.has(o.long)) {
        throw new Error(
          `option should be either ${o.short} or ${o.long}, not both.`,
        );
      }
      const value = getValue(o, parsed);
      if (Array.isArray(value) && !o.multiple) {
        throw new Error(`option can only be specified once: ${o.long}`);
      }
      if (value === undefined) {
        return o;
      }

      // Make sure value is of the correct type.
      debug(`found value for option: ${o.name}=${value}`);
      if (o.kind === "boolean") {
        if (typeof value !== "boolean") {
          throw new Error(
            `--${o.long} does not take a value but got '${value}'`,
          );
        }
        return { ...o, value };
      }
      if (o.kind === "number") {
        if (Number.isNaN(Number(value))) {
          throw new Error(
            `expected number value for --${o.long} but got '${value}'`,
          );
        }
        return { ...o, value: Number(value) };
      }
      if (o.kind === "string") {
        if (!o.multiple) {
          if (Array.isArray(value)) {
            throw new Error(`Option --${o.long} can be specified only once`);
          }
          return { ...o, value: String(value) };
        }
        if (Array.isArray(value)) {
          return { ...o, value: value.map(String) };
        }
        return { ...o, value: [String(value)] };
      }
      return o;
    },
  );
}

export function parseArguments(
  parsed: ParsedRuntimeArgs,
  args: StoredArguments,
): StoredArguments {
  let positional = parsed.get("_", []);
  if (!Array.isArray(positional)) {
    throw new Error(`error parsing positional arguments: ${positional}.`);
  }
  let positionalStr = Array.from(positional as (
    | string
    | number
    | boolean)[]).map(String) as string[];

  debug("parsing arguments for:", parsed, positional);
  return args.map(
    (a): Readonly<Argument> => {
      // positional = positional as string[];
      debug(`parsing ${a.name}`);
      if (positionalStr.length === 0) {
        if (a.required) {
          throw new Error(
            `argument ${a.name} is required but no value was specified.`,
          );
        }
        return a;
      }
      // multi arguments consume all.
      if (a.kind === "string" && a.multiple) {
        const value = Array.from(positionalStr);
        positionalStr = [];
        return Object.freeze({ ...a, value }) as Readonly<MultiStringArgument>;
      }

      const value = positionalStr.shift();

      if (a.kind === "number") {
        const nArg = Number(value);
        if (Number.isNaN(nArg)) {
          throw new Error(
            `argument ${a.name} should be a number. Received: ${value}.`,
          );
        }
        return { ...a, value: nArg };
      }

      if (a.kind === "string" && !a.multiple) {
        return { ...a, value };
      }

      return a;
    },
  );
}

export function getOptionOrParentOption(
  name: string,
  map1: StoredOptions,
  map2: StoredOptions,
): Option {
  const opt1 = map1.get(name);
  const opt2 = map2.get(name);
  if (!opt1 && !opt2) {
    throw new TypeError(`${name} is not a known option`);
  }
  return (opt1 || opt2)!;
}

export function getArgOrParentArg(
  name: string,
  map1: StoredArguments,
  map2: StoredArguments,
): Argument {
  const opt1 = map1.get(name);
  const opt2 = map2.get(name);
  if (!opt1 && !opt2) {
    throw new TypeError(`${name} is not a known argument`);
  }
  return (opt1 || opt2)!;
}
