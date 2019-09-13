import { command, Command, RuntimeState } from "../index";

describe("preProcessor", () => {
  test("can add a pre processor to a command", done => {
    const prepro1 = jest.fn((c: Command, s: RuntimeState) => s.set("p", 1));
    command("test")
      .withHandler((cmd: Command, s: RuntimeState) => {
        expect(s.get("p")).toEqual(1);
        done();
      })
      .withPreProcessor(prepro1)
      .withRuntimeArgs([])
      .run();
    expect(prepro1).toBeCalledTimes(1);
  });

  test("can add multiple pre processors to a command", done => {
    const prepro1 = jest.fn((c: Command, s: RuntimeState) => s.set("p", 1));
    const prepro2 = jest.fn((c: Command, s: RuntimeState) =>
      s.set("p", s.get("p") + 1),
    );
    command("test")
      .withHandler((cmd: Command, s: RuntimeState) => {
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
