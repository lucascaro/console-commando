'use strict';

var Commando = require('../lib/commando');
var path = require('path');

var globalFlag = 'default';

/**
 * Subcommands command example
 */
var commando = new Commando()
  .name(path.basename(__filename))
  .version('1.0.0-subcommand-example')
  .description('This is a command with subcommands.')
  .option('-f', 'a simple flag')
  .before(function (command) {
    // This code will be executed before all actions. You can use this
    // to set global options for your command and subcommands.
    if (command.getOption('f')) {
      globalFlag = 'force';
    }
  })
  // No action in the main command will display the help text by default.
  .command(
    new Commando('sub1')
    .action(subAction)
    .command(
      new Commando('sub2')
      .action(subAction)
      .command(
        new Commando('sub3')
        .action(subAction)
        .command(
          new Commando('sub4')
          .action(subAction)
        )
      )
    )
  );

function subAction(command, rootCommand) {
  console.log('%s in %s was executed.',
    command.get('name'), rootCommand.get('name'));
  console.log('global flag: %s', globalFlag);
}
commando.args(process.argv.slice(2)).run();
