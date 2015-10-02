'use strict';

var Immutable = require('immutable');

function Option(config, description, defaultValue) {
  if (config instanceof Option) {
    return config;
  } else if (this instanceof Option) {
    if (typeof config === 'string') {
      config = this.parseOptstring(config);
      config.description = description;
      config.default = defaultValue;
    }
    this._config = defaultConfig().merge(Immutable.fromJS(config));
  } else {
    return new Option(config);
  }
}

// Setters / getters
Option.prototype.get = function (key) {
  return this._config.get(key);
};

Option.prototype.debug = function () {
  console.log('Option: %j', this._config.toObject());
};

Option.prototype.parseOptstring = function (optstring) {
  var opts = optstring.split(/ +/);
  var parsed = {};
  for (var i = 0; i < opts.length; i++) {
    var opt = opts[i];
    var matches = null;
    console.log('PARSE OPT', opt);
    if (matches = opt.match(/^-([a-zA-Z0-9])$/ )) {
      console.log('SHORT OPT: ', matches);
      if (parsed.short) {
        throw new Error('There can be only one short option');
      }
      parsed.short = matches[1];
    } else if (matches = opt.match(/^--([\w-]+)$/ )) {
      console.log('LOWNG OPT: ', matches);
      if (parsed.long) {
        throw new Error('There can be only one long option');
      }
      parsed.long = matches[1];
    } else if (matches = opt.match(/^\[([\w-]+)\]$/ )) {
      // optional argument
      console.log('OPT ARG: ', matches);
      if (parsed.arg) {
        throw new Error('There can be only one argument');
      }
      parsed.arg = matches[1];
      parsed.required = false;
    } else if (matches = opt.match(/^<([\w-]+)>$/ )) {
      // required argument
      console.log('OPT ARG: ', matches);
      if (parsed.arg) {
        throw new Error('There can be only one argument');
      }
      parsed.arg = matches[1];
      parsed.required = true;
    }
  }
  console.log('PARSED:', parsed);
  if (parsed.arg && !parsed.short && !parsed.long ) {
    throw new Error('Arguments need an option name');
  }

  return parsed;
};

/**
 * Option default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    'short': undefined,
    'long': undefined,
    'default': undefined,
    'description': undefined,
  });
}
Option.prototype.defaultConfig = defaultConfig;

module.exports = Option;
