'use strict';

var Commando = require('../lib/commando');
var path = require('path');

/**
 * Action example
 */
var commando = new Commando()
  .name(path.basename(__filename))
  .version('1.0.0-action-example')
  .description('This is a simple command with no arguments. This command ' +
  ' has an action that prints text.')
  .action(function (command) {
    console.log('The command was executed. Try %s help for help.',
      command.get('name'));
  });

commando.args(process.argv.slice(2)).run();
