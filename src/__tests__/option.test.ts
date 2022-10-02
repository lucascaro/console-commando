import {
  stringOption,
  command,
  numericOption,
  multiStringOption,
  flag,
  Command,
  ReturnValue,
} from "../index";
import { mockStdout, mockStderr } from "./mockstdio";
import { CommandState } from "../CommandState";

describe("option", () => {
  test("can create a option object with minimal parameters", () => {
    const o = stringOption("long-name");
    expect(o.name).toEqual("long-name");
    expect(o.long).toEqual("long-name");
    expect(o.short).toBeUndefined();
    expect(o.multiple).toEqual(false);
  });
  test("can create a option object with full parameters", () => {
    const o = stringOption(
      "long-name",
      "l",
      "a description",
      "a default",
      true,
    );
    expect(o.name).toEqual("long-name");
    expect(o.long).toEqual("long-name");
    expect(o.short).toEqual("l");
    expect(o.description).toEqual("a description");
    expect(o.default).toEqual("a default");
    expect(o.required).toEqual(true);
    expect(o.multiple).toEqual(false);
  });

  test("can add options to a command", done => {
    command("test")
      .withOption(stringOption("opt1"))
      .withOption(numericOption("opt2"))
      .withOption(multiStringOption("opt3"))
      .withHandler((cmd: CommandState) => {
        const opt1 = cmd.getStringOption("opt1");
        const opt2 = cmd.getNumericOption("opt2");
        const opt3 = cmd.getMultiStringOption("opt3");
        expect(opt1).toEqual("value1");
        expect(opt2).toEqual(2);
        expect(opt3).toEqual(["o31", "o32"]);
        done();
      })
      .withRuntimeArgs([
        "--opt1",
        "value1",
        "--opt2=2",
        "--opt3=o31",
        "--opt3=o32",
      ])
      .run();
  });

  test("can add short options to a command", done => {
    command("test")
      .withOption(stringOption("opt1", "o"))
      .withOption(numericOption("opt2", "p"))
      .withOption(multiStringOption("opt3", "q"))
      .withHandler((cmd: CommandState) => {
        const opt1 = cmd.getStringOption("opt1");
        const opt2 = cmd.getNumericOption("opt2");
        const opt3 = cmd.getMultiStringOption("opt3");
        expect(opt1).toEqual("value1");
        expect(opt2).toEqual(2);
        expect(opt3).toEqual(["o31", "o32"]);
        done();
      })
      .withRuntimeArgs(["-o", "value1", "-p=2", "-q=o31", "-q=o32"])
      .run();
  });

  test("can have required options", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("test");
    });
    // Silence expected faulure output
    const consoleLog = jest
      .spyOn(console, "log")
      .mockImplementation(() => null);
    const consoleErr = jest
      .spyOn(console, "error")
      .mockImplementation(() => null);
    expect(() => {
      command("test")
        .withOption(stringOption("opt1", "o", "", undefined, true))
        .withHandler(() => void 0)
        .withRuntimeArgs([""])
        .run();
    }).toThrow();
    consoleLog.mockRestore();
    consoleErr.mockRestore();
    expect(mockExit).toBeCalledWith(ReturnValue.FAILURE);
    mockExit.mockRestore();
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
});
