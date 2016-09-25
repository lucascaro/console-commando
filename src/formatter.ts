'use strict';

import * as Immutable from 'immutable';

import debug     from './debug';

/**
 * Helper class for formatting help output.
 */
export default class Formatter {
  private _config: Immutable.Map<string, any>
  /**
   * Creates a new formatter with the given config.
   *
   * @param  {object} config A formatter configuration.
   * @return {Formatter}     The new Formatter.
   */
  constructor (config?: any) {
    if (config instanceof Formatter) {
      return config;
    } else if (this instanceof Formatter) {
      this._config = Formatter.defaultConfig().merge(Immutable.fromJS(config));
    } else {
      return new Formatter(config);
    }
  }

  /**
   * Gets a property of the Formatter instance.
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
    debug.log('Formatter: %j', this._config.toObject());
  }

  /**
   * Generates a padding function based on the given options.
   *
   * @return {function}   The generated padding function.
   *
   * @access private
   */
  pad ({
    amount = 0,
    character = ' ',
    direction = 'LEFT',
    prefix = ' ',
    suffix = ''
  }) {
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
      return this.stringPad(text, amount, direction, character);
    };
  }

  stringPad(text, amount, direction, character: string) {
    const chunkLen = amount - text.length
    const chunk = chunkLen > 0 ? character.repeat(chunkLen) : ''
    const pre = direction === 'LEFT' ? chunk : ''
    const pos = direction !== 'LEFT' ? chunk : ''
    return `${pre}${text}${pos}`
  }

  /**
   * Returns a padding function for commands.
   *
   * @return {function(text: string): string} The generated function.
   */
  padCommand () {
    return this.pad({ amount: this.get('padCommands'), direction: 'RIGHT' });
  }

  /**
   * Returns a padding function for sub commands.
   *
   * @return {function(text: string): string} The generated function.
   */
  padSubCommand () {
    return this.pad({ amount: this.get('padSubCommands'), direction: 'RIGHT' });
  }

  /**
   * Returns a padding function for command options.
   *
   * @return {function(text: string): string} The generated function.
   */
  padSubCommandOption () {
    return this.pad({
      amount: this.get('padSubCommandOptions'),
      direction: 'RIGHT',
    });
  }

  /**
   * Returns a padding function for short options
   *
   * @return {function(text: string): string} The generated function.
   */
  padShortOption () {
    return this.pad({ amount: this.get('padShortOptions'), prefix: '-' });
  }

  /**
   * Returns a padding function for long options.
   *
   * @return {function(text: string): string} The generated function.
   */
  padOption () {
    return this.pad({
      amount: this.get('padOptions'),
      direction: 'RIGHT',
      prefix: '--',
    });
  }

  /**
   * Returns a padding function for arguments.
   *
   * @return {function(text: string, required: boolean): string} The generated
   *   function.
   */
  padArgument () {
    let size = this.get('padArguments');
    return (text = '', required = false) => {
      let prefix = required ? '<' : '[';
      let suffix = required ? '>' : ']';
      let padFn = this.pad({
        amount: size,
        direction: 'RIGHT',
        prefix,
        suffix,
      });
      return padFn(text);
    };
  }

  /**
   * Returns a padding function for descriptions.
   *
   * @return {function(text: string): string} The generated function.
   */
  padDescription () {
    return this.pad({
      amount: this.get('padDescriptions'),
      direction: 'RIGHT',
    });
  }

  /**
   * Formatter default configuration.
   *
   * @return {Immutable.Map} the default (empty) configuration for commando.
   * TODO: All this will need to be automatically calculated based on the sizes
   * of the actual commands, options, arguments and descriptions.
   *
   * @access private
   */
  static defaultConfig() {
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
