import * as path from "path";
import { command } from "..";

/**
 * Handler example
 */
command(path.basename(__filename))
  .withVersion("1.0.0-handler-example")
  .withDescription(
    "This is a simple command with no arguments. This command has an action that prints text.",
  )
  .withHandler(cmd => {
    console.log(
      "The command was executed. Try %s help for help.",
      cmd.state.name,
    );
  })
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
