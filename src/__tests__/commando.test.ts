import Commando from '../Commando';

// tslint:disable-next-line:variable-name
const Immutable = require('immutable');

const minimist = require('minimist');
const sinon = require('sinon');

/** @test {Commando} */
describe('Commando', () => {
  /** @test {Commando#constructor} */
  describe('#constructor()', () => {
    it('can be created with no config', () => {
      const commando = new Commando();
      expect(commando.config).toEqual(Commando.defaultConfig());
    });

    it('can be created with name', () => {
      const commando = new Commando('myname');
      expect(commando.config).not.toEqual(Commando.defaultConfig());
      expect(commando.get('name')).toBe('myname');
    });

    it('can be created with name config', () => {
      const commando = new Commando({ name: 'voldemort' });
      expect(commando.get('name')).toEqual('voldemort');
    });

    it('can be created with version config', () => {
      const commando = new Commando({ version: '1.1.1' });
      expect(commando.get('version')).toEqual('1.1.1');
    });

    it('has immutable version', () => {
      const commando = new Commando('testRootCommand');

      // Test default version
      const initialVersion = Commando.defaultConfig().get('version');
      expect(commando.get('version')).toBe(initialVersion);
      const commando2 = commando.version('1.0.1-test');

      expect(commando2.get('version')).toBe('1.0.1-test');
      expect(commando.get('version')).toBe(initialVersion);
      expect(Object.isFrozen(commando)).toBe(true);
    });
  });
  /** @test {Commando#command} */
  describe('#command()', () => {
    it('rejects unnamed commands', () => {
      const commando = new Commando('testRootCommand');
      const command = new Commando.Command();

      expect(() => commando.command(command)).toThrow();
    });

    it('can add a command', () => {
      const commando = new Commando('testRootCommand');
      const command = new Commando.Command({ name: 'cmd1' });

      const testCmd = commando.command(command).getCommand('cmd1');
      expect(testCmd).toEqual(command);

    });
  });

  /** @test {Commando#getCommand} */
  describe('#getCommand()', () => {
    it('gets the command', () => {
      const subCommand = new Commando.Command({ name: 'subc1' });
      const commando = new Commando({ name: 'base command' })
        .version('1.0.0')
        .command(subCommand);

      expect(commando.getCommand('subc1')).toBe(subCommand);
    });
  });

  /** @test {Commando#command} */
  describe('Multi command', () => {
    let commando = new Commando('testRootCommand');

    commando = commando.version('1.0.0');
    commando = commando.command(
        new Commando.Command({ name: 'job' })
        .option('-f --force', 'force it', false)
        .option('-x --expand', 'expand it', false)
        .command(
          new Commando.Command('list')
          .action((command: Commando) => {
            expect(command.get('name')).toBe('list');
          }),
        ),
      )
      .option('-a --another', 'add another', false);

    commando = commando.command(
          new Commando.Command({ name: 'schedule' })
          .option('-j --jobName', 'force it', false)
          .command(
            new Commando.Command({ name: 'list' }),
          ),
        )
        .option('-a --another', 'add another', false);
    commando.debug();

    it('should fail if invoked without command', () => {
      const res = commando.args([]).run();
      expect(res).toBeFalsy();
    });

    it('should fail if invoked without subcommand', () => {
      const res = commando.args(['job']).run();
      expect(res).toBeFalsy();
    });

    it('should run if invoked with subcommand', () => {
      const res = commando.args(['job', 'list']).run();
      expect(res).toBeTruthy();
    });

    commando.args(['schedule', 'list', '-f']).run();
    commando.args(['wat', 'list', '-f', 'thing']).run();
    commando.args(['job', 'wat', '-f', 'thing']).run();
  });

  /** @test {Commando#args} */
  describe('#args()', () => {
    const baseAction = sinon.spy();
    const subAction = sinon.spy();
    const subCommand = new Commando.Command({ name: 'subc1' })
    .action(subAction);
    const commando = new Commando({ name: 'base command' })
      .version('1.0.0')
      .action(baseAction)
      .command(subCommand);

    it('sees arguments', () => {
      const inputArgs = ['wat'];
      const args = minimist(inputArgs);
      const thisCommand = commando.args(inputArgs);
      const expectedArgs = new Immutable.fromJS(args);

      expect(thisCommand.get('args').equals(expectedArgs)).toBe(true);
    });
    it('passes args to subcommands', () => {
      const inputArgs = ['subc1', 'wat'];
      const args = minimist(inputArgs);
      const subArgs = minimist(['wat']);
      const thisCommand = commando.args(inputArgs);
      const thisSubCommand = thisCommand.getCommand('subc1') as Commando;
      const expectedArgs = new Immutable.fromJS(args);
      const expectedSubArgs = new Immutable.fromJS(subArgs);

      expect(thisCommand.get('args').equals(expectedArgs)).toBe(true);
      expect(thisSubCommand.get('args').equals(expectedSubArgs)).toBe(true);
    });

    it('ignores undefined options', () => {
      const inputArgs = ['--wat'];
      const thisCommand = commando.args(inputArgs);

      expect(thisCommand.getOption('wat')).toBe(undefined);
    });

    it('sees options', () => {
      const inputArgs = ['--wat'];
      const thisCommand = commando
        .option('-w --wat')
        .args(inputArgs);

      console.log('GETOPT', thisCommand.getOption('wat'));
      // TODO
      // expect(thisCommand.getOption('wat')).toBe(true);
    });
  });

  describe('#getOptionsHash', () => {
    it('returns empty object for no options', () => {
      function testAction(command: Commando) {
        expect(command.getOptionsHash()).toEqual({});
      }
      const spyTestAction = sinon.spy(testAction);
      new Commando({ name: 'base command' })
        .version('1.0.0')
        .action(spyTestAction)
        .run();
      expect(spyTestAction.calledOnce).toBe(true);
    });
    it('returns default options', () => {
      const defaultValue = 'defaultValue123';
      function testAction(command: Commando) {
        expect(command.getOptionsHash()).toEqual({
          a: defaultValue,
          'opt-a': defaultValue,
          optionA: defaultValue,
        });
      }
      const spyTestAction = sinon.spy(testAction);
      new Commando({ name: 'base command' })
        .version('1.0.0')
        .option('-a --opt-a [optionA]', 'option a', defaultValue)
        .action(spyTestAction)
        .run();
      expect(spyTestAction.calledOnce).toBe(true);
    });
    it('returns default and overriden options', () => {
      const defaultValue = 'defaultValue123';
      const passedValue = 'passedValue123';
      function testAction(command: Commando) {
        expect(command.getOptionsHash()).toEqual({
          a: defaultValue,
          'opt-a': defaultValue,
          optionA: defaultValue,
          b: passedValue,
          'opt-b': passedValue,
          optionB: passedValue,
        });
      }
      const spyTestAction = sinon.spy(testAction);
      new Commando({ name: 'base command' })
        .version('1.0.0')
        .option('-a --opt-a [optionA]', 'option a', defaultValue)
        .option('-b --opt-b [optionB]', 'option b', defaultValue)
        .action(spyTestAction)
        .args(['-b', passedValue])
        .run();
      expect(spyTestAction.calledOnce).toBe(true);
    });
  });
});

