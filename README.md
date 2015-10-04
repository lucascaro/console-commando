# Console Commando

A library for creating command line tools with node.

## Installation:

```
npm install --save console-commando
```

## Usage

### Simple Command

You can create simple commands very easily. Just set the options and an action.
The action will be called with any options.

```js
var Commando = require('console-commando');

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
var Commando = require('console-commando');

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
  );

  // Pass arguments to the command and run it.
  commando.args(process.argv.slice(2)).run();
```

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
