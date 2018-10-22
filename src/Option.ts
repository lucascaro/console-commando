'use strict';

import * as Immutable from 'immutable';

import debug from './debug';

export interface ParsedOptions {
  arg?: string;
  short?: string;
  long?: string;
  required?: boolean;
}
export interface OptionConfig {
  readonly arg: string;
  readonly short: string;
  readonly long: string;
  readonly required: boolean;
  readonly default?: any;
  readonly description?: string;
}

/**
 * Option default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 *
 * @access private
 */
const defaultConfig: OptionConfig = {
  arg: '',
  short: '',
  long: '',
  required: false,
  default: undefined,
  description: undefined,
};
/**
 * Defines options with short and long names.
 *
 * Options can also have optional or required arguments.
 *
 * @see {@link Option#constructor}
 */
export default class Option {
  private config!: OptionConfig;
  /**
   * Creates a new Option.
   *
   * Option strings can have a short and long name, as well as a named
   * argument, which can be optional or required. It's defined as a string:
   *
   * ```
   * -o --long-option [argumentName]
   * ```
   *
   * where:
   * * `-o` represents the short name (o),
   * * `--long-option` is the long name (`long-option`)
   * * and `[argumentName]` represents an optional argument.
   * * use `<argumentName>` for required arguments.
   *
   * @param  config          An optString or configuration object.
   * @param  [description]   A description, shown in help.
   * @param  [defaultValue]  A default value for this option.
   * @constructor
   */
  constructor()
  constructor(config: string)
  constructor(config: string, description: string)
  constructor(config: string, description: string | undefined, defaultValue: any)
  constructor(config: Partial<OptionConfig>)
  constructor(config: OptionConfig)
  constructor (config?: string | object, description?: string, defaultValue?: any) {
    if (config instanceof Option) {
      return config;
    }
    if (!config) {
      throw new Error('config cannot be empty');
    }
    let configObj: Partial<OptionConfig>;
    if (typeof config === 'string') {
      configObj = {
        ...this.parseOptstring(config),
        description,
        default: defaultValue,
      };
    } else {
      configObj = config;
    }
    this.config = { ...defaultConfig, ...configObj };
  }

  /**
   * Gets a property of the Option instance.
   *
   * @param  key The name of the property to get.
   * @return     The value of the property.
   */
  get<T extends keyof OptionConfig> (key: T): OptionConfig[T] {
    return this.config[key];
  }

  /**
   * Prints out debugging information.
   */
  debug () {
    debug.log('Option: %j', this.config);
  }

  /**
   * Utility function to parse option strings.
   *
   * @param  optstring an option string
   *
   * @access private
   */
  parseOptstring (optstring: string): ParsedOptions {
    const options = optstring.split(/ +/);
    const parsed: ParsedOptions = {};
    options.forEach((option) => {
      this.parseShortOption(parsed, option);
      this.parseLongOption(parsed, option);
      this.parseNamedArgument(parsed, option);
    });
    debug.log('PARSED', parsed);
    if (parsed.arg && !parsed.short && !parsed.long) {
      throw new Error('Arguments need an option name');
    }

    return parsed;
  }

  /**
   * Helper function for parsing short options from an optstring.
   *
   * @param  parsed  the object containing parsed options.
   * @param  opt     the optstring that should be parsed.
   * @access private
   */
  parseShortOption (parsed: ParsedOptions, opt: string) {
    const regex = /^-([a-zA-Z0-9])$/;
    this.parseGenericOption(parsed, opt, regex, 'short');
  }

  /**
   * Helper function for parsing long options from an optstring.
   *
   * @param  parsed  the object containing parsed options.
   * @param  opt     the optstring that should be parsed.
   * @access private
   */
  parseLongOption (parsed: ParsedOptions, opt: string) {
    const regex = /^--([\w-]+)$/;
    this.parseGenericOption(parsed, opt, regex, 'long');
  }

  /**
   * Helper function for parsing long options from an optstring.
   *
   * @param  parsed  the object containing parsed options.
   * @param  opt     the optstring that should be parsed.
   * @access private
   */
  parseNamedArgument (parsed: ParsedOptions, opt: string) {
    const optionalArgRegex = /^\[([\w-]+)\]$/;
    const requiredArgRegex = /^<([\w-]+)>$/;
    if (this.parseGenericOption(parsed, opt, optionalArgRegex, 'arg')) {
      parsed.required = false;
    } else if (this.parseGenericOption(parsed, opt, requiredArgRegex, 'arg')) {
      parsed.required = true;
    }
  }

  /**
   * Helper function for parsing generic options from an optstring.
   *
   * @param  parsed  The object containing parsed options.
   * @param  opt     The optstring that should be parsed.
   * @return         true if there were any matches, false otherwise.
   * @access private
   */
  parseGenericOption (
    parsed: ParsedOptions,
    opt: string,
    regex: RegExp,
    keyName: keyof ParsedOptions,
  ): boolean {
    const matches = opt.match(regex);
    if (matches) {
      if (Object.prototype.hasOwnProperty.call(parsed, keyName)) {
        throw new Error(`There can be only one ${keyName} option`);
      }
      if (keyName !== 'required') {
        parsed[keyName] = matches[1];
      }
    }
    return !!matches;
  }
  /**
   * Returns the argument value for this option, according to a list of args.
   *
   * @param  {Immutable.List} args List of arguments.
   * @return {?mixed}              The value of the argument.
   * // TODO: validate parameter and return types
   */
  getArgValue(args: Immutable.Map<string, any>): string | undefined {
    const short = this.get('short');
    const long = this.get('long');

    debug.log('GET ARG VAL: %s %s %j', short, long, args);
    let argValue = args.get(short) || args.get(long);
    if (argValue === undefined) {
      argValue = this.get('default');
    }
    return argValue;
  }
}
