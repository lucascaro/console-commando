'use strict';

var Commando = require('../lib/commando');
var Immutable = require('immutable');

var expect = require('expect.js');
var minimist = require('minimist');
var sinon = require('sinon');

/** @test {Commando} */
describe('Commando', function () {
  /** @test {Commando#constructor} */
  describe('#constructor()', function () {
    it('can be created with no config', function () {
      var commando = new Commando();
      expect(commando._config).to.eql(Commando.defaultConfig());
    });

    it('can be created with name', function () {
      var commando = new Commando('myname');
      expect(commando._config).not.to.eql(Commando.defaultConfig());
      expect(commando.get('name')).to.be('myname');
    });

    it('can be created with name config', function () {
      var commando = new Commando({ name: 'voldemort' });
      expect(commando.get('name')).to.eql('voldemort');
    });

    it('can be created with version config', function () {
      var commando = new Commando({ version: '1.1.1' });
      expect(commando.get('version')).to.eql('1.1.1');
    });

    it('has immutable version', function () {
      var commando = new Commando('testRootCommand');

      // Test default version
      var initialVersion = Commando.defaultConfig().get('version');
      expect(commando.get('version')).to.be(initialVersion);
      var commando2 = commando.version('1.0.1-test');

      expect(commando2.get('version')).to.be('1.0.1-test');
      expect(commando.get('version')).to.be(initialVersion);
      expect(Object.isFrozen(commando)).to.be(true);
    });
  });
  /** @test {Commando#command} */
  describe('#command()', function () {
    it('rejects unnamed commands', function () {
      var commando = new Commando('testRootCommand');
      var command = new Commando.Command();

      expect(commando.command.bind(commando)).withArgs(command)
        .to.throwException();
    });

    it('can add a command', function () {
      var commando = new Commando('testRootCommand');
      var command = new Commando.Command({ name: 'cmd1' });

      var testCmd = commando.command(command).getCommand('cmd1');
      expect(testCmd).to.eql(command);

    });
  });

  /** @test {Commando#getCommand} */
  describe('#getCommand()', function () {
    it('gets the command', function () {
      var subCommand = new Commando.Command({ name: 'subc1' });
      var commando = new Commando({ name: 'base command' })
        .version('1.0.0')
        .command(subCommand);

      expect(commando.getCommand('subc1')).to.be(subCommand);
    });
  });

  /** @test {Commando#command} */
  describe('Multi command', function () {
    var commando = new Commando('testRootCommand');

    commando = commando.version('1.0.0');
    commando = commando.command(
        new Commando.Command({ name: 'job' })
        .option('-f', '--force', 'force it', false)
        .option('-x', '--expand', 'force it', false)
        .command(
          new Commando.Command('list')
          .action(function (command) {
            expect(command.get('name')).to.be('list');
          })
        )
      )
      .option('-a --another', 'add another', false);

    commando = commando.command(
          new Commando.Command({ name: 'schedule' })
          .option('-j', '--jobName', 'force it', false)
          .command({ name: 'list' })
        )
        .option('-a', '--another', 'add another', false);
    commando.debug();
    console.log(commando.get('commands'));
    console.log();
    console.log();

    it('should fail if invoked without command', function () {
      var res = commando.args([]).run();
      expect(res).to.not.be.ok();
    });

    it('should fail if invoked without subcommand', function () {
      var res = commando.args(['job']).run();
      expect(res).to.not.be.ok();
    });

    it('should run if invoked with subcommand', function () {
      var res = commando.args(['job', 'list']).run();
      expect(res).to.be.ok();
    });

    commando.args(['schedule', 'list', '-f']).run();
    commando.args(['wat', 'list', '-f', 'thing']).run();
    commando.args(['job', 'wat', '-f', 'thing']).run();
  });

  /** @test {Commando#args} */
  describe('#args()', function () {
    var baseAction = sinon.spy();
    var subAction = sinon.spy();
    var subCommand = new Commando.Command({ name: 'subc1' })
    .action(subAction);
    var commando = new Commando({ name: 'base command' })
      .version('1.0.0')
      .action(baseAction)
      .command(subCommand);

    it('sees arguments', function () {
      var inputArgs = ['wat'];
      var args = minimist(inputArgs);
      var thisCommand = commando.args(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);

      expect(thisCommand.get('args').equals(expectedArgs)).to.be(true);
    });
    it('passes args to subcommands', function () {
      var inputArgs = ['subc1', 'wat'];
      var subArgs = ['wat'];
      var args = minimist(inputArgs);
      var subArgs = minimist(subArgs);
      var thisCommand = commando.args(inputArgs);
      var thisSubCommand = thisCommand.getCommand('subc1');
      var expectedArgs = new Immutable.fromJS(args);
      var expectedSubArgs = new Immutable.fromJS(subArgs);

      expect(thisCommand.get('args').equals(expectedArgs)).to.be(true);
      expect(thisSubCommand.get('args').equals(expectedSubArgs)).to.be(true);
    });

    it('ignores undefined options', function () {
      var inputArgs = ['--wat'];
      var thisCommand = commando.args(inputArgs);

      expect(thisCommand.getOption('wat')).to.be(undefined);
    });

    it('sees options', function () {
      var inputArgs = ['--wat'];
      var thisCommand = commando
        .option('-w --wat')
        .args(inputArgs);

      console.log('GETOPT', thisCommand.getOption('wat'));
      // TODO
      // expect(thisCommand.getOption('wat')).to.be(true);
    });
  });

  describe('#getOptionsHash', function () {
    it('returns empty object for no options', function () {
      function testAction(command) {
        expect(command.getOptionsHash()).to.eql({});
      }
      var spyTestAction = sinon.spy(testAction);
      new Commando({ name: 'base command' })
        .version('1.0.0')
        .action(spyTestAction)
        .run();
      expect(spyTestAction.calledOnce).to.be(true);
    });
    it('returns default options', function () {
      var defaultValue = 'defaultValue123';
      function testAction(command) {
        expect(command.getOptionsHash()).to.eql({
          a: defaultValue,
          'opt-a': defaultValue,
          'optionA': defaultValue,
        });
      }
      var spyTestAction = sinon.spy(testAction);
      new Commando({ name: 'base command' })
        .version('1.0.0')
        .option('-a --opt-a [optionA]', 'option a', defaultValue)
        .action(spyTestAction)
        .run();
      expect(spyTestAction.calledOnce).to.be(true);
    });
    it('returns default and overriden options', function () {
      var defaultValue = 'defaultValue123';
      var passedValue = 'passedValue123';
      function testAction(command) {
        expect(command.getOptionsHash()).to.eql({
          a: defaultValue,
          'opt-a': defaultValue,
          optionA: defaultValue,
          b: passedValue,
          'opt-b': passedValue,
          optionB: passedValue,
        });
      }
      var spyTestAction = sinon.spy(testAction);
      new Commando({ name: 'base command' })
        .version('1.0.0')
        .option('-a --opt-a [optionA]', 'option a', defaultValue)
        .option('-b --opt-b [optionB]', 'option b', defaultValue)
        .action(spyTestAction)
        .args(['-b', passedValue])
        .run();
      expect(spyTestAction.calledOnce).to.be(true);
    });
  });
});

