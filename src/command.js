'use strict';

var Immutable = require('immutable');
var Option = require('./option');

var debug = require('./debug');

function Command(config) {
  if (config instanceof Command) {
    return config;
  } else if (this instanceof Command) {
    this._config = defaultConfig().merge(Immutable.fromJS(config));
  } else {
    return new Command(config);
  }
}

// Class methods
// Setters / getters
Command.prototype.version = function (version) {
  return new Command(this._config.set('version', version));
};

Command.prototype.get = function (key) {
  return this._config.get(key);
};

// Command construction
Command.prototype.option = function () {
  var option = new Option(arguments);
  var options = this._config.get('options');

  return new Command(this._config.set('options', options.push(option)));
};

Command.prototype.runWithArgs = function (args) {
  debug.log('running %s with args:', this.get('name'), args);
  if (this.get('action')) {
    this.runWithArgs(args);
  }
  if (args._.length > 0) {
    var commandArg = args._[0];
    var command = this._config.getIn(['commands', commandArg]);
    if (command === undefined) {
      console.error('Command not found: ', commandArg);
    } else {
      command.runWithArgs(args.slice(1));
    }
  }
};

Command.prototype.debug = function () {
  debug.log('Command: %s', this.get('name'));
  this.get('options').forEach(function (option) {
    option.debug();
  });
  debug.log('Subcommands:');
  this.get('subCommands').forEach(function (option) {
    option.debug();
  });
};

/**
 * Command default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    name: '',
    options: Immutable.List([]),
    subCommands: Immutable.List([]),
    action: null,
  });
}
Command.prototype.defaultConfig = defaultConfig;

module.exports = Command;
