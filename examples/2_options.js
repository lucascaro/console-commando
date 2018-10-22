'use strict';

const Commando = require('../lib/commando').default;
const path = require('path');

/**
 * Options command example
 */
const commando = new Commando('example2')
  .name(path.basename(__filename))
  .version('1.0.0-options-example')
  .description('This is a simple command with no arguments. This command ' +
  ' has an action that the options.')
  .option('-f', 'a simple flag')
  .option('--flag', 'another simple flag')
  .option('-c --combine', 'you can combine short and long optoins')
  .option('-a --argument [optionalArg]', 'or add optional arguments')
  .option('-r --required <requiredArg>', 'or event required arguments')
  .option('-d --default', 'arguments can have default values', 'my default')
  .action(function (command) {
    console.log('The command was executed. Try %s help for help.',
      command.get('name'));
    if (command.getOption('f')) {
      console.log('Option f was selected');
    }
    if (command.getOption('flag')) {
      console.log('Option flag was selected');
    }
    if (command.getOption('combine')) {
      // works with either -c or --combine
      console.log('Option combine was selected');
    }
    if (command.getOption('argument')) {
      console.log('Option arg was selected with value %s',
        command.getOption('argument'));
      console.log('Value can be accessed using all names [%s] [%s]',
        command.getOption('a'), command.getOption('optionalArg'));
    }
    if (command.getOption('requiredArg')) {
      // The value for this one will always be set by the user.
      console.log('Option required was selected with value %s',
        command.getOption('requiredArg'));
    }
    console.log('default value:', command.getOption('default'));
  });

commando.args(process.argv.slice(2)).run();
