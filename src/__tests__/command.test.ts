import { command, ReturnValue } from '../index';

describe('Command', () => {
  test('can create a command with a name', () => {
    expect(() => command('testCmd')).not.toThrowError();
    expect(
      command('testCmd').run(),
    ).resolves.toBe(ReturnValue.SUCCESS);
  });
});
