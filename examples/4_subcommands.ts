import path from "path";
import { command, flag, CommandState } from "..";
import { RuntimeState } from "../src";

function subHandler(state: CommandState, context: RuntimeState): void {
  console.log("%s was executed.", state.get("name"));
  console.log("global flag from context: %s", context.get("force"));
}

/**
 * Subcommands example
 */
command(path.basename(__filename))
  .withVersion("1.0.0-subcommands-example")
  .withDescription("This is a command with sub commands.")
  .withOption(flag("force", "f"))
  .withPreProcessor((state, context) => {
    // This code will be executed before all actions. You can use this
    // to set runtime context for your command and subcommands.
    return context.set("force", state.getFlag("force"));
  })
  // No handler in the main command will display the help text by default.
  .withSubCommand(command("sub1").withHandler(subHandler))
  .withSubCommand(command("sub2").withHandler(subHandler))
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
