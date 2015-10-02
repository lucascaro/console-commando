'use strict';

// Classes
var Formatter = require('./formatter');
var util = require('util');
var Immutable = require('immutable');
// var Command = require('./command');
var Option = require('./option');

// Libraries
var chalk = require('chalk');
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

Commando.prototype.description = function (description) {
  return new Commando(this._config.set('description', description));
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

Commando.prototype.usage = function () {
  console.log();
  console.log(chalk.yellow('Usage:'));

  console.log('%s    %s%s      %s',
    chalk.green(this.get('name')),
    this.get('options').isEmpty() ? '' : '[options] ',
    this.get('commands').isEmpty() ? '' : '[commands] ',
    this.get('description')
  );
};

Commando.prototype.help = function () {
  var fmt     = this.get('formatter');
  var padCmd  = fmt.padCommand();
  var padDesc = fmt.padDescription();
  var version = this.get('version');
  console.log('%s %s',
    chalk.green(this.get('name')),
    version ? chalk.yellow('v' + version) : '');

  this.usage();

  if (!this.get('options').isEmpty()) {
    console.log();
    console.log(chalk.yellow('Options:'));
    this.get('options').forEach(function (option) {
      console.log('    -%s --%s\t\t%s',
        option.get('short'),
        option.get('long'),
        option.get('description'));
    });
  }
  if (!this.get('commands').isEmpty()) {
    console.log();
    console.log(chalk.yellow('Available Subcommands:'));

    this.get('commands').forEach(function (command) {
      var subCommands = command.get('commands').keySeq().toArray();
      if (subCommands.length > 0) {
        subCommands = util.format('[%s]', subCommands.join(' | '));
      }
      console.log('  %s %s %s',
        padCmd(chalk.green(command.get('name'))),
        padDesc(command.get('description')),
        subCommands
      );
    });
  }
  console.log();
};

Commando.prototype.getCommand = function (name) {
  return this._config.getIn(['commands', name]);
};

/**
 * Returns the value for an applied option.
 * @param  {[type]} key the option key (short, long, or key)
 * @return {[type]}     the value for the specified option.
 */
Commando.prototype.getOption = function (key) {
  var args = this.get('args');
  var option = this.get('options').find(function (v) {
    // console.log('v: %j\nk:%j\no:%j\n',v,k,o);
    // console.log(v);
    return v.get('key') === key ||
      v.get('short') === '-' + key ||
      v.get('long') === '--' + key;
  });
  console.log(option);
  if (option) {
    return args.get(option.get('value'));
  }
};

Commando.prototype.run = function (optionsList) {
  var args = this.get('args');

  if (optionsList === undefined) {
    optionsList = this.get('options');
  } else {
    optionsList = optionsList.concat(this.get('options'));
  }

  console.log('running %s with args:', this.get('name'), args);
  var positionalArgs = args.get('_');
  if (positionalArgs && positionalArgs.size > 0) {
    var commandArg = positionalArgs.get(0);
    var command = this._config.getIn(['commands', commandArg]);
    if (command !== undefined) {
      // var recursionArgs = args.set('_', positionalArgs.shift());
      var res = command.run(optionsList);
      if (res === RETURN_VALUE_FAILURE) {
        // command.help();
      }
      return res;
    }
  }
  var action = this.get('action');
  if (action) {
    // console.log('running action');
    var res = action(this, this.get('rootArgs'), optionsList);
    if (res === undefined) {
      res = RETURN_VALUE_SUCCESS;
    }
    return res;
  } else {
    console.error('No action defined for the given command');
    this.help();
    return RETURN_VALUE_FAILURE;
  }

};

Commando.prototype.args = function (args, rootArgs) {
  if (!args) {
    return this;
  }
  if (!(args instanceof Immutable.Map)) {
    args = Immutable.fromJS(minimist(args));
  }
  if (rootArgs === undefined || rootArgs === null) {
    rootArgs = args;
  }

  if (this.validateArgs(args)) {

    return new Commando(this._config.set('args', args)
    .set('rootArgs', rootArgs)
    .set('commands', this.subcommandsWitArgs(args, rootArgs))
  );
  } else {
    console.log('invalid args');
    return this;
  }
};

Commando.prototype.subcommandsWitArgs = function (args, rootArgs) {
  var positionalArgs = args.get('_');
  var subcommands = this.get('commands');
  // console.log('subcommandsWitArgs', args);
  if (positionalArgs && positionalArgs.size > 0) {
    var commandArg = positionalArgs.get(0);
    // console.log('subcommandsWitArgs arg', commandArg);
    subcommands = subcommands.map(function (command, name) {
      // console.log('subcommandsWitArgs cmd', name);
      if (name === commandArg) {
        var recursionArgs = args.set('_', positionalArgs.shift());
        return command.args(recursionArgs, rootArgs);
      } else {
        return command;
      }
    });
  }
  return subcommands;
};

Commando.prototype.validateArgs = function (args) {
  console.log('validate', args);
  return true;
};

/**
 * Commando default configuration.
 *
 * @return {Immutable.Map} the default (empty) configuration for commando.
 */
function defaultConfig() {
  return Immutable.fromJS({
    action: null,
    aliases: Immutable.List(),
    args: Immutable.Map(),
    commands: Immutable.Map(),
    formatter: new Formatter(),
    description: '',
    name: null,
    options: Immutable.List(),
    rootArgs: Immutable.Map(),
    version: null,
  });
}
Commando.prototype.defaultConfig = defaultConfig;

// Expose sub classes.
Commando.Command = Commando;
Commando.Option = Option;

module.exports = Commando;
