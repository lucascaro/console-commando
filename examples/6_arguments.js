'use strict';

const Commando = require('../lib/commando').default;
const path = require('path');

/**
 * Options command example
 */
const commando = new Commando('example6')
  .name(path.basename(__filename))
  .version('1.0.0-options-example')
  .description('This is a simple command with arguments. This command ' +
  ' has an action that reads the argument.')
  .command(
    new Commando('arg')
    .argument('<myArgument>', 'an argument', 'default')
    .action(function (command) {
      console.log('The command was executed. Try %s help for help.',
        command.get('name'));
      
      if (command.getArgument('myArgument')) {
        console.log('Argument myArgument was set to %s',
          command.getArgument('myArgument'));
      }
    })
  );

commando.args(process.argv.slice(2)).run();
