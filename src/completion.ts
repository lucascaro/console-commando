'use strict';

import debug from './debug';

/**
 * Get valid completion values for a command and a list of arguments.
 *
 * @param {Commando} command      A commando command.
 *
 * @return {string} a list of possible completions.
 */
function getCompletions(command) {
  let args = command.get('args').get('_');
  debug.log('INITIAL ARGS', args);
  return _getCompletions(command, args).join(' ');
}
/**
 * Utility function to return valid list of args.
 *
 * @param {Commando} command      A commando command.
 * @param {?Immutable.List} args  A list of arguments. (for internal use)
 *
 * @return {string} a list of possible completions.
 * @access private
 */
function _getCompletions(command, args) {
  let completions = [];

  if (!args || args.size <= 1) {
    return;
  }

  args = args.shift();
  debug.log('ARGS', args);
  debug.log('COMMAND', command);

  let commandArg = args.get(1);
  let subcommand = command.getCommand(commandArg);
  debug.log('SUBC', commandArg, subcommand);
  if (commandArg && commandArg[0] == '-') {
    completeOptions(command, completions, commandArg);
  } else {
    if (subcommand) {
      completions = completions.concat(_getCompletions(subcommand, args));
    } else {
      completeSubcommands(command, completions, commandArg);
    }
    completeOptions(command, completions);
  }
  return completions;
}

/**
 * Utility function to get completions for subcommands.
 *
 * @param  {Commando} command     A commando.
 * @param  {array} completions    An array of completions, new values will be
 * pushed into this array.
 * @param  {?string} prefix       An optional prefix to filter subcommands.
 * @access private
 */
function completeSubcommands(command, completions, prefix) {
  let commands = command.get('commands');
  commands.forEach((command) => {
    let name = command.get('name');
    if (!prefix || name.indexOf(prefix) >= 0) {
      completions.push(name);
    }
  });
}

/**
 * Utility function to get completions for options in a command.
 *
 * @param  {Commando} command     A commando.
 * @param  {array} completions    An array of completions, new values will be
 * pushed into this array.
 * @param  {?string} prefix       An optional prefix to filter subcommands.
 * @access private
 */
function completeOptions(command: any, completions: any[], prefix?: string) {
  let options = command.get('options');
  options.forEach((option) => {
    let short = '-' + option.get('short');
    let long = '--' + option.get('long');
    if (short != '-' && (!prefix || short.indexOf(prefix) >= 0)) {
      completions.push(short);
    }
    if (long != '--' && (!prefix || long.indexOf(prefix) >= 0)) {
      completions.push(long);
    }
  });
}

/**
 * Generate bash completion code.
 *
 * @param  {Commando} command A base command
 * @return {string}           A string with a bash script for auto completion
 */
function bashCompletion(command) {
  let appName = command.get('name');
  let appPath = process.argv[0] + ' ' + process.argv[1];

  return `
###-begin-${appName}-completions-###
#
# ${appName} command completion script
#
# Installation: ${appPath} completion >> ~/.bashrc
#    or ${appPath} completion >> ~/.bash_profile on OSX.
#
_${appName}_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=$(printf "%s " "\${COMP_WORDS[@]}")

    # ask app to generate completions.
    type_list=\`${appPath} get-commando-completions -- $args\`

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=( $(compgen -f -- "\${cur_word}" ) )
    fi

    return 0
}
complete -F _${appName}_completions ${appName}
###-end-${appName}-completions-###
`;
}

export default {
  bashCompletion,
  getCompletions,
};
