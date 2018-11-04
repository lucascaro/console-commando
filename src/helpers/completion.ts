'use strict';

import * as Debug from 'debug';
const debug = Debug('console-commando:completion');

import * as immutable from 'immutable';
import { Command } from '../Command';
import { flatten } from './array';

/**
 * Get valid completion values for a command and a list of arguments.
 *
 * @return a list of possible completions.
 */
export function getCompletions(command: Command): string {
  const args = command.state.parsedRuntimeArgs.get('_') as string[];
  debug('INITIAL ARGS', args);
  // Drop the 'get-completions' argument as well as the command name.
  return getArgCompletions(command, args.slice(2)).join(' ');
  return '';
}
/**
 * Utility function to return valid list of args.
 *
 * @param command      A command command.
 * @param args  A list of arguments. (for internal use)
 *
 * @return {string} a list of possible completions.
 * @access private
 */
function getArgCompletions(command: Command, args: string[] = []): string[] {
  debug('args', args);
  debug('command', command.state.name);

  const firstArg = args[0] as string | undefined;
  const subcommand = firstArg ? command.state.subCommands.get(firstArg) : undefined;

  if (!firstArg || firstArg === '') {
    // Return all available options if no argument is passed.
    return [
      ...completeOptions(command),
      ...completeArguments(command),
      ...completeSubcommands(command),
    ];
  }
  debug('subcommand?', firstArg, subcommand && subcommand.state);
  if (subcommand) {
    // Let the subcommand handle completions.
    const subArgs = args.slice(1);
    debug(`complete subcommand '${subcommand.state.name}' with args: ${subArgs}`);
    return  [
      ...completeOptions(command),
      ...getArgCompletions(subcommand, subArgs),
    ];
  }

  if (firstArg[0] === '-') {
    return completeOptions(command, firstArg);
  }

  // At this point, firstArg is a non-empty string that doesn't start with '-'
  return completeSubcommands(command, firstArg);

}

/**
 * Utility function to get completions for subcommands.
 *
 * @param  command     A command.
 * @param  completions    An array of completions, new values will be pushed into this array.
 * @param  prefix       An optional prefix to filter subcommands.
 * @access private
 */
function completeSubcommands(command: Command, prefix: string = ''): string[] {
  debug('complete subcommands', { prefix, command: command.state });
  const names = Array.from(command.state.subCommands.keys());
  return prefix ? names.filter(n => n.startsWith(prefix)) : names;
}

/**
 * Utility function to get completions for options in a command.
 *
 * @param  cmd     A command.
 * @param  completions An array of completions, new values will be
 * pushed into this array.
 * @param  prefix      An optional prefix to filter subcommands.
 * @access private
 */
function completeOptions(cmd: Command, prefix: string = ''): string[] {
  debug(`complete options with prefix ${prefix}`);
  return flatten(
    Array.from(
      cmd.state.options.map((o) => {
        const completions = [];
        const short = o.short ? `-${o.short}` : undefined;
        const long  = o.long ? `--${o.long}` : undefined;
        if (short && short.startsWith(prefix)) {
          completions.push(short);
        }
        if (long && long.startsWith(prefix)) {
          completions.push(long);
        }
        return completions;
      })
      .values(),
    ),
  );
}

/**
 * Utility function to get completions for arguments in a command.
 */
function completeArguments(cmd: Command): string[] {
  return Array.from(cmd.state.arguments.map(a => a.name).values());
}

/**
 * Generate bash completion code.
 *
 * @param  command A base command
 * @return         A string with a bash script for auto completion
 */
export function bashCompletion(command: Command): string {
  const appName = command.state.name;
  const appPath = `${process.argv[0]} ${process.argv[1]}`;

  return `
###-begin-${appName}-completions-###
#
# ${appName} command completion script
#
# Installation:
#    Bash:
#       echo source <(${appName} completion) >> ~/.bashrc
#    or:
#       echo source <(${appName} completion) >> ~/.bash_profile
#    Zsh:
#       echo autoload bashcompinit >> ~/.zshrc
#       echo bashcompinit >> ~/.zshrc
#       echo source <(${appName} completion) >> ~/.zshrc
#
_${appName}_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=$(printf "%s " "\${COMP_WORDS[@]}")
    # ask app to generate completions.
    type_list=$(${appPath} get-completions -- $args)

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
