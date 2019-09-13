import { command, multiStringArg } from "../index";

describe("command", () => {
  test("can create a command with a name", () => {
    expect(command("testCmd").state.name).toEqual("testCmd");
  });

  test("can add version and description", () => {
    const cmd = command("testCmd")
      .withVersion("arbitrary string")
      .withDescription("any string");

    expect(cmd).toBeDefined();
    expect(cmd.state.version).toEqual("arbitrary string");
    expect(cmd.state.description).toEqual("any string");
  });

  test("can add default handler", () => {
    const handler = jest.fn();
    const cmd = command("testCmd").withHandler(handler);

    expect(cmd).toBeDefined();
    expect(() => cmd.run()).not.toThrowError();
    expect(handler).toBeCalledTimes(1);
  });

  test("can add pre-processor", () => {
    const handler = jest.fn();
    const prepro = jest.fn();
    const cmd = command("testCmd")
      .withPreProcessor(prepro)
      .withHandler(handler);

    expect(cmd).toBeDefined();
    expect(() => cmd.run()).not.toThrowError();
    expect(handler).toBeCalledTimes(1);
    expect(prepro).toBeCalledTimes(1);
  });
});

describe("sub command", () => {
  test("can add subcommands", () => {
    const cmdHandler = jest.fn();
    const subCmdHandler = jest.fn();
    const subCmdHandler2 = jest.fn();
    const cmdPre = jest.fn();
    const subCmdPre = jest.fn();
    const subCmdPre2 = jest.fn();
    const cmd = command("test1")
      .withHandler(cmdHandler)
      .withPreProcessor(cmdPre)
      .withSubCommand(
        command("sub1")
          .withHandler(subCmdHandler)
          .withPreProcessor(subCmdPre),
      )
      .withSubCommand(
        command("sub2")
          .withHandler(subCmdHandler2)
          .withPreProcessor(subCmdPre2),
      );

    cmd.run();
    expect(cmdHandler).toBeCalledTimes(1);
    expect(cmdPre).toBeCalledTimes(1);
    expect(subCmdHandler).toBeCalledTimes(0);
    expect(subCmdPre).toBeCalledTimes(0);
    expect(subCmdHandler2).toBeCalledTimes(0);
    expect(subCmdPre2).toBeCalledTimes(0);

    cmd.withRuntimeArgs(["sub1"]).run();
    expect(cmdHandler).toBeCalledTimes(1);
    expect(cmdPre).toBeCalledTimes(2);
    expect(subCmdHandler).toBeCalledTimes(1);
    expect(subCmdPre).toBeCalledTimes(1);
    expect(subCmdHandler2).toBeCalledTimes(0);
    expect(subCmdPre2).toBeCalledTimes(0);
  });

  test("cannot add sub command with positional arguments", () => {
    expect(() => {
      command("test")
        .withArgument(multiStringArg("arg1"))
        .withSubCommand(command("test2"));
    }).toThrow();
  });
});
