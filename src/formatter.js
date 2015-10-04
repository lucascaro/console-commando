'use strict';

var Immutable = require('immutable');

var debug = require('./debug');
var stringPad = require('node-string-pad');

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

  pad (amount, character, direction = 'LEFT', prefix = ' ', suffix = '') {
    return text => {
      if (typeof text !== 'string') {
        text = '';
      }
      if (prefix && text.length > 0) {
        text = prefix + text;
      }
      if (suffix && text.length > 0) {
        text = text + suffix;
      }
      return stringPad(text, amount, direction, character);
    };
  }

  padCommand () {
    return this.pad(this.get('padCommands'), ' ', 'RIGHT');
  }

  padSubCommand () {
    return this.pad(this.get('padSubCommands'), ' ', 'RIGHT');
  }

  padSubCommandOption () {
    return this.pad(this.get('padSubCommandOptions'), ' ', 'RIGHT');
  }

  padShortOption () {
    return this.pad(this.get('padShortOptions'), ' ', 'LEFT', '-');
  }

  padOption () {
    return this.pad(this.get('padOptions'), ' ', 'RIGHT', '--');
  }

  padArgument () {
    let size = this.get('padArguments');
    return (text = '', required = false) => {
      let prefix = required ? '<' : '[';
      let suffix = required ? '>' : ']';
      let padFn = this.pad(size, ' ', 'RIGHT', prefix, suffix);
      return padFn(text);
    }
  }

  padDescription () {
    return this.pad(this.get('padDescriptions'), ' ', 'RIGHT');
  }

  /**
   * Formatter default configuration.
   *
   * @return {Immutable.Map} the default (empty) configuration for commando.
   * TODO: All this will need to be automatically calculated based on the sizes
   * of the actual commands, options, arguments and descriptions.
   */
  static defaultConfig () {
    return Immutable.fromJS({
      'padArguments': 10,
      'padCommands': 40,
      'padDescriptions': 30,
      'padOptions': 16,
      'padShortOptions': 6,
      'padSubCommands': 20,
      'padSubCommandOptions': 24,
    });
  }
}

module.exports = Formatter;