/** @test {Commando#action} */
describe('Action', () => {
  describe('simple command with one action', () => {
    const commando = new Commando('testRootCommand')
      .version('1.0.0');
    it('calls the action without calling args', () => {
      const spyAction = sinon.spy();
      commando.action(spyAction).run();
      expect(spyAction.calledOnce).toBe(true);
    });
    it('calls the action with null args', () => {
      const spyAction = sinon.spy();
      commando.action(spyAction).args().run();
      expect(spyAction.calledOnce).toBe(true);
    });
    it('calls the action with empty args', () => {
      const spyAction = sinon.spy();
      commando.action(spyAction).args([]).run();
      expect(spyAction.calledOnce).toBe(true);
    });
    it('calls the action with one argument', () => {
      const spyAction = sinon.spy();
      const inputArgs = ['arg1'];
      const args = minimist(inputArgs);
      const expectedArgs = new Immutable.fromJS(args);
      const thisCommand = commando
      .action((command: Commando) => {
        spyAction();
        const args = command.get('args');
        const rootArgs = command.get('rootArgs');
        expect(command).toBe(thisCommand);
        expect(expectedArgs.equals(args)).toBeTruthy();
        expect(args.get('_').toArray()).toEqual(inputArgs);
        expect(rootArgs.get('_').toArray()).toEqual(inputArgs);
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).toBe(true);
    });
    it('calls the action with one short option', () => {
      const spyAction = sinon.spy();
      const inputArgs = ['-f'];
      const args = minimist(inputArgs);
      const expectedArgs = new Immutable.fromJS(args);
      const thisCommand = commando
      .action((command: Commando) => {
        const args = command.get('args');
        const rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).toBe(thisCommand);
        expect(expectedArgs.equals(args)).toBe(true);
        expect(args.get('_').toArray()).toEqual([]);
        expect(rootArgs.get('_').toArray()).toEqual([]);
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).toBe(true);
    });
    it('calls the action with one long option', () => {
      const spyAction = sinon.spy();
      const inputArgs = ['--test-pass'];
      const args = minimist(inputArgs);
      const expectedArgs = new Immutable.fromJS(args);
      const thisCommand = commando
      .action((command: Commando) => {
        const cmdArgs = command.get('args');
        const rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).toBe(thisCommand);
        expect(cmdArgs).toBe(rootArgs);
        expect(expectedArgs.equals(cmdArgs)).toBe(true);
        expect(cmdArgs.get('_').toArray()).toEqual([]);
        expect(rootArgs.get('_').toArray()).toEqual([]);
        expect(cmdArgs.get('test-pass')).toBeTruthy();
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).toBe(true);
    });
    it('calls the action with many options', () => {
      const spyAction = sinon.spy();
      const inputArgs = [
        'cmd',
        'subc',
        '-f',
        '--test-pass',
        'tp1',
        'arg1',
      ];
      const args = minimist(inputArgs);
      const expectedArgs = new Immutable.fromJS(args);
      const expectPositional = ['cmd', 'subc', 'arg1'];
      const thisCommand = commando
      .action((command: Commando) => {
        const cmdArgs = command.get('args');
        const rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).toBe(thisCommand);
        expect(cmdArgs).toBe(rootArgs);
        expect(expectedArgs.equals(cmdArgs)).toBe(true);
        expect(cmdArgs.get('_').toArray()).toEqual(expectPositional);
        expect(rootArgs.get('_').toArray()).toEqual(expectPositional);
        expect(cmdArgs.get('test-pass')).toBeTruthy();
        expect(cmdArgs.get('f')).toBeTruthy();
        expect(cmdArgs.get('cmd')).toBe(undefined);
        expect(cmdArgs.get('subc')).toBe(undefined);
        expect(cmdArgs.get('arg1')).toBe(undefined);
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).toBe(true);
    });
  });
  describe('Subcommand', () => {
    const defaultAction = sinon.spy();
    const subcAction = sinon.spy();
    const subCommand = new Commando.Command({ name: 'subc1' })
    .action(subcAction);

    const commando = new Commando('testRootCommand')
      .version('1.0.0')
      .action(defaultAction)
      .command(subCommand);

    it('calls command action if no subcommand given', () => {
      defaultAction.resetHistory();
      commando.run();
      expect(defaultAction.calledOnce).toBe(true);
    });

    it('calls command action if unknown subcommand given', () => {
      defaultAction.resetHistory();
      const thisCommand = commando.args(['wat']);
      thisCommand.run();
      expect(defaultAction.calledOnce).toBe(true);
      expect(defaultAction.calledWith(thisCommand)).toBe(true);
    });

    it('calls sub command action if subcommand given', () => {
      defaultAction.resetHistory();
      subcAction.resetHistory();
      const thisCommand = commando.args(['subc1']);
      const thisSubCommand = thisCommand.get('commands').get('subc1');
      thisCommand.run();

      expect(defaultAction.called).toBe(false);
      expect(subcAction.calledOnce).toBe(true);
      expect(thisSubCommand.get('name')).toBe('subc1');
      expect(subcAction.args).not.toHaveLength(0);
      expect(subcAction.args[0][0]).toBe(thisSubCommand);
      expect(subcAction.calledWith(thisCommand)).toBe(false);
    });
  });
});
