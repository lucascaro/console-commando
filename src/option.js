'use strict';

var Immutable = require('immutable');

var debug = require('./debug');

class Option {
  constructor (config, description, defaultValue) {
    if (typeof config === 'string') {
      config = this.parseOptstring(config);
      config.description = description;
      config.default = defaultValue;
    }
    this._config = Option.defaultConfig().merge(Immutable.fromJS(config));
  }

  // Setters / getters
  get (key) {
    return this._config.get(key);
  }

  debug () {
    debug.log('Option: %j', this._config.toObject());
  }

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
   */
  static defaultConfig() {
    return Immutable.fromJS({
      'short': undefined,
      'long': undefined,
      'arg': undefined,
      'default': undefined,
      'description': undefined,
    });
  }
}

module.exports = Option;
