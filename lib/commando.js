'use strict';

// Classes
var Immutable = require('immutable');
// var Command = require('./command');
var Option = require('./option');

// Libraries
var minimist = require('minimist');

// Constants

var RETURN_VALUE_SUCCESS = true;
var RETURN_VALUE_FAILURE = false;
// var Commando = Immutable.fromJS({});

function Commando(config) {
  if (config instanceof Commando) {
    return config;
  } else if (this instanceof Commando) {
    this.root = this;
    this._config = defaultConfig().merge(Immutable.fromJS(config));
  } else {
    return new Commando(config);
  }
}

// Class methods
// Setters / getters
Commando.prototype.version = function (version) {
  return new Commando(this._config.set('version', version));
};

Commando.prototype.get = function (key) {
  return this._config.get(key);
};

// Command related methods
Commando.prototype.command = function (options) {
  options.parent = this;

  var command = new Commando(options);
  command.root = this.root;
  var newConfig = this._config.setIn(
    ['commands', command.get('name')],
    command);
  return new Commando(newConfig);
};

Commando.prototype.option = function () {
  var option = new Option(arguments);
  var options = this.get('options');

  return new Commando(this._config.set('options', options.push(option)));
};

Commando.prototype.action = function (action) {
  return new Commando(this._config.set('action', action));
};

Commando.prototype.debug = function () {
  console.log('Command:');
  console.log('Name: %s, Version: %s', this.get('name'), this.get('version'));
  this.get('options').forEach(function (option) {
    option.debug();
  });
  this.get('commands').forEach(function (command) {
    command.debug();
  });
};

Commando.prototype.run = function () {
  var args = this.get('args');

  // console.log('running %s with args:', this.get('name'), args);
  var action = this.get('action');
  if (args._.length > 0) {
    var commandArg = args._[0];
    var command = this._config.getIn(['commands', commandArg]);
    if (command === undefined) {
      console.error('Command not found: ', commandArg);
      return RETURN_VALUE_FAILURE;
    } else {
      // Remove the current command from the arg list
      args._.splice(0, 1);
      return command.args(args).run();
    }
  } else if (action) {
    // console.log('running action');
    var res = action(args, this.root.get('args'));
    if (res === undefined) {
      res = RETURN_VALUE_SUCCESS;
    }
    return res;
  } else {
    console.error('No action defined for the given command');
    return RETURN_VALUE_FAILURE;
  }

};

Commando.prototype.args = function (args) {
  if (!args._) {
    args = minimist(args);
  }
  return new Commando(this._config.set('args', args));
};

/**
 * Commando default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    version: '0.0.0',
    name: 'commando',
    options: Immutable.List(),
    commands: Immutable.Map(),
    action: null,
    parent: null,
    root: null,
  });
}
Commando.prototype.defaultConfig = defaultConfig;

// Expose sub classes.
Commando.Command = Commando;
Commando.Option = Option;

module.exports = Commando;
