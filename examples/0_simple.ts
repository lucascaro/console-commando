import path from "path";
import { command } from "..";

/**
 * Simple command example
 */
command(path.basename(__filename))
  .withVersion("1.0.0-simple-example")
  .withDescription(
    "This is a simple command with no arguments. This command does nothing.",
  )
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
