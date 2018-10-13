
import Commando from '../Commando';

/** @test {Option} */
describe('Option', () => {
  /** @test {Option#parseOptString} */
  describe('#parseOptString()', () => {
    const option = new Commando.Option();
    it('Parses short options', () => {
      const e = {
        short: 'x',
      };
      expect(option.parseOptstring('-x')).toEqual(e);
    });

    it('Parses long options', () => {
      const e = {
        long: 'extreme',
      };
      expect(option.parseOptstring('--extreme')).toEqual(e);
    });

    it('Parses short and long options', () => {
      const e = {
        short: 't',
        long: 'was-tested',
      };
      expect(option.parseOptstring('-t --was-tested')).toEqual(e);
    });

    it('Parses short optional arguments', () => {
      const e = {
        short: '2',
        arg: 'was-tested',
        required: false,
      };
      expect(option.parseOptstring('-2 [was-tested]')).toEqual(e);
    });

    it('Parses short required arguments', () => {
      const e = {
        short: 't',
        arg: 'tested',
        required: true,
      };
      expect(option.parseOptstring('-t <tested>')).toEqual(e);
    });

    it('Parses long optional arguments', () => {
      const e = {
        long: 'tested',
        arg: 'was-tested',
        required: false,
      };
      expect(option.parseOptstring('--tested [was-tested]')).toEqual(e);
    });

    it('Parses long required arguments', () => {
      const e = {
        long: 'tested',
        arg: 'was-tested',
        required: true,
      };
      expect(option.parseOptstring('--tested <was-tested>')).toEqual(e);
    });

    it('Parses short and long with optional arguments', () => {
      const e = {
        short: '0',
        long: 'my_string',
        arg: 'was_tested',
        required: false,
      };
      expect(option.parseOptstring('-0 --my_string [was_tested]')).toEqual(e);
      expect(option.parseOptstring('--my_string -0 [was_tested]')).toEqual(e);
      expect(option.parseOptstring('--my_string [was_tested] -0')).toEqual(e);
      expect(option.parseOptstring('[was_tested] -0 --my_string')).toEqual(e);
    });

    it('Parses short and long with required arguments', () => {
      const e = {
        short: 'a',
        long: 'is-a',
        arg: 'option',
        required: true,
      };
      expect(option.parseOptstring('-a --is-a <option>')).toEqual(e);
    });

    it('fails on duplicated values', () => {
      // bind function to the object to allow calling within expect.
      const when = (arg: string) => expect(() => option.parseOptstring(arg));

      when('-s -s').toThrow();
      when('--ss --ss').toThrow();
      when('-s --ss -s').toThrow();
      when('-s --ss').not.toThrow();
      when('-s --ss [abc] [abc]').toThrow();
      when('-s --ss [abc] <abc>').toThrow();
      when('[abc] <abc>').toThrow();
      when('[abc]').toThrow();
      when('<abc>').toThrow();
    });
  });

  /** @test {Option#constructor} */
  describe('#constructor()', () => {
    it('creates short flags', () => {
      const o = new Commando.Option('-o', 'an option', false);

      expect(o).toBeTruthy();
      expect(o.get('short')).toBe('o');
      expect(o.get('long')).toBe(undefined);
      expect(o.get('arg')).toBe(undefined);
      expect(o.get('default')).toBe(false);
      expect(o.get('required')).toBe(false);
    });

    it('creates long flags', () => {
      const o = new Commando.Option('--opt', 'an option', true);

      expect(o).toBeTruthy();
      expect(o.get('short')).toBe(undefined);
      expect(o.get('long')).toBe('opt');
      expect(o.get('arg')).toBe(undefined);
      expect(o.get('default')).toBe(true);
      expect(o.get('required')).toBe(false);
    });

    it('creates options with optional values', () => {
      const o = new Commando.Option('-o --option [opt]', 'an option', 'default');

      expect(o).toBeTruthy();
      expect(o.get('short')).toBe('o');
      expect(o.get('long')).toBe('option');
      expect(o.get('arg')).toBe('opt');
      expect(o.get('default')).toBe('default');
      expect(o.get('required')).toBe(false);
    });

    it('creates options with required values', () => {
      const o = new Commando.Option('-o --option <opt>');
      expect(o).toBeTruthy();
      expect(o.get('short')).toBe('o');
      expect(o.get('long')).toBe('option');
      expect(o.get('arg')).toBe('opt');
      expect(o.get('default')).toBe(undefined);
      expect(o.get('required')).toBe(true);
    });
  });
});

