import path from "path";
import { command, Command, flag } from "..";
import { RuntimeState } from "../src";

function subHandler(command: Command, context: RuntimeState): void {
  console.log(
    "%s in %s was executed.",
    command.state.name,
    path.basename(__filename),
  );
  console.log("global flag from context: %s", context.get("force"));
  console.log("try adding --help");
}

/**
 * Subcommand recursion example
 */
command(path.basename(__filename))
  .withVersion("1.0.0-recursion-example")
  .withDescription("This is a command with multiple levels of sub commands.")
  .withOption(flag("force", "f"))
  .withPreProcessor((command, context) => {
    // This code will be executed before all actions. You can use this
    // to set runtime context for your command and subcommands.
    return context.set("force", command.getFlag("force"));
  })
  // No handler in the main command will display the help text by default.
  .withSubCommand(
    command("sub1")
      .withOption(flag("sub-1"))
      .withHandler(subHandler)
      .withSubCommand(
        command("sub2")
          .withOption(flag("sub-2"))
          .withHandler(subHandler)
          .withSubCommand(
            command("sub3")
              .withOption(flag("sub-3"))
              .withHandler(subHandler)
              .withSubCommand(
                command("sub4")
                  .withOption(flag("sub-4"))
                  .withHandler(subHandler),
              ),
          ),
      ),
  )
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
