import {
  stringOption,
  command,
  numericOption,
  multiStringOption,
} from "../index";
import { Command, ReturnValue } from "../Command";

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
      .withHandler((cmd: Command) => {
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
      .withHandler((cmd: Command) => {
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
    expect(() => {
      command("test")
        .withOption(stringOption("opt1", "o", "", undefined, true))
        .withHandler((cmd: Command) => {})
        .withRuntimeArgs([""])
        .run();
    }).toThrow();
    expect(mockExit).toBeCalledWith(ReturnValue.FAILURE);
    mockExit.mockRestore();
  });
});
