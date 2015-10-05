'use strict';

import Immutable from 'immutable';

import debug from './debug';

/**
 * Defines options with short and long names.
 *
 * Options can also have optional or required arguments.
 *
 * @see {@link Option#constructor}
 */
export default class Option {
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
  constructor (config, description, defaultValue) {
    if (config instanceof Option) {
      return config;
    }
    if (typeof config === 'string') {
      config = this.parseOptstring(config);
      config.description = description;
      config.default = defaultValue;
    }
    this._config = Option.defaultConfig().merge(Immutable.fromJS(config));
  }

  /**
   * Gets a property of the Option instance.
   *
   * @param  {string} key The name of the property to get.
   * @return {*}          The value of the property.
   */
  get (key) {
    return this._config.get(key);
  }

  /**
   * Prints out debugging information.
   */
  debug () {
    debug.log('Option: %j', this._config.toObject());
  }

  /**
   * Utility function to parse option strings.
   *
   * @param  {string} optstring an option string
   *
   * @access private
   */
  parseOptstring (optstring) {
    var opts = optstring.split(/ +/);
    var parsed = {};
    for (var i = 0; i < opts.length; i++) {
      var opt = opts[i];
      var matches = null;
      if ((matches = opt.match(/^-([a-zA-Z0-9])$/))) {
        if (parsed.short) {
          throw new Error('There can be only one short option');
        }
        parsed.short = matches[1];
      } else if ((matches = opt.match(/^--([\w-]+)$/))) {
        if (parsed.long) {
          throw new Error('There can be only one long option');
        }
        parsed.long = matches[1];
      } else if ((matches = opt.match(/^\[([\w-]+)\]$/))) {
        // optional argument
        if (parsed.arg) {
          throw new Error('There can be only one argument');
        }
        parsed.arg = matches[1];
        parsed.required = false;
      } else if ((matches = opt.match(/^<([\w-]+)>$/))) {
        // required argument
        if (parsed.arg) {
          throw new Error('There can be only one argument');
        }
        parsed.arg = matches[1];
        parsed.required = true;
      }
    }
    if (parsed.arg && !parsed.short && !parsed.long) {
      throw new Error('Arguments need an option name');
    }

    return parsed;
  }

  /**
   * Returns the argument value for this option, according to a list of args.
   *
   * @param  {Immutable.List} args List of arguments.
   * @return {?mixed}              The value of the argument.
   */
  getArgValue (args) {
    var short = this.get('short');
    var long = this.get('long');

    debug.log('GET ARG VAL: %s %s %j', short, long, args);
    var argValue = args.get(short) || args.get(long);
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
      'short': undefined,
      'long': undefined,
      'arg': undefined,
      'default': undefined,
      'description': undefined,
    });
  }
}
