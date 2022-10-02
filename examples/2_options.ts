import path from "path";
import {
  command,
  flag,
  multiStringOption,
  numericOption,
  stringOption,
} from "..";

/**
 * Options command example
 */
command(path.basename(__filename))
  .withVersion("1.0.0-options-example")
  .withDescription("This command has an action and options.")
  .withOption(flag("flag", "f", "add simple flags"))
  .withOption(stringOption("string", "s", "string options"))
  .withOption(numericOption("number", "n", "numeric options"))
  .withOption(stringOption("required", "r", "or required options"))
  .withOption(
    multiStringOption(
      "multi",
      "m",
      "multi options can be specified more than once",
    ),
  )
  .withOption(
    stringOption(
      "default",
      "d",
      "arguments can have default values",
      "my default",
    ),
  )
  .withHandler(state => {
    console.log(
      "The command was executed. Try %s help for help.",
      state.get("name"),
    );

    if (state.getFlag("flag")) {
      console.log('Flag "f" was set');
    }
    if (state.getStringOption("string")) {
      // works with either -s or --string
      console.log("Option string has value:", state.getStringOption("string"));
    }
    if (state.getNumericOption("number")) {
      console.log(
        "Numeric option was specified with value %d",
        state.getNumericOption("number"),
      );
    }
    if (state.getStringOption("required")) {
      // The value for this one will always be set by the user.
      console.log(
        "Option required was selected with value %s",
        state.getStringOption("required"),
      );
    }
    if (state.getMultiStringOption("multi")) {
      // The value for multi strings are always a string[].
      console.log(
        "Option required was selected with value %s",
        state.getMultiStringOption("multi"),
      );
    }
    console.log("default value:", state.getStringOption("default"));
  })
  .withRuntimeArgs(/* defaults to process.argv.slice(2) */)
  .run();