/** @test {Commando#action} */
describe('Action', function () {
  describe('simple command with one action', function () {
    var commando = new Commando('testRootCommand')
      .version('1.0.0');
    it('calls the action without calling args', function () {
      var spyAction = sinon.spy();
      commando.action(spyAction).run();
      expect(spyAction.calledOnce).to.be(true);
    });
    it('calls the action with null args', function () {
      var spyAction = sinon.spy();
      commando.action(spyAction).args().run();
      expect(spyAction.calledOnce).to.be(true);
    });
    it('calls the action with empty args', function () {
      var spyAction = sinon.spy();
      commando.action(spyAction).args([]).run();
      expect(spyAction.calledOnce).to.be(true);
    });
    it('calls the action with one argument', function () {
      var spyAction = sinon.spy();
      var inputArgs = ['arg1'];
      var args = minimist(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);
      var thisCommand = commando
      .action(function (command) {
        spyAction();
        var args = command.get('args');
        var rootArgs = command.get('rootArgs');
        expect(command).to.be(thisCommand);
        expect(expectedArgs.equals(args)).to.be.ok();
        expect(args.get('_').toArray()).to.eql(inputArgs);
        expect(rootArgs.get('_').toArray()).to.eql(inputArgs);
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).to.be(true);
    });
    it('calls the action with one short option', function () {
      var spyAction = sinon.spy();
      var inputArgs = ['-f'];
      var args = minimist(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);
      var thisCommand = commando
      .action(function (command) {
        var args = command.get('args');
        var rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).to.be(thisCommand);
        expect(expectedArgs.equals(args)).to.be(true);
        expect(args.get('_').toArray()).to.eql([]);
        expect(rootArgs.get('_').toArray()).to.eql([]);
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).to.be(true);
    });
    it('calls the action with one long option', function () {
      var spyAction = sinon.spy();
      var inputArgs = ['--test-pass'];
      var args = minimist(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);
      var thisCommand = commando
      .action(function (command) {
        var cmdArgs = command.get('args');
        var rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).to.be(thisCommand);
        expect(cmdArgs).to.be(rootArgs);
        expect(expectedArgs.equals(cmdArgs)).to.be(true);
        expect(cmdArgs.get('_').toArray()).to.eql([]);
        expect(rootArgs.get('_').toArray()).to.eql([]);
        expect(cmdArgs.get('test-pass')).to.be.ok();
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).to.be(true);
    });
    it('calls the action with many options', function () {
      var spyAction = sinon.spy();
      var inputArgs = [
        'cmd',
        'subc',
        '-f',
        '--test-pass',
        'tp1',
        'arg1'
      ];
      var args = minimist(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);
      var expectPositional = ['cmd', 'subc', 'arg1'];
      var thisCommand = commando
      .action(function (command) {
        var cmdArgs = command.get('args');
        var rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).to.be(thisCommand);
        expect(cmdArgs).to.be(rootArgs);
        expect(expectedArgs.equals(cmdArgs)).to.be(true);
        expect(cmdArgs.get('_').toArray()).to.eql(expectPositional);
        expect(rootArgs.get('_').toArray()).to.eql(expectPositional);
        expect(cmdArgs.get('test-pass')).to.be.ok();
        expect(cmdArgs.get('f')).to.be.ok();
        expect(cmdArgs.get('cmd')).to.be(undefined);
        expect(cmdArgs.get('subc')).to.be(undefined);
        expect(cmdArgs.get('arg1')).to.be(undefined);
      }).args(inputArgs);
      thisCommand.run();
      expect(spyAction.calledOnce).to.be(true);
    });
  });
  describe('Subcommand', function () {
    var defaultAction = sinon.spy();
    var subcAction = sinon.spy();
    var subCommand = new Commando.Command({ name: 'subc1' })
    .action(subcAction);

    var commando = new Commando('testRootCommand')
      .version('1.0.0')
      .action(defaultAction)
      .command(subCommand);

    it('calls command action if no subcommand given', function () {
      defaultAction.reset();
      commando.run();
      expect(defaultAction.calledOnce).to.be(true);
    });

    it('calls command action if unknown subcommand given', function () {
      defaultAction.reset();
      var thisCommand = commando.args(['wat']);
      thisCommand.run();
      expect(defaultAction.calledOnce).to.be(true);
      expect(defaultAction.calledWith(thisCommand)).to.be(true);
    });

    it('calls sub command action if subcommand given', function () {
      defaultAction.reset();
      subcAction.reset();
      var thisCommand = commando.args(['subc1']);
      var thisSubCommand = thisCommand.get('commands').get('subc1');
      thisCommand.run();

      expect(defaultAction.called).to.be(false);
      expect(subcAction.calledOnce).to.be(true);
      expect(thisSubCommand.get('name')).to.be('subc1');
      expect(subcAction.args).to.not.be.empty();
      expect(subcAction.args[0][0]).to.be(thisSubCommand);
      expect(subcAction.calledWith(thisCommand)).to.be(false);
    });
  });
});

