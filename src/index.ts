import * as immutable from 'immutable';
import { Option, Command, withState } from './Command';
export { Command, Option, Argument, Handler, PreProcessor, ReturnValue } from './Command';
import * as Debug from 'debug';

const debug = Debug('console-commando:main');

/**
 * Command factory. Returns a new command with default state and a given name.
 * @param name a name for the new command.
 */
export function command(name: string): Command {
  debug(`creating new command: ${name}`);
  return withState({
    name,
    flags: immutable.Map(),
    stringOptions: immutable.Map(),
    numberOptions: immutable.Map(),
    positionalStringArgs: immutable.Map(),
    positionalNumberArgs: immutable.Map(),
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
export function option<T>(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: T,
  required: boolean = false,
): Option<T> {
  debug('creating option:', { long, short, description, defaultValue, required });
  return {
    long,
    short,
    description,
    required,
    name: long,
    default: defaultValue,
    multiple: false,
  };
}

/**
 * Convenience factory for multi valued Option<T>.
 *
 * @see option()
 */
export function multiOption<T>(
  long: string,
  short?: string,
  description?: string,
  defaultValue?: T[],
  required: boolean = false,
): Option<T> {
  debug('creating multi option:', { long, short, description, defaultValue, required });
  return {
    long,
    short,
    description,
    required,
    multiple: true,
    name: long,
    default: defaultValue,
  };
}
