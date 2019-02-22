import {
  command,
  flag,
  stringOption,
  numericOption,
  multiStringOption,
} from "../index";

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
});

describe("flags", () => {
  test("can add a flag", done => {
    command("test")
      .withOption(flag("flag", "f"))
      .withHandler(cmd => {
        expect(cmd.getFlag("flag")).toEqual(false);
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can set a short flag by command line", done => {
    command("test")
      .withOption(flag("flag", "f"))
      .withHandler(cmd => {
        expect(cmd.getFlag("flag")).toEqual(true);
        done();
      })
      .withRuntimeArgs(["-f"])
      .run();
  });

  test("can set a long flag by command line", done => {
    command("test")
      .withOption(flag("flag", "f"))
      .withHandler(cmd => {
        expect(cmd.getFlag("flag")).toEqual(true);
        done();
      })
      .withRuntimeArgs(["--flag"])
      .run();
  });

  test("can set flags for sub commands", done => {
    command("test")
      .withOption(flag("flag", "f"))
      .withSubCommand(
        command("sub")
          .withOption(flag("sub-flag", "g"))
          .withHandler(cmd => {
            expect(cmd.getFlag("flag")).toEqual(true);
            expect(cmd.getFlag("sub-flag")).toEqual(true);
            done();
          }),
      )
      .withRuntimeArgs(["sub", "--flag", "-g"])
      .run();
  });
});

describe("stringOption", () => {
  test("can add a string option", done => {
    command("test")
      .withOption(stringOption("opt", "o"))
      .withHandler(cmd => {
        expect(cmd.getStringOption("opt")).toEqual(undefined);
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can add a string option with a default value", done => {
    command("test")
      .withOption(stringOption("opt", "o", "description", "defVal"))
      .withHandler(cmd => {
        expect(cmd.getStringOption("opt")).toEqual("defVal");
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can set a short option by command line", done => {
    command("test")
      .withOption(stringOption("opt", "o", "description", "defVal"))
      .withHandler(cmd => {
        expect(cmd.getStringOption("opt")).toEqual("custom");
        done();
      })
      .withRuntimeArgs(["-o", "custom"])
      .run();
  });

  test("can set a long option by command line", done => {
    command("test")
      .withOption(stringOption("opt", "o", "description", "defVal"))
      .withHandler(cmd => {
        expect(cmd.getStringOption("opt")).toEqual("custom2");
        done();
      })
      .withRuntimeArgs(["--opt", "custom2"])
      .run();
  });

  test("can set options for sub commands", done => {
    command("test")
      .withOption(stringOption("opt", "o", "description", "defVal"))
      .withSubCommand(
        command("sub")
          .withOption(stringOption("sub-opt", "s", "description", "defVal2"))
          .withHandler(cmd => {
            expect(cmd.getStringOption("opt")).toEqual("optVal");
            expect(cmd.getStringOption("sub-opt")).toEqual("subVal");
            done();
          }),
      )
      .withRuntimeArgs(["sub", "--opt=optVal", "-s", "subVal"])
      .run();
  });
});

describe("numericOption", () => {
  test("can add an option", done => {
    command("test")
      .withOption(numericOption("opt", "o"))
      .withHandler(cmd => {
        expect(cmd.getNumericOption("opt")).toEqual(undefined);
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can add an option with a default value", done => {
    command("test")
      .withOption(numericOption("opt", "o", "description", 42))
      .withHandler(cmd => {
        expect(cmd.getNumericOption("opt")).toEqual(42);
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can set a short option by command line", done => {
    command("test")
      .withOption(numericOption("opt", "o", "description", 42))
      .withHandler(cmd => {
        expect(cmd.getNumericOption("opt")).toEqual(64);
        done();
      })
      .withRuntimeArgs(["-o", "64"])
      .run();
  });

  test("can set a long option by command line", done => {
    command("test")
      .withOption(numericOption("opt", "o", "description", 42))
      .withHandler(cmd => {
        expect(cmd.getNumericOption("opt")).toEqual(24);
        done();
      })
      .withRuntimeArgs(["--opt", "24"])
      .run();
  });

  test("can set options for sub commands", done => {
    command("test")
      .withOption(numericOption("opt", "o", "description", 42))
      .withSubCommand(
        command("sub")
          .withOption(numericOption("sub-opt", "s", "description", 24))
          .withHandler(cmd => {
            expect(cmd.getNumericOption("opt")).toEqual(66);
            expect(cmd.getNumericOption("sub-opt")).toEqual(77);
            done();
          }),
      )
      .withRuntimeArgs(["sub", "--opt=66", "-s", "77"])
      .run();
  });
});

describe("multiStringOption", () => {
  test("can add an option", done => {
    command("test")
      .withOption(multiStringOption("opt", "o"))
      .withHandler(cmd => {
        expect(cmd.getMultiStringOption("opt")).toEqual([]);
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can add an option with a default value", done => {
    command("test")
      .withOption(multiStringOption("opt", "o", "description", ["val1"]))
      .withHandler(cmd => {
        expect(cmd.getMultiStringOption("opt")).toEqual(["val1"]);
        done();
      })
      .withRuntimeArgs([])
      .run();
  });

  test("can set a short option by command line", done => {
    command("test")
      .withOption(multiStringOption("opt", "o", "description", ["val1"]))
      .withHandler(cmd => {
        expect(cmd.getMultiStringOption("opt")).toEqual(["val2"]);
        done();
      })
      .withRuntimeArgs(["-o", "val2"])
      .run();
  });

  test("can set a long option by command line", done => {
    command("test")
      .withOption(multiStringOption("opt", "o", "description"))
      .withHandler(cmd => {
        expect(cmd.getMultiStringOption("opt")).toEqual(["val3"]);
        done();
      })
      .withRuntimeArgs(["--opt", "val3"])
      .run();
  });

  test("can set options for sub commands", done => {
    command("test")
      .withOption(multiStringOption("opt", "o"))
      .withSubCommand(
        command("sub")
          .withOption(multiStringOption("sub-opt", "s"))
          .withHandler(cmd => {
            expect(cmd.getMultiStringOption("opt")).toEqual([
              "val1",
              "val2",
              "val3",
            ]);
            expect(cmd.getMultiStringOption("sub-opt")).toEqual([
              "val4",
              "val5",
              "val6",
            ]);
            done();
          }),
      )
      .withRuntimeArgs([
        "sub",
        "--opt=val1",
        "--opt=val2",
        "--opt=val3",
        "-s",
        "val4",
        "-s",
        "val5",
        "-s",
        "val6",
      ])
      .run();
  });
  test("can't add option after runtime arguments are passed", () => {
    const c = command("test")
      .withOption(multiStringOption("opt", "o"))
      .withRuntimeArgs();
    expect(() => c.withOption(multiStringOption("opt2", "p"))).toThrowError();
  });
});
