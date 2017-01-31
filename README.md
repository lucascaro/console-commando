# Console Commando
[![Build Status](https://travis-ci.org/lucascaro/console-commando.svg?branch=master)](https://travis-ci.org/lucascaro/console-commando)
[![Documentation](https://doc.esdoc.org/github.com/lucascaro/console-commando/badge.svg)](https://doc.esdoc.org/github.com/lucascaro/console-commando/)

A library for creating command line tools with node.

## Installation:

```
npm install --save console-commando
```
## Why use this instead of [insert library here]

This library is greatly inspired in Commander, but optimized for recursive
commands. I couldn't find a library that would let me easily set up simple
commands as well as complicated command structures in a consistent way.

This library aims to provide a very simple way of creating all kinds of
commands, from simple commands with options, to semantic commands with
several levels of recursion.

With this library you can create commands that make sense very easily. The
following for example would be trivial to set up:

```js
mycommand my-resource my-action --an-option --another=option and arbitrary arguments
```

This library also produces easy to read help automatically.

## Usage

### Simple Command

You can create simple commands very easily. Just set the options and an action.
The action will be called with any options.

```js
// Using CommonJS modules
import Commando from 'console-commando'

// Create a new command, with name, version and description.
var command = new Commando('command-name')
  .version('1.0.1')
  .description('')

  // Add global options.
  .option('-h --host <host>', 'Host name')
  .option('-p --port <port>', 'Port number', '8080')
  .option('-d --debug', 'Log all output', true)

  // Define an action.
  .action(function (command) {

  });

  // Pass arguments to the command and run it.
  commando.args(process.argv.slice(2)).run();
```

###  Subcommands

You can add subcommands to your command any time by using the `command` method:

```js
// Using node's require
var Commando = require('console-commando').default

// Create a new command, with name, version and description.
var command = new Commando('command-name')
  .version('1.0.1')
  .description('')

  // Add global options.
  .option('-v --verbose', 'Log more output', true)

  // Act on global options, before any sub commands are executed.
  .before(function (command) {

  })

  // Add a subcommand.
  .command(
    // Sub commands are also commands.
    new Commando('subcommand')
      // You can add options.
      .option('-s --sub-option [subOption]', 'An option for the subcommand')
      // Define an action for this sub command.
      .action(function (command, rootCommand) {
        // You can access the current subcomand or the root command.
        // Get options for this command.
        var subOption = command.getOption('subOption');
        // Or get global options for the root command.
        var verbose = rootCommand.getOption('verbose');
      })

      // And you can add sub commands to sub commands too.
      .command(
        // ...
        // and so on, and so forth
      )
  );

  // Pass arguments to the command and run it.
  commando.args(process.argv.slice(2)).run();
```

## CLI auto completion

Similarly to [npm completion](https://docs.npmjs.com/cli/completion), console-commando makes it easy to get auto completion for your commands.

Simply run the following in your terminal:

```sh
source <(your-command completion)
```

Note that this assumes the command has been installed as an exacutable command with the name specified in the root `Commando`.

After doing this you should be able to auto complete your command, subcommands and options when hitting the `tab` key twice.

## API

Console commando's public API is based in the `Commando` class. Instances of
Commando are are immutable, via [immutable.js](https://facebook.github.io/immutable-js/).

### Commando

The `Commando` class is in charge of creating commands, sub commands, adding
options, parsing arguments, etc.

#### `#Commando()` constructor

The `Commando` constructor can be used in a few different ways:

```js
new Commando(): Commando
```

Creates and returns a new command with default (empty) values. This can be used
as a base for all commands.

```js
new Commando(string: name): Commando
```

Creates and returns a new command with a `name` as its name.

```js
new Commando(object: config): Commando
```

Creates and returns a new command with a set of options.

#### `#name(value: string): Commando`
#### `#version(value: string): Commando`
#### `#description(value: string): Commando`

Setters for the `name`, `version`, and `description` properties of a command. Returns a command based on the original, with the respective property set to `value`.

#### `#option(optString: string, description: string, defaultValue: any): Commando`

Returns a command with a new option based on the given `optString`, `description`, and `defaultValue`.

#### `#command(command: Commando): Commando`

Returns a command with a new subcommand attached to it.

#### `#action(action: (Commando, Commando): Boolean): Commando`

Returns a command with it's action property set to `action`. This is
the function that will be called when this command or subcommand is
invoked.

The action can return a value of `Commando.RETURN_VALUE_SUCCESS` or
`Commando.RETURN_VALUE_FAILURE` to indicate the exit state.

## Contributing

I would love to hear from anyone using this library, and if there's anything
that you thing may improve it, please [add an issue in github](https://github.com/lucascaro/console-commando/issues/new)!

I'd also welcome any pull requests, although I'd suggest that you create an
issue first to start the discussion.

The main points of improvement at the moment are:

- better test case coverage.
- documentation improvements.
- stronger option parsing and validation.
- option to manually set help text.
- and any issues that are still open in github.
