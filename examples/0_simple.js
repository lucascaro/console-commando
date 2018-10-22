'use strict';

const Commando = require('../lib/commando').default;
const path = require('path');

/**
 * Simple command example
 */
const commando = new Commando('example0')
  .name(path.basename(__filename))
  .version('1.0.0-simple-example')
  .description('This is a simple command with no arguments. This command ' +
  ' does nothing.');

commando.args(process.argv.slice(2)).run();
