import { Map as IMap } from "immutable";
import { parseArguments, parseArgv, parseOptions } from "./helpers/args";
import colors from "./helpers/colors";
import { bashCompletion, getCompletions } from "./helpers/completion";
import { formatHelp } from "./helpers/format";

import Debug from "./helpers/debug";
import { StoredOptions, OptionValue, Option } from "./Options";
import { StoredArguments, Argument } from "./Arguments";
import { StateData, CommandState, makeCommandState } from "./CommandState";
const debug = Debug("console-commando:Command");

export enum ReturnValue {
  FAILURE = 0,
  SUCCESS = 1,
}

export type RuntimeState = IMap<string, unknown>;
export type Handler = (
  commandState: CommandState,
  runtimeState: RuntimeState,
) => Promise<ReturnValue | void> | void;
export type PreProcessor = (
  command: CommandState,
  runtimeState: RuntimeState,
) => RuntimeState | void;

export type OptionsOrArguments = StoredOptions | StoredArguments;

export type ParsedRuntimeArgs = IMap<string, Readonly<OptionValue>>;

export type SubCommands = IMap<string, Command>;

export interface Command {
  withVersion: (version: string) => Command;
  withDescription: (description: string) => Command;
  withOption: (definition: Option) => Command;
  withArgument: (definition: Argument) => Command;
  withSubCommand: (subCommand: Command) => Command;
  withRuntimeArgs: (args?: string[], parsed?: ParsedRuntimeArgs) => Command;
  withHandler: (fn: Handler) => Command;
  withPreProcessor: (fn: PreProcessor) => Command;
  showHelp: () => void;
  run: (state?: RuntimeState) => Promise<ReturnValue>;

  state: StateData;
}

