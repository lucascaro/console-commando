import Command, { ReturnValue } from '../Command';

describe('Command', () => {
  test('can create a command with a name', () => {
    expect(() => Command.create('testCmd')).not.toThrowError();
    expect(
      Command.create('testCmd').run(),
    ).resolves.toBe(ReturnValue.SUCCESS);
  });
});
