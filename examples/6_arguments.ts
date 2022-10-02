import path from "path";
import { command, multiStringArg, numericArg, stringArg } from "..";

/**
 * Options command example
 */
command(path.basename(__filename))
  .withVersion("1.0.0-arguments-example")
  .withDescription("This command has an arguments and a handler.")
  .withArgument(stringArg("required", "or required options", undefined, true))
  .withArgument(stringArg("string", "string options"))
  .withArgument(numericArg("number", "numeric options"))
  .withArgument(
    stringArg("default", "arguments can have default values", "my default"),
  )
  .withArgument(
    multiStringArg("multi", "multi options can be specified more than once"),
  )
  .withHandler(state => {
    console.log(
      "The command was executed. Try %s help for help.",
      state.get("name"),
    );

    if (state.getStringArg("required")) {
      console.log(
        "Argument `required` was set to %s",
        state.getStringArg("required"),
      );
    }
    if (state.getStringArg("string")) {
      console.log(
        "Argument `string` was set to %s",
        state.getStringArg("string"),
      );
    }
    if (state.getNumericArg("number")) {
      console.log(
        "Argument `number` was set to %s",
        state.getNumericArg("number"),
      );
    }
    // Argument with default value will be always set.
    console.log(
      "Argument `default` was set to %s",
      state.getStringArg("default"),
    );
    // Multi valued arguments always return as arrays.
    console.log(
      "Argument `multi` was set to %j",
      state.getMultiStringArg("multi"),
    );
  })
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
