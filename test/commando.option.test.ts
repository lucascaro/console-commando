import 'mocha';

import Commando from '../src/Commando';
import expectJs from 'expect.js';
import sinon from 'sinon';

const expect = expectJs;

/** @test {Option} */
describe('Option', () => {
  /** @test {Option#parseOptString} */
  describe('#parseOptString()', () => {
    const option = new Commando.Option();
    it('Parses short options', () => {
      const e = {
        short: 'x',
      };
      expect(option.parseOptstring('-x')).to.eql(e);
    });

    it('Parses long options', () => {
      const e = {
        long: 'extreme',
      };
      expect(option.parseOptstring('--extreme')).to.eql(e);
    });

    it('Parses short and long options', () => {
      const e = {
        short: 't',
        long: 'was-tested',
      };
      expect(option.parseOptstring('-t --was-tested')).to.eql(e);
    });

    it('Parses short optional arguments', () => {
      const e = {
        short: '2',
        arg: 'was-tested',
        required: false,
      };
      expect(option.parseOptstring('-2 [was-tested]')).to.eql(e);
    });

    it('Parses short required arguments', () => {
      const e = {
        short: 't',
        arg: 'tested',
        required: true,
      };
      expect(option.parseOptstring('-t <tested>')).to.eql(e);
    });

    it('Parses long optional arguments', () => {
      const e = {
        long: 'tested',
        arg: 'was-tested',
        required: false,
      };
      expect(option.parseOptstring('--tested [was-tested]')).to.eql(e);
    });

    it('Parses long required arguments', () => {
      const e = {
        long: 'tested',
        arg: 'was-tested',
        required: true,
      };
      expect(option.parseOptstring('--tested <was-tested>')).to.eql(e);
    });

    it('Parses short and long with optional arguments', () => {
      const e = {
        short: '0',
        long: 'my_string',
        arg: 'was_tested',
        required: false,
      };
      expect(option.parseOptstring('-0 --my_string [was_tested]')).to.eql(e);
      expect(option.parseOptstring('--my_string -0 [was_tested]')).to.eql(e);
      expect(option.parseOptstring('--my_string [was_tested] -0')).to.eql(e);
      expect(option.parseOptstring('[was_tested] -0 --my_string')).to.eql(e);
    });

    it('Parses short and long with required arguments', () => {
      const e = {
        short: 'a',
        long: 'is-a',
        arg: 'option',
        required: true,
      };
      expect(option.parseOptstring('-a --is-a <option>')).to.eql(e);
    });

    it('fails on duplicated values', () => {
      // bind function to the object to allow calling within expect.
      const e = expect(option.parseOptstring.bind(option));

      e.withArgs('-s -s').to.throwException();
      e.withArgs('--ss --ss').to.throwException();
      e.withArgs('-s --ss -s').to.throwException();
      e.withArgs('-s --ss').to.not.throwException();
      e.withArgs('-s --ss [abc] [abc]').to.throwException();
      e.withArgs('-s --ss [abc] <abc>').to.throwException();
      e.withArgs('[abc] <abc>').to.throwException();
      e.withArgs('[abc]').to.throwException();
      e.withArgs('<abc>').to.throwException();
    });
  });

  /** @test {Option#constructor} */
  describe('#constructor()', () => {
    it('creates short flags', () => {
      const o = new Commando.Option('-o', 'an option', false);

      expect(o).to.be.ok();
      expect(o.get('short')).to.be('o');
      expect(o.get('long')).to.be(undefined);
      expect(o.get('arg')).to.be(undefined);
      expect(o.get('default')).to.be(false);
      expect(o.get('required')).to.be(false);
    });

    it('creates long flags', () => {
      const o = new Commando.Option('--opt', 'an option', true);

      expect(o).to.be.ok();
      expect(o.get('short')).to.be(undefined);
      expect(o.get('long')).to.be('opt');
      expect(o.get('arg')).to.be(undefined);
      expect(o.get('default')).to.be(true);
      expect(o.get('required')).to.be(false);
    });

    it('creates options with optional values', () => {
      const o = new Commando.Option('-o --option [opt]', 'an option', 'default');

      expect(o).to.be.ok();
      expect(o.get('short')).to.be('o');
      expect(o.get('long')).to.be('option');
      expect(o.get('arg')).to.be('opt');
      expect(o.get('default')).to.be('default');
      expect(o.get('required')).to.be(false);
    });

    it('creates options with required values', () => {
      const o = new Commando.Option('-o --option <opt>');
      expect(o).to.be.ok();
      expect(o.get('short')).to.be('o');
      expect(o.get('long')).to.be('option');
      expect(o.get('arg')).to.be('opt');
      expect(o.get('default')).to.be(undefined);
      expect(o.get('required')).to.be(true);
    });
  });
});

/** @test {Option} */
describe('Argument Parsing', () => {
  const commandSpyAction = sinon.spy();
  function expectCallToSetValue(
    commando: Commando,
    args: string[],
    value?: any,
    argNames?: string | string[],
  ) {
    const spyAction = commando.get('action');
    spyAction.reset();
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
    expect(spyAction.calledOnce).to.be(true);
    const call = spyAction.getCall(0);
    const invokedCommand = call.args[0];
    const invokedRootCommand = call.args[0];
    expect(invokedCommand).to.be(thisCommand);
    expect(invokedRootCommand).to.be(rootCommand);
    finalArgNames.forEach((argName) => {
      expect(invokedCommand.getOption(argName)).to.be(value);
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
    const subSpyAction = sinon.spy();
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
      expect(commando.args(['-r a']).run()).to.be.ok();
      expect(commando.args(['-required b']).run()).to.be.ok();
    });
  });

  describe('Action arguments', () => {
    const spyAction = sinon.spy();
    const spySubAction = sinon.spy();
    const subCommand = new Commando('subCommand').action(spySubAction);
    const rootCommand = new Commando('rootCommand')
      .version('1.0.0')
      .action(spyAction)
      .command(subCommand);

    it('passes the root command to the root action', () => {
      rootCommand.run();
      expect(spyAction.calledOnce).to.be(true);
      const args = spyAction.getCall(0).args;
      expect(args[0]).to.be(rootCommand);
    });
    it('passes the sub command to the sub action', () => {
      const rootWithArgs = rootCommand.args(['subCommand']);
      const subWithArgs = rootWithArgs.getCommand('subCommand');
      rootWithArgs.run();
      expect(spySubAction.calledOnce).to.be(true);
      const args = spySubAction.getCall(0).args;
      expect(args[0]).to.be(subWithArgs);
      expect(args[1]).to.be(rootWithArgs);
    });
  });
});
