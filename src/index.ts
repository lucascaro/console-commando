import * as immutable from 'immutable';

import colors from './helpers/colors';
export { colors };

import * as io from './helpers/io';
export { io };

import {
  Command,
  withState,
  StringOption,
  MultiStringOption,
  NumericOption,
  BooleanOption,
  MultiStringArgument,
  NumericArgument,
  StringArgument,
} from './Command';
import * as Debug from 'debug';

const debug = Debug('console-commando:main');

export {
  Command,
  Option,
  Argument,
  Handler,
  PreProcessor,
  ReturnValue,
  RuntimeState,
} from './Command';

/**
 * Command factory. Returns a new command with default state and a given name.
 * @param name a name for the new command.
 */
export function command(name: string): Command {
  debug(`creating new command: ${name}`);
  return withState({
    name,
    options: immutable.Map(),
    parentOptions: immutable.Map(),
    arguments: immutable.Map(),
    parentArguments: immutable.Map(),
    subCommands: immutable.Map(),
    runtimeArgs: immutable.List(),
    parsedRuntimeArgs: immutable.Map(),
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
  required: boolean = false,
): BooleanOption {
  debug('creating option:', { long, short, description, required });
  return {
    long,
    short,
    description,
    required,
    name: long,
    multiple: false,
    kind: 'boolean',
  };
}

export function stringOption(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: string,
  required: boolean = false,
): StringOption {
  debug('creating option:', {
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
    kind: 'string',
  };
}

export function numericOption(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: number,
  required: boolean = false,
): NumericOption {
  debug('creating option:', {
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
    kind: 'number',
  };
}

export function multiStringOption(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: string[],
  required: boolean = false,
): MultiStringOption {
  debug('creating option:', {
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
    kind: 'string',
  };
}

export function stringArg(
  name: string,
  description?: string,
  defaultValue?: string,
  required: boolean = false,
): StringArgument {
  debug('creating argument:', { name, description, defaultValue, required });
  return {
    name,
    description,
    required,
    default: defaultValue,
    multiple: false,
    kind: 'string',
  };
}

export function numericArg(
  name: string,
  description?: string,
  defaultValue?: number,
  required: boolean = false,
): NumericArgument {
  debug('creating argument:', { name, description, defaultValue, required });
  return {
    name,
    description,
    required,
    default: defaultValue,
    multiple: false,
    kind: 'number',
  };
}

export function multiStringArg(
  name: string,
  description?: string,
  defaultValue?: string[],
  required: boolean = false,
): MultiStringArgument {
  debug('creating argument:', { name, description, defaultValue, required });
  return {
    name,
    description,
    required,
    default: defaultValue,
    multiple: true,
    kind: 'string',
  };
}
