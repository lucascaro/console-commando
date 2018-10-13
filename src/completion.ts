'use strict';

import debug from './debug';
import Commando, { OptionHash } from './Commando';

import immutable from 'immutable';
import { stringify } from 'querystring';

/**
 * Get valid completion values for a command and a list of arguments.
 *
 * @param command      A commando command.
 *
 * @return {string} a list of possible completions.
 */
function getCompletions(command: Commando): string {
  const args = command.get('args').get('_');
  debug.log('INITIAL ARGS', args);
  return getArgCompletions(command, args).join(' ');
}
/**
 * Utility function to return valid list of args.
 *
 * @param command      A commando command.
 * @param args  A list of arguments. (for internal use)
 *
 * @return {string} a list of possible completions.
 * @access private
 */
function getArgCompletions(command: Commando, args?: immutable.List<string>): string[] {
  let completions: string[] = [];

  if (!args || args.size <= 1) {
    return [];
  }

  const commandArguments = args.shift();
  debug.log('ARGS', commandArguments);
  debug.log('COMMAND', command);

  const commandArg = commandArguments.get(1);
  const subcommand = command.getCommand(commandArg);
  debug.log('SUBC', commandArg, subcommand);
  if (commandArg && commandArg[0] === '-') {
    completeOptions(command, completions, commandArg);
  } else {
    if (subcommand) {
      completions = completions.concat(getArgCompletions(subcommand, commandArguments));
    } else {
      completions = [...completions, ...completeSubcommands(command, commandArg)];
    }
    completeOptions(command, completions);
    completeArguments(command, completions);
  }
  debug.log('COMPLETIONS', completions);
  return completions;
}

/**
 * Utility function to get completions for subcommands.
 *
 * @param  command     A commando.
 * @param  completions    An array of completions, new values will be pushed into this array.
 * @param  prefix       An optional prefix to filter subcommands.
 * @access private
 */
function completeSubcommands(command: Commando, prefix: string = ''): string[] {
  debug.log('COMPLETE_SUBCOMMAND', { command, prefix });
  const nameMap = command.get('commands') as immutable.Map<string, Commando>;
  const names: string[] = nameMap
    .map((c?: Commando) => c ? c.get('name') : '')
    .toArray()
    .filter(s => s !== '');

  debug.log('PREFIX', { prefix, names });
  if (prefix === '') {
    return names;
  }

  return names.filter(name => name.startsWith(prefix));
}

/**
 * Utility function to get completions for options in a command.
 *
 * @param  command     A commando.
 * @param  completions An array of completions, new values will be
 * pushed into this array.
 * @param  prefix      An optional prefix to filter subcommands.
 * @access private
 */
function completeOptions(command: Commando, completions: string[], prefix: string = '') {
  const options = command.get('options');
  options.forEach((option: immutable.Map<string, string>) => {
    const short = `-${option.get('short')}`;
    const long = `--${option.get('long')}`;
    if (short !== '-' && short.startsWith(prefix)) {
      completions.push(short);
    }
    if (long !== '--' && long.startsWith(prefix)) {
      completions.push(long);
    }
  });
}

/**
 * Utility function to get completions for arguments in a command.
 *
 * @param  command     A commando.
 * @param  completions    An array of completions, new values will be
 * pushed into this array.
 * @access private
 */
function completeArguments(command: Commando, completions: string[]) {
  return command.get('arguments')
    .map((a: immutable.Map<string, string>) => a.get('arg'));
}

/**
 * Generate bash completion code.
 *
 * @param  command A base command
 * @return         A string with a bash script for auto completion
 */
function bashCompletion(command: Commando): string {
  const appName = command.get('name');
  const appPath = `${process.argv[0]} ${process.argv[1]}`;

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
