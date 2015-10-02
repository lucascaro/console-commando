'use strict';

var Immutable = require('immutable');
var pad = require('node-string-pad');

function Formatter(config) {
  if (config instanceof Formatter) {
    return config;
  } else if (this instanceof Formatter) {
    this._config = defaultConfig().merge(Immutable.fromJS(config));
  } else {
    return new Formatter(config);
  }
}

// Setters / getters
Formatter.prototype.get = function (key) {
  return this._config.get(key);
};

Formatter.prototype.debug = function () {
  console.log('Formatter: %j', this._config.toObject());
};

Formatter.prototype.pad = function (amount, character, direction) {
  if (direction === undefined) { direction = 'LEFT'; }
  if (character === undefined) { character = ' '; }
  return function (text) {
    return pad(text, amount, direction, character);
  };
};

Formatter.prototype.padCommand = function () {
  return this.pad(this.get('padCommands'), ' ', 'RIGHT');
};

Formatter.prototype.padDescription = function () {
  return this.pad(this.get('padDescriptions'), ' ', 'RIGHT');
};

/**
 * Formatter default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    'padCommands': 30,
    'padOptions': 15,
    'padDescriptions': 30,
  });
}
Formatter.prototype.defaultConfig = defaultConfig;

module.exports = Formatter;
