import * as path from 'path';
import { command, flag, Command } from '..';
import { RuntimeState } from '../src';

/**
 * Subcommand recursion example
 */
command(path.basename(__filename))
  .withVersion('1.0.0-recursion-example')
  .withDescription(
    'This is a command with multiple levels of sub commands.',
  )
  .withOption(flag('force', 'f'))
  .withPreProcessor((command, context) => {
    // This code will be executed before all actions. You can use this
    // to set runtime context for your command and subcommands.
    return context.set('force', command.getFlag('force'));
  })
  // No handler in the main command will display the help text by default.
  .withSubCommand(
    command('sub1')
      .withHandler(subHandler)
      .withSubCommand(
        command('sub2')
          .withHandler(subHandler)
          .withSubCommand(
            command('sub3')
              .withHandler(subHandler)
              .withSubCommand(
                command('sub4')
                  .withHandler(subHandler),
              ),
          ),
      ),
  )
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();

function subHandler(command: Command, context: RuntimeState) {
  console.log('%s in %s was executed.', command.state.name, path.basename(__filename));
  console.log('global flag from context: %s', context.get('force'));
  console.log('try adding --help');
}
