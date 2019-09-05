import { stringArg, command, multiStringArg } from "../index";
import { Command } from "../Command";

describe("arguments", () => {
  test("can create a option object with minimal parameters", () => {
    const o = stringArg("long-name");
    expect(o.name).toEqual("long-name");
    expect(o.multiple).toEqual(false);
    expect(o.default).toBeUndefined();
    expect(o.description).toBeUndefined();
  });
  test("can create a option object with full parameters", () => {
    const o = stringArg("long-name", "a description", "a default", true);
    expect(o.name).toEqual("long-name");
    expect(o.description).toEqual("a description");
    expect(o.default).toEqual("a default");
    expect(o.required).toEqual(true);
    expect(o.multiple).toEqual(false);
  });

  test("can add an argument to a command", done => {
    command("test")
      .withArgument(stringArg("arg1"))
      .withHandler((cmd: Command) => {
        const arg1 = cmd.getStringArg("arg1");
        expect(arg1).toEqual("value1");
        done();
      })
      .withRuntimeArgs(["value1"])
      .run();
  });

  test("can add multiple arguments to a command", done => {
    command("test")
      .withArgument(stringArg("arg1"))
      .withArgument(stringArg("arg2"))
      .withArgument(stringArg("arg3"))
      .withHandler((cmd: Command) => {
        const arg1 = cmd.getStringArg("arg1");
        const arg2 = cmd.getStringArg("arg2");
        const arg3 = cmd.getStringArg("arg3");
        expect(arg1).toEqual("value1");
        expect(arg2).toEqual("value2");
        expect(arg3).toEqual("value3");
        done();
      })
      .withRuntimeArgs(["value1", "value2", "value3"])
      .run();
  });

  test("can add a single multi string arg to a command", done => {
    command("test")
      .withArgument(multiStringArg("arg1"))
      .withHandler((cmd: Command) => {
        const arg1 = cmd.getMultiStringArg("arg1");
        expect(arg1).toEqual(["value1", "value2", "value3"]);
        done();
      })
      .withRuntimeArgs(["value1", "value2", "value3"])
      .run();
  });

  test("cannot add args after multi string arg", () => {
    expect(() => {
      command("test")
        .withArgument(multiStringArg("arg1"))
        .withArgument(stringArg("arg2"));
    }).toThrow();
  });

  test("cannot add args with sub commands", () => {
    expect(() => {
      command("test")
        .withSubCommand(command("test2"))
        .withArgument(multiStringArg("arg1"))
        .withArgument(stringArg("arg2"));
    }).toThrow();
  });
});
