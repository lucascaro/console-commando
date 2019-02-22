import { stringOption } from "../index";

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
});
