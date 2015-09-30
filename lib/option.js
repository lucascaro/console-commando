'use strict';

var Immutable = require('immutable');

function Option(config) {
  if (config instanceof Option) {
    return config;
  } else if (this instanceof Option) {
    if (typeof config[0] === 'string') {
      config = {
        short: config[0],
        long: config[1],
        description: config[2],
        'default': config[3],
      };
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

Option.prototype.help = function (padding) {
  console.log(padding + '    -%s --%s\t\t%s',
    this.get('short'),
    this.get('long'),
    this.get('description'));
};

/**
 * Option default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    'short': null,
    'long': null,
    'default': null,
    'description': null,
  });
}
Option.prototype.defaultConfig = defaultConfig;

module.exports = Option;
