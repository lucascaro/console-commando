'use strict';

var Commando = require('../lib/commando');
var path = require('path');

var myCustomValue = 'default value';

/**
 * Before action example
 */
var commando = new Commando()
  .name(path.basename(__filename))
  .version('1.0.0-before-example')
  .description('This is a simple command with no arguments. This command ' +
  ' has an action that the options.')
  .option('-f', 'a simple flag')
  .before(function (command) {
    // This code will be executed before all actions. You can use this
    // to set global options for your command and subcommands.
    if (command.getOption('f')) {
      myCustomValue = 'f has been selected';
    }
  })
  .action(function (command) {
    console.log('The command was executed. Try %s help for help.',
      command.get('name'));
    console.log('custom value: %s', myCustomValue);
  });

commando.args(process.argv.slice(2)).run();
