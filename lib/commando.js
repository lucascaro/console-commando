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
  var command = new Commando(options);
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

Commando.prototype.usage = function (padding) {
  if (padding === undefined) {
    padding = '';
  }
  console.log(padding + '%s %s%s',
    this.get('name'),
    this.get('options').isEmpty() ? '' : '[options] ',
    this.get('commands').isEmpty() ? '' : '[commands] ');
};

Commando.prototype.help = function (padding) {
  if (padding === undefined) {
    padding = '';
  }
  if (this.get('version')) {
    console.log('%s v%s', this.get('name'), this.get('version'));
    console.log();
    console.log('Usage:');
  } else {
    // console.log(padding + '%s \t%s',
    //   this.get('name'),
    //   this.get('description'));
  }
  this.usage(padding);

  if (!this.get('options').isEmpty()) {
    console.log(padding + 'options:');
    this.get('options').forEach(function (option) {
      option.help(padding);
    });
  }
  if (!this.get('commands').isEmpty()) {
    console.log();
    console.log('%s%s commands:', padding, this.get('name'));
    console.log();

    this.get('commands').forEach(function (command) {
      command.help(padding + '    ');
    });
  }
  if (padding === '') {
    console.log();
  }
};

Commando.prototype.run = function () {
  var args = this.get('args');
  var rootArgs = this.get('rootArgs');

  // console.log('running %s with args:', this.get('name'), args);
  var action = this.get('action');
  var positionalArgs = args.get('_');
  if (positionalArgs.size > 0) {
    var commandArg = positionalArgs.get(0);
    var command = this._config.getIn(['commands', commandArg]);
    if (command === undefined) {
      console.error('Command not found: ', commandArg);
      return RETURN_VALUE_FAILURE;
    } else {
      // Remove the current command from the arg list

      var recursionArgs = args.set('_', positionalArgs.shift());
      return command.args(recursionArgs, rootArgs).run();
    }
  } else if (action) {
    // console.log('running action');
    var res = action(args, rootArgs);
    if (res === undefined) {
      res = RETURN_VALUE_SUCCESS;
    }
    return res;
  } else {
    console.error('No action defined for the given command');
    return RETURN_VALUE_FAILURE;
  }

};

Commando.prototype.args = function (args, rootArgs) {
  if (!(args instanceof Immutable.Map)) {
    args = Immutable.fromJS(minimist(args));
  }
  if (rootArgs === undefined || rootArgs === null) {
    rootArgs = args;
  }
  return new Commando(this._config.set('args', args).set('rootArgs', rootArgs));
};

/**
 * Commando default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    version: null,
    name: null,
    options: Immutable.List(),
    commands: Immutable.Map(),
    description: '',
    action: null,
    args: null,
    rootArgs: null,
  });
}
Commando.prototype.defaultConfig = defaultConfig;

// Expose sub classes.
Commando.Command = Commando;
Commando.Option = Option;

module.exports = Commando;
