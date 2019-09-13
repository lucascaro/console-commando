# Console Commando

[![Actions Status](https://github.com/lucascaro/console-commando/workflows/build-status/badge.svg)](https://github.com/lucascaro/console-commando/actions)
[![Typedoc](https://img.shields.io/badge/docs-read-green)](http://lucascaro.github.io/console-commando/)

<!-- [![Documentation](https://doc.esdoc.org/github.com/lucascaro/console-commando/badge.svg)](https://doc.esdoc.org/github.com/lucascaro/console-commando/) -->

A library for creating command line tools with node.

## Installation:

```
npm install --save console-commando
```

## Why you want to use this

`console-commando` allows you to easily create complex command line utilities in a
simple, type-safe, testable, modular way.

Creating both simple and complex commands becomes a trivial task.

This library provides a very simple way of creating all kinds of
commands, from simple CLI tools with a few options, to semantic CLIs with
several levels of nesting.

With `console-commando` you can _create cli utilities that make sense_ very easily.
The following for example would be trivial to set up:

```js
mycommand my-resource my-action --an-option --another=option and arbitrary arguments
```

`console-commando` also produces easy to read help automatically as well as bash
completion for sub commands.

Additionally, everything in `console-commando` is type-safe, functional and
immutable, reducing ambiguity and the need for `new` or `this`.

## Usage

### Key concepts

#### Command

The core of `console-commando` is the `Command` object. A helper function
`command()` is provided to easily create new `Command` objects.

```js
import { command } from "console-commando";

const myCommand = command("a-name");
// Returns a new Command with the specified name.
```

#### Options and Arguments

An `Option` is a flag that can be passed to the command and will modify the
execution behavior. Options are prefixed with `--` (long option) or `-` (short
option).

There are several types of options and corresponding helper functions to add
them to a command.

Examples of options could be: `-h`, `--help`, `--flag=value`, or `--flag value`.

An `Argument` is similar to an option, but instead of being specified by name,
the value is passed to the command positionally.

For example in the following command invocation:

```
command -f --f2=val --f3 1 arg1 arg2
```

- `-f` is a boolean option (short) set to true by being present in the invocation.
- `--f2` is a string option (long), it's value is set to `"val"`
- `--f3` is a numeric option (long) set to `1`
- `arg1` and `arg2` are positional arguments (only the values are used).

### Example: Simple Command

You can create simple commands very easily. Just provide a few settings and an
action. The action will be called with any options passed in the command-line.

```js
// Using CommonJS modules
import { command, stringOption, numericOption, flag } from "console-commando";

// Create a new command, with name, version and description.
command("command-name")
  // since everything is immutable, each "with" function returns a new Command
  // with the specified value set.
  .withVersion("1.0.1")
  .withDescription("")

  // Add global options.
  // -h or --host, with description and default value
  .withOption(stringOption("host", "h", "Host name", "localhost"))
  // Options are strictly typed.
  .withOption(numericOption("port", "p", "Port number", 8080))
  // Flags have no value parameter, they are set to true if present.
  .withOption(flag("debug", "d", "Enable debugging"))

  // A handler is the function that gets called if this command is invoked.
  .withHandler((cmd, state) => {
    console.log(JSON.stringify(state));
  })

  // Pass arguments to the command and run it.
  .withRuntimeArgs()
  .run();
```

### Subcommands

You can add subcommands to your command any time by using the `command` method:

```js
// Using node's require
import { commando, flag, stringOption } from "console-commando";

// Create a new command, with name, version and description.
command("command-name")
  .withVersion("1.0.1")
  .withDescription("")

  // Add global options.
  .withOption(flag("verbose", "-v", "Log more output", true))

  // Act on global options, before any sub commands are executed.
  // State is immutable yet a preprocessor can return a new state that will be
  // passed to later preprocessors and to the invoked handler.
  .withPreProcessor((_, state) => state.set("runtime", "state"));
)

  // Add a subcommand.
  .withSubCommand(
    // Sub commands are also commands.
    command("subcommand")
      // You can add options.
      .withOption(stringOption("sub-option", "s", "An option for the subcommand"))
      // Define an action for this sub command.
      .withHandler((command, state) => {
        // Get options for this command.
        const subOption = command.getStringOption("subOption");
        // Or get global options for the root command.
        const verbose = command.getFlag("verbose");
      })

      // And you can add sub commands to sub commands too.
      //.withSubCommand(...)
      // ...
      // and so on, and so forth
      (),
  )

  // Pass arguments to the command and run it.
  .withRuntimeArgs()
  .run();
```

## CLI auto completion

Similarly to [npm completion](https://docs.npmjs.com/cli/completion), `console-commando` makes it easy to get auto completion for your commands.

Simply run the following in your terminal:

```sh
source <(your-command completion)
```

Note that this assumes the command has been installed as an executable command
with the name specified in the root `command`.

After doing this you should be able to auto complete your command, subcommands
and options when hitting the `tab` key twice.

## API

Console commando's public API is a series of pure functions that produce
immutable intermediate Command objects. Command objects are are immutable, via
[immutable.js](https://facebook.github.io/immutable-js/).

[Read the API Documentation](http://lucascaro.github.io/console-commando/index.html)

### Defining the Command

The `Command` interface defines the main functionality of `console-commando` programs.

#### `command(): Command` factory

```ts
command(name);
```

Creates a new `Command` with a given `name`.

#### `withVersion: (version: string) => Command`

```ts
command(name).withVersion("1.0.0");
```

Returns a copy of the `Command` with the given version string.

#### `withDescription: (description: string) => Command`

```ts
command(name).withDescription("some text");
```

Returns a copy of the `Command` with the given description string.

#### `withOption: (definition: Option) => Command`

Returns a copy of the `Command` with the given option.

#### `withArgument: (definition: Argument) => Command`

Returns a copy of the `Command` with the given argument.

#### `withSubCommand: (subCommand: Command) => Command`

Returns a `Command` with a new subcommand attached to it.

#### `withHandler: (fn: Handler) => Command`

Returns a command with the given action handler. This is
the function that will be called when this command or subcommand is
invoked.

The action can return a value of `ReturnValue.SUCCESS` or
`ReturnValue.FAILURE` to indicate the exit status.

#### `withPreProcessor: (fn: PreProcessor) => Command`

Returns a new `Command` with the given pre-processor. This function will
be executed before any handlers and can be used to mutate the global state.

#### `getFlag: (name: string) => boolean`

When used within a handler, it returns the value of a boolean option.

#### `getStringOption: (name: string) => string | undefined`

When used within a handler, it returns the value of a string option.

#### `getNumericOption: (name: string) => number | undefined`

When used within a handler, it returns the value of a numeric option.

#### `getMultiStringOption: (name: string) => string[]`

When used within a handler, it returns the value of a multi-string option.

#### `getStringArg: (name: string) => string | undefined`

When used within a handler, it returns the value of a string argument.

#### `getNumericArg: (name: string) => number | undefined`

When used within a handler, it returns the value of a numeric argument.

#### `getMultiStringArg: (name: string) => string[]`

When used within a handler, it returns the value of a multi-string argument.

### Running the command

#### `withRuntimeArgs: (args?: string[], parsed?: ParsedRuntimeArgs) => Command`

Adds runtime arguments to the command. If invoked without arguments it will
default to `process.argv.slice(2)`, i.e. the command line arguments after the
command name.

#### `run: (state?: RuntimeState) => Promise<ReturnValue>`

Runs the command. Required for anything to happen.

## Contributing

I would love to hear from anyone using this library, and if there's anything
that you thing may improve it, please [add an issue in github](https://github.com/lucascaro/console-commando/issues/new)!

I'd also welcome any pull requests, although I'd suggest that you create an
issue first to start the discussion.

The main points of improvement at the moment are:

- better test case coverage.
- documentation improvements.
- stronger option parsing and validation.
- option to override help text.
- and any issues/bugs that are still open in github.