/** @test {Option} */
describe('Argument Parsing', () => {
  const commandSpyAction = jest.fn();
  function expectCallToSetValue(
    commando: Commando,
    args: string[],
    value?: any,
    argNames?: string | string[],
  ) {
    const spyAction = commando.get('action') as jest.Mock;
    spyAction.mockClear();
    const thisCommand = commando.args(args);
    const rootCommand = thisCommand;
    let finalArgNames: string[];
    if (argNames === undefined) {
      finalArgNames = ['f', 'force'];
    } else if (typeof argNames === 'string') {
      finalArgNames = [argNames];
    } else {
      finalArgNames = argNames;
    }
    thisCommand.run();
    expect(spyAction).toBeCalledTimes(1);
    const call = spyAction.mock.calls[0];
    const invokedCommand = call[0];
    const invokedRootCommand = call[0];
    expect(invokedCommand).toBe(thisCommand);
    expect(invokedRootCommand).toBe(rootCommand);
    finalArgNames.forEach((argName) => {
      expect(invokedCommand.getOption(argName)).toBe(value);
    });
  }

  function expectCommandoCallsWithArgs(optString: string, argKeys: any) {
    const commando = new Commando('testRootCommand')
    .version('1.0.0')
    .option(optString, 'force it', false)
    .action(commandSpyAction);

    it('sees defaults', () => {
      expectCallToSetValue(commando, [], false, argKeys);
    });

    it('sees long flags', () => {
      expectCallToSetValue(commando, ['--force'], true, argKeys);
      expectCallToSetValue(commando, ['--forces'], false, argKeys);
      expectCallToSetValue(commando, ['--force'], undefined, ['w', 'wrong']);
    });

    it('sees long args', () => {
      expectCallToSetValue(commando, ['--force', 'myArg'], 'myArg', argKeys);
    });
  }

  describe('Short args', () => {
    const commando = new Commando('rootCmd')
    .version('1.0.0')
    .option('-f', 'force it', false)
    .action(commandSpyAction);

    it('sees defaults', () => {
      expectCallToSetValue(commando, [], false, 'f');
    });

    it('sees short flags', () => {
      expectCallToSetValue(commando, ['-f'], true, 'f');
      expectCallToSetValue(commando, ['-x'], false, 'f');
      expectCallToSetValue(commando, ['-f'], undefined, 'anotherArg');
    });

    it('sees short args', () => {
      expectCallToSetValue(commando, ['--f', 'myArg'], 'myArg', 'f');
    });
  });

  describe('Long args', () => {
    const argKeys = ['force'];
    expectCommandoCallsWithArgs('--force', argKeys);
  });

  describe('Combined args', () => {
    const argKeys = ['f', 'force'];
    expectCommandoCallsWithArgs('-f --force', argKeys);

  });

  describe('Named args', () => {
    const argKeys = ['f', 'force', 'forceValue'];
    expectCommandoCallsWithArgs('-f --force [forceValue]', argKeys);
  });

  describe('Subcommand args', () => {
    const subSpyAction = jest.fn();
    const subCommand = new Commando.Command('subCommand')
      .option('-s --sub [subOption]', 'sub option', 'sDefault')
      .action(subSpyAction);

    const commando = new Commando('rootCmd')
      .version('1.0.0')
      .option('-f --force', 'force it', false)
      .action(commandSpyAction)
      .command(subCommand);

    const fArgKeys = ['f', 'force'];
    const sArgKeys = ['s', 'sub', 'subOption'];
    it('sees defaults', () => {
      expectCallToSetValue(commando, [], false, fArgKeys);
      expectCallToSetValue(commando, [], undefined, sArgKeys);
      expectCallToSetValue(subCommand, [], 'sDefault', sArgKeys);
      expectCallToSetValue(subCommand, [], undefined, fArgKeys);
    });

    it('sees short flags', () => {
      expectCallToSetValue(commando, ['-f'], true, 'f');
      expectCallToSetValue(subCommand, ['-s'], true, 's');
    });

    it('sees short args', () => {
      expectCallToSetValue(commando, ['--f', 'myArg'], 'myArg', 'f');
      expectCallToSetValue(subCommand, ['--s', 'mySubArg'], 'mySubArg', 's');
    });
  });

  describe('Required arguments', () => {
    const commando = new Commando('rootCmd')
      .version('1.0.0')
      .option('-r --required <requiredArg>', 'a required argument', false)
      .action(commandSpyAction);

    it('validates required arguments', () => {
      // expect(commando.args(['-r']).run()).to.not.be.ok();
      // expect(commando.args(['--required']).run()).to.not.be.ok();
      expect(commando.args(['-r a']).run()).toBeTruthy();
      expect(commando.args(['-required b']).run()).toBeTruthy();
    });
  });

  describe('Action arguments', () => {
    const spyAction = jest.fn();
    const spySubAction = jest.fn();
    const subCommand = new Commando('subCommand').action(spySubAction);
    const rootCommand = new Commando('rootCommand')
      .version('1.0.0')
      .action(spyAction)
      .command(subCommand);

    it('passes the root command to the root action', () => {
      rootCommand.run();
      expect(spyAction).toBeCalledTimes(1);
      const args = spyAction.mock.calls[0];
      expect(args[0]).toBe(rootCommand);
    });
    it('passes the sub command to the sub action', () => {
      const rootWithArgs = rootCommand.args(['subCommand']);
      const subWithArgs = rootWithArgs.getCommand('subCommand');
      rootWithArgs.run();
      expect(spySubAction).toBeCalledTimes(1);
      const args = spySubAction.mock.calls[0];
      expect(args[0]).toBe(subWithArgs);
      expect(args[1]).toBe(rootWithArgs);
    });
  });
});
