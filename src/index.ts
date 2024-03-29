import { List as IList, Map as IMap } from "immutable";
import { Command, withState } from "./Command";
import colors from "./helpers/colors";
import Debug from "./helpers/debug";
import io from "./helpers/io";
import {
  BooleanOption,
  StringOption,
  NumericOption,
  MultiStringOption,
} from "./Options";
import {
  StringArgument,
  NumericArgument,
  MultiStringArgument,
} from "./Arguments";

export {
  Command,
  Handler,
  PreProcessor,
  ReturnValue,
  RuntimeState,
} from "./Command";
export { Argument } from "./Arguments";
export { Option } from "./Options";
export { CommandState } from "./CommandState";
export { colors };
export { io };

const debug = Debug("console-commando:main");

/**
 * Command factory. Returns a new command with default state and a given name.
 * @param name a name for the new command.
 */
export function command(name: string): Command {
  debug(`creating new command: ${name}`);
  return withState({
    name,
    options: IMap(),
    parentOptions: IMap(),
    arguments: IMap(),
    parentArguments: IMap(),
    subCommands: IMap(),
    runtimeArgs: IList(),
    parsedRuntimeArgs: IMap(),
    preProcessors: IList(),
  });
}

/**
 * Convenience factory for Option<T>.
 *
 * @param long the long option word -- this will be used as the option name (e.g. force for --force)
 * @param short optional short version for this option (e.g. f for -f)
 * @param description optional description.
 * @param defaultValue optional default value to be used if the option is not specified.
 * @param required whether this option is mandatory. Defaults to false.
 */
export function flag(
  long: string,
  short?: string,
  description?: string,
  required = false,
): BooleanOption {
  debug("creating option:", { long, short, description, required });
  return {
    long,
    short,
    description,
    required,
    name: long,
    multiple: false,
    kind: "boolean",
  };
}

export function stringOption(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: string,
  required = false,
): StringOption {
  debug("creating option:", {
    long,
    short,
    description,
    defaultValue,
    required,
  });
  return {
    long,
    short,
    description,
    required,
    name: long,
    default: defaultValue,
    multiple: false,
    kind: "string",
  };
}

export function numericOption(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: number,
  required = false,
): NumericOption {
  debug("creating option:", {
    long,
    short,
    description,
    defaultValue,
    required,
  });
  return {
    long,
    short,
    description,
    required,
    name: long,
    default: defaultValue,
    multiple: false,
    kind: "number",
  };
}

export function multiStringOption(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: string[],
  required = false,
): MultiStringOption {
  debug("creating option:", {
    long,
    short,
    description,
    defaultValue,
    required,
  });
  return {
    long,
    short,
    description,
    required,
    name: long,
    default: defaultValue,
    multiple: true,
    kind: "string",
  };
}

export function stringArg(
  name: string,
  description?: string,
  defaultValue?: string,
  required = false,
): StringArgument {
  debug("creating argument:", { name, description, defaultValue, required });
  return {
    name,
    description,
    required,
    default: defaultValue,
    multiple: false,
    kind: "string",
  };
}

export function numericArg(
  name: string,
  description?: string,
  defaultValue?: number,
  required = false,
): NumericArgument {
  debug("creating argument:", { name, description, defaultValue, required });
  return {
    name,
    description,
    required,
    default: defaultValue,
    multiple: false,
    kind: "number",
  };
}

export function multiStringArg(
  name: string,
  description?: string,
  defaultValue?: string[],
  required = false,
): MultiStringArgument {
  debug("creating argument:", { name, description, defaultValue, required });
  return {
    name,
    description,
    required,
    default: defaultValue,
    multiple: true,
    kind: "string",
  };
}
