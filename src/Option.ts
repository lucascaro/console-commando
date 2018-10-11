'use strict';

import * as Immutable from 'immutable';

import debug from './debug';

export interface ParsedOptions {
  arg?: string;
  short?: string;
  long?: string;
}

/**
 * Defines options with short and long names.
 *
 * Options can also have optional or required arguments.
 *
 * @see {@link Option#constructor}
 */
export default class Option {
  private config: Immutable.Map<string, any>;
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
   * @param  {string|object} config   An optString or configuration object.
   * @param  {string} [description]   A description, shown in help.
   * @param  {?*} [defaultValue]      A default value for this option.
   * @return {Option}                 A new Option object.
   */
  constructor (config?, description?: string, defaultValue?: any) {
    if (config instanceof Option) {
      return config;
    }
    let configObj = config;
    if (typeof config === 'string') {
      configObj = {
        ...this.parseOptstring(config),
        description,
        default: defaultValue,
      };
    }
    this.config = Option.defaultConfig().merge(Immutable.fromJS(configObj));
  }

  /**
   * Gets a property of the Option instance.
   *
   * @param  {string} key The name of the property to get.
   * @return {*}          The value of the property.
   */
  get (key) {
    return this.config.get(key);
  }

  /**
   * Prints out debugging information.
   */
  debug () {
    debug.log('Option: %j', this.config.toObject());
  }

  /**
   * Utility function to parse option strings.
   *
   * @param  {string} optstring an option string
   *
   * @access private
   */
  parseOptstring (optstring): ParsedOptions {
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
   * @param  {object} parsed  the object containing parsed options.
   * @param  {string} opt     the optstring that should be parsed.
   * @access private
   */
  parseShortOption (parsed, opt) {
    const regex = /^-([a-zA-Z0-9])$/;
    this.parseGenericOption(parsed, opt, regex, 'short');
  }

  /**
   * Helper function for parsing long options from an optstring.
   *
   * @param  {object} parsed  the object containing parsed options.
   * @param  {string} opt     the optstring that should be parsed.
   * @access private
   */
  parseLongOption (parsed, opt) {
    const regex = /^--([\w-]+)$/;
    this.parseGenericOption(parsed, opt, regex, 'long');
  }

  /**
   * Helper function for parsing long options from an optstring.
   *
   * @param  {object} parsed  the object containing parsed options.
   * @param  {string} opt     the optstring that should be parsed.
   * @access private
   */
  parseNamedArgument (parsed, opt) {
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
   * @param  {object} parsed  the object containing parsed options.
   * @param  {string} opt     the optstring that should be parsed.
   * @return {boolean}        true if there were any matches, false otherwise.
   * @access private
   */
  parseGenericOption (parsed, opt, regex, keyName) {
    let matches = [];
    if ((matches = opt.match(regex))) {
      if (parsed[keyName]) {
        throw new Error(`There can be only one ${keyName} option`);
      }
      parsed[keyName] = matches[1];
    }
    return !!matches;
  }
  /**
   * Returns the argument value for this option, according to a list of args.
   *
   * @param  {Immutable.List} args List of arguments.
   * @return {?mixed}              The value of the argument.
   */
  getArgValue (args) {
    const short = this.get('short');
    const long = this.get('long');

    debug.log('GET ARG VAL: %s %s %j', short, long, args);
    let argValue = args.get(short) || args.get(long);
    if (argValue === undefined) {
      argValue = this.get('default');
    }
    return argValue;
  }

  /**
   * Option default configuration.
   *
   * @return {Immutable.Map} the default (empty) configuration for commando.
   *
   * @access private
   */
  static defaultConfig () {
    return Immutable.fromJS({
      short: undefined,
      long: undefined,
      arg: undefined,
      required: false,
      default: undefined,
      description: undefined,
    });
  }
}