export function withState(initialState: StateData): Command {
  const cmd: Command = {
    withVersion,
    withDescription,
    withOption,
    withArgument,
    withSubCommand,
    withRuntimeArgs,
    withHandler,
    withPreProcessor,
    showHelp,
    run,

    state: Object.freeze(initialState),
  };

  function withVersion(version: string): Command {
    debug("adding version:", version);
    return withState({ ...cmd.state, version });
  }

  function withDescription(description: string): Command {
    debug("adding description:", description);
    return withState({ ...cmd.state, description });
  }

  function withOption(definition: Option): Command {
    if (!cmd.state.parsedRuntimeArgs.isEmpty()) {
      throw new TypeError(
        `arguments cannot be added after runtime arguments are set: ${definition.name}`,
      );
    }
    debug("adding option:", definition);
    const map = cmd.state.options.merge(cmd.state.parentOptions);
    if (
      map.has(definition.name) ||
      map.some(o => !!(o.short && o.short === definition.short)) ||
      map.some(o => !!(o.long && o.long === definition.long))
    ) {
      throw new TypeError(
        `option already exists: ${definition.name} -${definition.short} --${definition.long}`,
      );
    }

    const options = cmd.state.options.set(
      definition.name,
      Object.freeze(definition),
    );
    return withState({ ...cmd.state, options });
  }

  function withHelp(): Command {
    debug("adding auto help.");
    return cmd.withOption({
      kind: "boolean",
      name: "help",
      long: "help",
      short: "h",
      description: "Show this help.",
    });
  }

  function withArgument(definition: Argument): Command {
    if (cmd.state.runtimeArgs.size > 0) {
      throw new TypeError(
        `arguments cannot be added after runtime arguments are set: ${definition.name}`,
      );
    }
    if (cmd.state.subCommands.size > 0) {
      throw new TypeError(
        `positional arguments cannot be added to a command with sub-commands defined: ${definition.name}`,
      );
    }
    debug("adding argument:", definition);
    const map = cmd.state.arguments;
    if (map.has(definition.name)) {
      throw new TypeError(
        `argument with this name already exists: ${definition.name}`,
      );
    }
    if (map.find(a => !!a.multiple)) {
      throw new TypeError(
        `Cannot add argument after multi argument: ${definition.name}`,
      );
    }

    const args = map.set(definition.name, Object.freeze(definition));
    return withState({ ...cmd.state, arguments: args });
  }

  function withSubCommand(subCommand: Command): Command {
    debug("adding subcommand:", subCommand.state.name);
    if (cmd.state.subCommands.has(subCommand.state.name)) {
      throw new TypeError(`arg already exists: ${subCommand.state.name}`);
    }
    if (cmd.state.arguments.size > 0) {
      throw new TypeError(
        `sub commands cannot be added to a command with positional arguments defined: ${subCommand.state.name}`,
      );
    }
    const subCommands = cmd.state.subCommands.set(
      subCommand.state.name,
      subCommand,
    );
    return withState({ ...cmd.state, subCommands });
  }

  function withHandler(fn: Handler): Command {
    return withState({ ...cmd.state, handler: fn });
  }

  function withPreProcessor(fn: PreProcessor): Command {
    return withState({
      ...cmd.state,
      preProcessors: cmd.state.preProcessors.push(fn),
    });
  }

  function showHelp(): void {
    console.log(formatHelp(cmd.state));
  }

  function withRuntimeArgs(
    args?: string[],
    parsed?: ParsedRuntimeArgs,
  ): Command {
    debug("adding runtime arguments:", args);
    const commandArgs = args || process.argv.slice(2);
    const runtimeArgs = cmd.state.runtimeArgs.push(...commandArgs);
    if (!cmd.state.options.merge(cmd.state.parentOptions).has("help")) {
      return withHelp().withRuntimeArgs(args, parsed);
    }

    try {
      const parsedRuntimeArgs = parseArgv(
        commandArgs,
        parsed || cmd.state.parsedRuntimeArgs,
      );
      const options = parseOptions(parsedRuntimeArgs, cmd.state.options);
      const args = parseArguments(parsedRuntimeArgs, cmd.state.arguments);
      debug("PARSED", parsedRuntimeArgs);
      return withState({
        ...cmd.state,
        runtimeArgs,
        options,
        parsedRuntimeArgs,
        arguments: args,
      });
    } catch (e) {
      console.error(colors.red(`\nError: ${e.message}\n`));
      showHelp();
      return process.exit(ReturnValue.FAILURE);
    }
  }

  function run(state: RuntimeState = IMap()): Promise<ReturnValue> {
    debug("running command:", cmd.state.name);
    const parsedArgs = cmd.state.parsedRuntimeArgs;
    const positionalArgs = cmd.state.parsedRuntimeArgs.get("_", []) as string[];
    debug("positional args:", positionalArgs);
    const arg0 = positionalArgs[0] as string | undefined;
    const preProcessors = cmd.state.preProcessors;
    const shouldRunSubCommand = !!arg0 && cmd.state.subCommands.has(arg0);
    const helpRequested = arg0 === "help" || parsedArgs.get("help", false);

    // Default subcommands:
    // help: Show help text if requested.
    if (!shouldRunSubCommand && helpRequested) {
      cmd.showHelp();
      return Promise.resolve(ReturnValue.SUCCESS);
    }

    // completion: Show help text if requested.
    if (arg0 === "completion") {
      console.log(bashCompletion(cmd));
      return Promise.resolve(ReturnValue.SUCCESS);
    }

    if (arg0 === "get-completions") {
      console.log(getCompletions(cmd));
      return Promise.resolve(ReturnValue.SUCCESS);
    }

    if (!shouldRunSubCommand && helpRequested) {
      cmd.showHelp();
      return Promise.resolve(ReturnValue.SUCCESS);
    }

    // Allow optional preprocessors to modify run-time state.
    // TODO: allow async preprocessors.
    const commandState = makeCommandState(cmd.state);
    const processedState = preProcessors.reduce(
      (p, c) => c(commandState, p) || p,
      state,
    );

    const runtimeState = processedState.set(
      "root",
      processedState.get("root", cmd),
    );

    // If a subCommand exists with name as the first argument, recurse into it.
    if (shouldRunSubCommand) {
      // We know arg0 is defined because is checked
      const subCommand = withState({
        ...cmd.state.subCommands.get(arg0!)!.state,
        parentOptions: cmd.state.options.merge(cmd.state.parentOptions),
        parentArguments: cmd.state.arguments.merge(cmd.state.parentArguments),
      });
      const subArgs = parsedArgs.get("_", []) as string[];
      return subCommand
        .withRuntimeArgs(
          cmd.state.runtimeArgs.toArray(),
          parsedArgs.set("_", subArgs.slice(1)),
        )
        .run(runtimeState);
    }

    if (!cmd.state.handler) {
      console.warn(
        colors.yellow(`No handler defined for command ${cmd.state.name}`),
      );
      cmd.showHelp();
      return Promise.resolve(ReturnValue.FAILURE);
    }
    // Handle the current command.
    return Promise.resolve(
      cmd.state.handler(makeCommandState(cmd.state), runtimeState),
    ).then(retval => retval || ReturnValue.SUCCESS);
  }

  return Object.freeze(cmd);
}