/** @test {Option} */
describe('Option', function () {
  /** @test {Option#parseOptString} */
  describe('#parseOptString()', function () {
    var option = new Commando.Option();
    it('Parses short options', function () {
      var e = {
        short: 'x',
      };
      expect(option.parseOptstring('-x')).to.eql(e);
    });

    it('Parses long options', function () {
      var e = {
        long: 'extreme',
      };
      expect(option.parseOptstring('--extreme')).to.eql(e);
    });

    it('Parses short and long options', function () {
      var e = {
        short: 't',
        long: 'was-tested',
      };
      expect(option.parseOptstring('-t --was-tested')).to.eql(e);
    });

    it('Parses short optional arguments', function () {
      var e = {
        short: '2',
        arg: 'was-tested',
        required: false,
      };
      expect(option.parseOptstring('-2 [was-tested]')).to.eql(e);
    });

    it('Parses short required arguments', function () {
      var e = {
        short: 't',
        arg: 'tested',
        required: true,
      };
      expect(option.parseOptstring('-t <tested>')).to.eql(e);
    });

    it('Parses long optional arguments', function () {
      var e = {
        long: 'tested',
        arg: 'was-tested',
        required: false,
      };
      expect(option.parseOptstring('--tested [was-tested]')).to.eql(e);
    });

    it('Parses long required arguments', function () {
      var e = {
        long: 'tested',
        arg: 'was-tested',
        required: true,
      };
      expect(option.parseOptstring('--tested <was-tested>')).to.eql(e);
    });

    it('Parses short and long with optional arguments', function () {
      var e = {
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

    it('Parses short and long with required arguments', function () {
      var e = {
        short: 'a',
        long: 'is-a',
        arg: 'option',
        required: true,
      };
      expect(option.parseOptstring('-a --is-a <option>')).to.eql(e);
    });

    it('fails on duplicated values', function () {
      // bind function to the object to allow calling within expect.
      var e = expect(option.parseOptstring.bind(option));

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
  describe('#constructor()', function () {
    it('creates short flags', function () {
      var o = new Commando.Option('-o', 'an option', false);

      expect(o).to.be.ok();
      expect(o.get('short')).to.be('o');
      expect(o.get('long')).to.be(undefined);
      expect(o.get('arg')).to.be(undefined);
      expect(o.get('default')).to.be(false);
      expect(o.get('required')).to.be(false);
    });

    it('creates long flags', function () {
      var o = new Commando.Option('--opt', 'an option', true);

      expect(o).to.be.ok();
      expect(o.get('short')).to.be(undefined);
      expect(o.get('long')).to.be('opt');
      expect(o.get('arg')).to.be(undefined);
      expect(o.get('default')).to.be(true);
      expect(o.get('required')).to.be(false);
    });

    it('creates options with optional values', function () {
      var o = new Commando.Option('-o --option [opt]', 'an option', 'default');

      expect(o).to.be.ok();
      expect(o.get('short')).to.be('o');
      expect(o.get('long')).to.be('option');
      expect(o.get('arg')).to.be('opt');
      expect(o.get('default')).to.be('default');
      expect(o.get('required')).to.be(false);
    });

    it('creates options with required values', function () {
      var o = new Commando.Option('-o --option <opt>');
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
describe('Argument Parsing', function () {
  var commandSpyAction = sinon.spy();
  function expectCallToSetValue(commando, args, value, argNames) {
    var spyAction = commando.get('action');
    spyAction.reset();
    var thisCommand = commando.args(args);
    var rootCommand = thisCommand;
    if (argNames === undefined) {
      argNames = ['f', 'force'];
    }
    if (typeof argNames === 'string') {
      argNames = [argNames];
    }
    thisCommand.run();
    expect(spyAction.calledOnce).to.be(true);
    var call = spyAction.getCall(0);
    var invokedCommand = call.args[0];
    var invokedRootCommand = call.args[0];
    expect(invokedCommand).to.be(thisCommand);
    expect(invokedRootCommand).to.be(rootCommand);
    argNames.forEach(function (argName) {
      expect(invokedCommand.getOption(argName)).to.be(value);
    });
  }

  function expectCommandoCallsWithArgs(optString, argKeys) {
    var commando = new Commando('testRootCommand')
    .version('1.0.0')
    .option(optString, 'force it', false)
    .action(commandSpyAction);

    it('sees defaults', function () {
      expectCallToSetValue(commando, [], false, argKeys);
    });

    it('sees long flags', function () {
      expectCallToSetValue(commando, ['--force'], true, argKeys);
      expectCallToSetValue(commando, ['--forces'], false, argKeys);
      expectCallToSetValue(commando, ['--force'], undefined, ['w', 'wrong']);
    });

    it('sees long args', function () {
      expectCallToSetValue(commando, ['--force', 'myArg'], 'myArg', argKeys);
    });
  }

  describe('Short args', function () {
    var commando = new Commando('rootCmd')
    .version('1.0.0')
    .option('-f', 'force it', false)
    .action(commandSpyAction);

    it('sees defaults', function () {
      expectCallToSetValue(commando, [], false, 'f');
    });

    it('sees short flags', function () {
      expectCallToSetValue(commando, ['-f'], true, 'f');
      expectCallToSetValue(commando, ['-x'], false, 'f');
      expectCallToSetValue(commando, ['-f'], undefined, 'anotherArg');
    });

    it('sees short args', function () {
      expectCallToSetValue(commando, ['--f', 'myArg'], 'myArg', 'f');
    });
  });

  describe('Long args', function () {
    var argKeys = ['force'];
    expectCommandoCallsWithArgs('--force', argKeys);
  });

  describe('Combined args', function () {
    var argKeys = ['f', 'force'];
    expectCommandoCallsWithArgs('-f --force', argKeys);

  });

  describe('Named args', function () {
    var argKeys = ['f', 'force', 'forceValue'];
    expectCommandoCallsWithArgs('-f --force [forceValue]', argKeys);
  });

  describe('Subcommand args', function () {
    var subSpyAction = sinon.spy();
    var subCommand = new Commando.Command('subCommand')
      .option('-s --sub [subOption]', 'sub option', 'sDefault')
      .action(subSpyAction);

    var commando = new Commando('rootCmd')
      .version('1.0.0')
      .option('-f --force', 'force it', false)
      .action(commandSpyAction)
      .command(subCommand);

    var fArgKeys = ['f', 'force'];
    var sArgKeys = ['s', 'sub', 'subOption'];
    it('sees defaults', function () {
      expectCallToSetValue(commando, [], false, fArgKeys);
      expectCallToSetValue(commando, [], undefined, sArgKeys);
      expectCallToSetValue(subCommand, [], 'sDefault', sArgKeys);
      expectCallToSetValue(subCommand, [], undefined, fArgKeys);
    });

    it('sees short flags', function () {
      expectCallToSetValue(commando, ['-f'], true, 'f');
      expectCallToSetValue(subCommand, ['-s'], true, 's');
    });

    it('sees short args', function () {
      expectCallToSetValue(commando, ['--f', 'myArg'], 'myArg', 'f');
      expectCallToSetValue(subCommand, ['--s', 'mySubArg'], 'mySubArg', 's');
    });
  });

  describe('Required arguments', function () {
    var commando = new Commando('rootCmd')
      .version('1.0.0')
      .option('-r --required <requiredArg>', 'a required argument', false)
      .action(commandSpyAction);

    it('validates required arguments', function () {
      // expect(commando.args(['-r']).run()).to.not.be.ok();
      // expect(commando.args(['--required']).run()).to.not.be.ok();
      expect(commando.args(['-r a']).run()).to.be.ok();
      expect(commando.args(['-required b']).run()).to.be.ok();
    });
  });

  describe('Action arguments', function () {
    var spyAction = sinon.spy();
    var spySubAction = sinon.spy();
    var subCommand = new Commando('subCommand').action(spySubAction);
    var rootCommand = new Commando('rootCommand')
      .version('1.0.0')
      .action(spyAction)
      .command(subCommand);

    it('passes the root command to the root action', function () {
      rootCommand.run();
      expect(spyAction.calledOnce).to.be(true);
      var args = spyAction.getCall(0).args;
      expect(args[0]).to.be(rootCommand);
    });
    it('passes the sub command to the sub action', function () {
      var rootWithArgs = rootCommand.args(['subCommand']);
      var subWithArgs = rootWithArgs.getCommand('subCommand');
      rootWithArgs.run();
      expect(spySubAction.calledOnce).to.be(true);
      var args = spySubAction.getCall(0).args;
      expect(args[0]).to.be(subWithArgs);
      expect(args[1]).to.be(rootWithArgs);
    });
  });
});
