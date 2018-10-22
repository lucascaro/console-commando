'use strict';

const Commando = require('../lib/commando').default;
const path = require('path');

let myCustomValue = 'default value';

/**
 * Before action example
 */
const commando = new Commando('example3')
  .name(path.basename(__filename))
  .version('1.0.0-before-example')
  .description('This is a simple command with no arguments. This command ' +
  ' has an action that the options.')
  .option('-f', 'a simple flag')
  .before(function (command, _, context) {
    // This code will be executed before all actions. You can use this
    // to set global options for your command and subcommands.
    if (command.getOption('f')) {
      myCustomValue = 'f has been selected';
    }
    context.set('some_key', {some: 'value'});
  })
  .action(function (command, _, context) {
    console.log('The command was executed. Try %s help for help.',
      command.get('name'));
    console.log('custom value: %s', myCustomValue);
    console.log('value from context is', context.get('some_key'));
  });

commando.args(process.argv.slice(2)).run();
