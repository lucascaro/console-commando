import { command, RuntimeState } from "../index";
import { CommandState } from "../CommandState";

describe("preProcessor", () => {
  test("can add a pre processor to a CommandState", done => {
    const prepro1 = jest.fn((c: CommandState, s: RuntimeState) =>
      s.set("p", 1),
    );
    command("test")
      .withHandler((cmd: CommandState, s: RuntimeState) => {
        expect(s.get("p")).toEqual(1);
        done();
      })
      .withPreProcessor(prepro1)
      .withRuntimeArgs([])
      .run();
    expect(prepro1).toBeCalledTimes(1);
  });

  test("can add multiple pre processors to a Command", done => {
    const prepro1 = jest.fn((c: CommandState, s: RuntimeState) =>
      s.set("p", 1),
    );
    const prepro2 = jest.fn((c: CommandState, s: RuntimeState) => {
      const current = s.get("p");
      return s.set("p", typeof current === "number" ? current + 1 : -1);
    });
    command("test")
      .withHandler((cmd: CommandState, s: RuntimeState) => {
        expect(s.get("p")).toEqual(2);
        done();
      })
      .withPreProcessor(prepro1)
      .withPreProcessor(prepro2)
      .withRuntimeArgs([])
      .run();
    expect(prepro1).toBeCalledTimes(1);
    expect(prepro2).toBeCalledTimes(1);
  });
});
