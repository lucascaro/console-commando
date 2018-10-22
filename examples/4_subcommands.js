'use strict';

const Commando = require('../lib/commando').default;
const path = require('path');

/**
 * Subcommands command example
 */
const commando = new Commando('example4')
  .name(path.basename(__filename))
  .version('1.0.0-subcommand-example')
  .description('This is a command with subcommands.')
  .option('-f', 'a simple flag', false)
  .before(function (command, _, context) {
    // This code will be executed before all actions. You can use this
    // to set global options for your command and subcommands.
    context.set('force', command.getOption('f'));
    
  })
  // No action in the main command will display the help text by default.
  .command(
    new Commando('sub1')
    .action(subAction)
  )
  .command(
    new Commando('sub2')
    .action(subAction)
  );

function subAction(command, _, context) {
  console.log('%s was executed.',
    command.get('name'));
  console.log('global flag: %s', context.get('force'));
}
commando.args(process.argv.slice(2)).run();
