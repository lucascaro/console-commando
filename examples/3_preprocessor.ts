import * as path from 'path';
import { command, flag } from '..';

/**
 * PreProcessor example
 */
command(path.basename(__filename))
  .withVersion('1.0.0-preprocessor-example')
  .withDescription(
    'This command has an action and a pre-processor.',
  )
  .withOption(flag('flag', 'f', 'add simple flags'))
  .withPreProcessor((command, context) => {
    // This code will be executed before all actions. You can use this
    // to set runtime context for your command and subcommands.
    return context.set('some_key', { some: 'value' });
  })
  .withHandler((command, context) => {
    console.log(
      'The command was executed. Try %s help for help.',
      command.state.name,
    );
    console.log('value from context is', context.get('some_key'));
  })
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
