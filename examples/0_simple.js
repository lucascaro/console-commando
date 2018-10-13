'use strict';

var Commando = require('../lib/commando');
var path = require('path');

/**
 * Simple command example
 */
var commando = new Commando()
  .name(path.basename(__filename))
  .version('1.0.0-simple-example')
  .description('This is a simple command with no arguments. This command ' +
  ' does nothing.');

commando.args(process.argv.slice(2)).run();
