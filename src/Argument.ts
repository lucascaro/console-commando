// Classes
import Option, { ParsedOptions } from './Option';

// Libraries
import * as Immutable from 'immutable';

/**
 * Defines positional arguments for a command.
 *
 * Allows to specify names for positional arguments.
 */
export default class Argument extends Option {

  /**
   * Parse options string for arguments
   *
   * Overrides parent method to accept arguments instead of options.
   *
   * @param  {string} optstring An optstring with named arguments.
   *
   * @access private
   */
  parseOptstring (optstring: string) {
    const options: string[] = optstring.split(/ +/);
    const parsed: ParsedOptions = {};
    options.forEach((option) => {
      this.parseNamedArgument(parsed, option);
    });
    if (!parsed.arg || parsed.short || parsed.long) {
      throw new Error('Positional arguments can only be names.');
    }

    return parsed;
  }

  /**
   * Argument default configuration.
   *
   * @return {Immutable.Map} the default (empty) configuration for commando.
   *
   * @access private
   */
  static defaultConfig () {
    return Immutable.fromJS({
      arg: undefined,
      default: undefined,
      description: undefined,
    });
  }
}
