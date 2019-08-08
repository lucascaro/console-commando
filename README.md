# Console Commando

[![Build Status](https://travis-ci.org/lucascaro/console-commando.svg?branch=master)](https://travis-ci.org/lucascaro/console-commando)

<!-- [![Documentation](https://doc.esdoc.org/github.com/lucascaro/console-commando/badge.svg)](https://doc.esdoc.org/github.com/lucascaro/console-commando/) -->

A library for creating command line tools with node.

## Installation:

```
npm install --save console-commando
```

## Why use this instead of [insert library here]

This library is inspired by Commander, but optimized for functional nested
commands. I couldn't find a library that would let me easily set up simple
commands as well as complicated command structures in a consistent way.

This library aims to provide a very simple way of creating all kinds of
commands, from simple CLI tools with a few options, to semantic CLIs with
several levels of nesting.

With this library you can create commands that make sense very easily. The
following for example would be trivial to set up:

```js
mycommand my-resource my-action --an-option --another=option and arbitrary arguments
```

This library also produces easy to read help automatically as well as bash
completion for sub commands (beta).

Console-commando is functional and immutable. No more classes, `new` or `this`.

## Usage

### Simple Command

You can create simple commands very easily. Just set the options and an action.
The action will be called with any options.

```js
// Using CommonJS modules
import { command, stringOption, numericOption, flag } from "console-commando";

// Create a new command, with name, version and description.
command("command-name")
  .withVersion("1.0.1")
  .withDescription("")

  // Add global options.
  // -h or --host, with description and default value
  .withOption(stringOption("host", "h", "Host name", "localhost"))
  // Options are strictly typed.
  .withOption(numericOption("port", "p", "Port number", 8080))
  // Flags have no value (i.e.)
  .withOption(flag("debug", "d", "Enable debugging"))

  // Define a handler.
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
  // State is immutable yet a preprocessor can return a new state.
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

Similarly to [npm completion](https://docs.npmjs.com/cli/completion), console-commando makes it easy to get auto completion for your commands.

Simply run the following in your terminal:

```sh
source <(your-command completion)
```

Note that this assumes the command has been installed as an executable command with the name specified in the root `command`.

After doing this you should be able to auto complete your command, subcommands and options when hitting the `tab` key twice.

## API

Console commando's public API is a series of pure functions that produce
immutable intermediate Command objects. Command objects are are immutable, via [immutable.js](https://facebook.github.io/immutable-js/).

### Defining the Command

The `Command` interface defines the main functionality of console-commando programs.

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
