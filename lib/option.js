'use strict';

var Immutable = require('immutable');

var debug = require('./debug');
var util = require('util');

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
  debug.log('Option: %j', this._config.toObject());
};

Option.prototype.parseOptstring = function (optstring) {
  var opts = optstring.split(/ +/);
  var parsed = {};
  for (var i = 0; i < opts.length; i++) {
    var opt = opts[i];
    var matches = null;
    if (matches = opt.match(/^-([a-zA-Z0-9])$/ )) {
      if (parsed.short) {
        throw new Error('There can be only one short option');
      }
      parsed.short = matches[1];
    } else if (matches = opt.match(/^--([\w-]+)$/ )) {
      if (parsed.long) {
        throw new Error('There can be only one long option');
      }
      parsed.long = matches[1];
    } else if (matches = opt.match(/^\[([\w-]+)\]$/ )) {
      // optional argument
      if (parsed.arg) {
        throw new Error('There can be only one argument');
      }
      parsed.arg = matches[1];
      parsed.required = false;
    } else if (matches = opt.match(/^<([\w-]+)>$/ )) {
      // required argument
      if (parsed.arg) {
        throw new Error('There can be only one argument');
      }
      parsed.arg = matches[1];
      parsed.required = true;
    }
  }
  if (parsed.arg && !parsed.short && !parsed.long ) {
    throw new Error('Arguments need an option name');
  }

  return parsed;
};

Option.prototype.getArgValue = function (args) {
  var short = this.get('short');
  var long = this.get('long');

  debug.log('GET ARG VAL: %s %s %j', short, long, args)
  var argValue = args.get(short) || args.get(long);
  if (argValue === undefined) {
    argValue = this.get('default');
  }
  return argValue;
};

// Option.prototype.getArgKey = function (argName) {
//   var key = argName;
//   var arg =  this.get('arg');
//   var required = this.get('required');
//   var braces = required ? ['<','>'] : ['[',']'];
//
//   if (arg !== undefined) {
//     key = util.sprintf('%s %s%s%s', key, braces[0], arg, braces[1]);
//   }
//   return key;
// };
/**
 * Option default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    'short': undefined,
    'long': undefined,
    'arg': undefined,
    'default': undefined,
    'description': undefined,
  });
}
Option.prototype.defaultConfig = defaultConfig;

module.exports = Option;
