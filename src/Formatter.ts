'use strict';

import * as Immutable from 'immutable';
import chalk from 'chalk';
import debug from './debug';

//
const stripAnsi = require('strip-ansi');

// Polyfills
require('string.prototype.repeat');

export interface Formatter {
  padCommand: () => (options: any) => string;
  padSubCommand: () => (options: any) => string;
  padOption: () => (options: any) => string;
  padArgument: () => (text: string, required:boolean) => string;
  padShortOption: () => (options: any) => string;
  padDescription: () => (options: any) => string;
  padSubCommandOption: () => (options: any) => string;
  pad: (options: any) => (text: string) => string;
  stringPad: (text: string, amount: number, direction: Direction, character: string) => string;
  log: () => void;
}

export enum Direction {'LEFT', 'RIGHT'}

const config = Immutable.fromJS({
  padArguments: 10,
  padCommands: 30,
  padDescriptions: 30,
  padOptions: 16,
  padShortOptions: 6,
  padSubCommands: 20,
  padSubCommandOptions: 24,
});

const printable = (x:string) => stripAnsi(x);

  /**
   * Prints out debugging information.
   */
const log = () => debug.log('Formatter: %j', config.toObject());

/**
 * Generates a padding function based on the given options.
 *
 * @return {function}   The generated padding function.
 *
 * @access private
 */
const pad = ({
  amount = 0,
  character = ' ',
  direction = Direction.LEFT,
  prefix = ' ',
  suffix = '',
}) => {
  return (input: any) => {
    let text = input;
    if (typeof text !== 'string') {
      text = '';
    }
    if (prefix && printable(text).length > 0) {
      text = prefix + text;
    }
    if (suffix && printable(text).length > 0) {
      text = text + suffix;
    }
    return stringPad(text, amount, direction, character);
  };
};

/**
 * Pad a string to be of at leas the specified size.
 */
const stringPad = (text: string, amount: number, direction: Direction, character: string) => {
  const chunkLen = amount - printable(text).length;
  const chunk = chunkLen > 0 ? character.repeat(chunkLen) : '';
  const pre = direction === Direction.LEFT ? chunk : '';
  const pos = direction !== Direction.LEFT ? chunk : '';
  return `${pre}${text}${pos}`;
};

/**
 * Returns a padding function for commands.
 *
 * @return {function(text: string): string} The generated function.
 */
const padCommand = () => pad({
  amount: config.get('padCommands'),
  direction: Direction.RIGHT,
});

/**
 * Returns a padding function for sub commands.
 *
 * @return {function(text: string): string} The generated function.
 */
const padSubCommand = () => pad({
  amount: config.get('padSubCommands'),
  direction: Direction.RIGHT,
});

/**
 * Returns a padding function for command options.
 *
 * @return {function(text: string): string} The generated function.
 */
const padSubCommandOption = () => pad({
  amount: config.get('padSubCommandOptions'),
  direction: Direction.RIGHT,
});

/**
 * Returns a padding function for short options
 *
 * @return {function(text: string): string} The generated function.
 */
const padShortOption = () => pad({
  amount: config.get('padShortOptions'),
  prefix: '-',
});

/**
 * Returns a padding function for long options.
 *
 * @return {function(text: string): string} The generated function.
 */
const padOption = () => pad({
  amount: config.get('padOptions'),
  direction: Direction.RIGHT,
  prefix: '--',
});

/**
 * Returns a padding function for arguments.
 *
 * @return {function(text: string, required: boolean): string} The generated
 *   function.
 */
const padArgument = () => {
  const size = config.get('padArguments');
  return (text = '', required = false) => {
    const prefix = required ? '<' : '[';
    const suffix = required ? '>' : ']';
    const padFn = pad({
      prefix,
      suffix,
      amount: size,
      direction: Direction.RIGHT,
    });
    return padFn(text);
  };
};

/**
 * Returns a padding function for descriptions.
 *
 * @return {function(text: string): string} The generated function.
 */
const padDescription = () => pad({
  amount: config.get('padDescriptions'),
  direction: Direction.RIGHT,
});

/**
 * Helper class for formatting help output.
 */
export const formatter: Formatter = {
  log,
  pad,
  stringPad,
  padCommand,
  padSubCommand,
  padSubCommandOption,
  padShortOption,
  padOption,
  padArgument,
  padDescription,
};

export default formatter;
