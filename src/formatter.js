'use strict';

var Immutable = require('immutable');

var debug = require('./debug');
var pad = require('node-string-pad');

class Formatter {
  constructor (config) {
    if (config instanceof Formatter) {
      return config;
    } else if (this instanceof Formatter) {
      this._config = Formatter.defaultConfig().merge(Immutable.fromJS(config));
    } else {
      return new Formatter(config);
    }
  }

  // Setters / getters
  get (key) {
    return this._config.get(key);
  }

  debug () {
    debug.log('Formatter: %j', this._config.toObject());
  }

  pad (amount, character, direction, prefix) {
    if (direction === undefined) { direction = 'LEFT'; }
    if (character === undefined) { character = ' '; }
    return function (text) {
      if (typeof text !== 'string') {
        text = '';
      }
      if (prefix && text.length > 0) {
        text = prefix + text;
      }
      return pad(text, amount, direction, character);
    };
  }

  padCommand () {
    return this.pad(this.get('padCommands'), ' ', 'RIGHT');
  }

  padShortOption () {
    return this.pad(this.get('padShortOptions'), ' ', 'LEFT', '-');
  }

  padOption () {
    return this.pad(this.get('padOptions'), ' ', 'RIGHT', '--');
  }

  padDescription () {
    return this.pad(this.get('padDescriptions'), ' ', 'RIGHT');
  }

  /**
   * Formatter default configuration.
   *
   * @return {Immutable.Map} the default (empty) configuration for commando.
   */
  static defaultConfig () {
    return Immutable.fromJS({
      'padCommands': 30,
      'padDescriptions': 30,
      'padOptions': 13,
      'padShortOptions': 6,
    });
  }
}

module.exports = Formatter;
