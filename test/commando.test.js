'use strict';

var Commando = require('../lib/commando');
var Immutable = require('immutable');
var Option = require('../lib/option');

var expect = require('expect.js');
var minimist = require('minimist');
var sinon = require('sinon');

describe('Commando', function () {
  describe('#constructor()', function () {
    it('can be created with no config', function () {
      var commando = new Commando();
      expect(commando._config).to.eql(commando.defaultConfig());
    });

    it('can be created with name', function () {
      var commando = new Commando('myname');
      expect(commando._config).not.to.eql(commando.defaultConfig());
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

    it('will test things soon', function () {
      expect(1).to.be(1);
      var commando = new Commando('testRootCommand');

      // Test default version
      var initialVersion = commando.defaultConfig().get('version');
      expect(commando.get('version')).to.be(initialVersion);
      var commando2 = commando.version('1.0.1-test');

      expect(commando2.get('version')).to.be('1.0.1-test');
      expect(commando.get('version')).to.be(initialVersion);
      expect(Object.isFrozen(commando)).to.be(true);
    });
  });
  describe('#command()', function () {
    it('can add a command', function () {
      var commando = new Commando('testRootCommand');
      var command = new Commando.Command({ name: 'cmd1' });

      var testCmd = commando.command(command).get('commands').get('cmd1');
      expect(testCmd).to.eql(command);

    });
  });

  describe('#getCommand()', function () {
    it('gets the command', function () {
      var subCommand = new Commando.Command({ name: 'subc1' });
      var commando = new Commando({ name: 'base command' })
        .version('1.0.0')
        .command(subCommand);

      expect(commando.getCommand('subc1')).to.be(subCommand);
    });
  });

  describe('Multi command', function () {
    var commando = new Commando('testRootCommand');

    commando = commando.version('1.0.0');
    commando = commando.command(
        Commando.Command({ name: 'job' })
        .option('-f', '--force', 'force it', false)
        .option('-x', '--expand', 'force it', false)
        .command(
          Commando.Command({ name: 'list' })
          .action(function (command, options) {
            console.log('running action:', command, options);
            // TODO:
            console.log(options.getIn(['short']));
          })
        )
      )
      .option('-a', '--another', 'add another', false);

    commando = commando.command(
          Commando.Command({ name: 'schedule' })
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
      var args = minimist(inputArgs);
      var thisCommand = commando.args(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);

      expect(thisCommand.getOption('wat')).to.be(undefined);
    });

    it('sees options', function () {
      var inputArgs = ['--wat'];
      var args = minimist(inputArgs);
      var thisCommand = commando
        .option('-w --wat')
        .args(inputArgs);
      var expectedArgs = new Immutable.fromJS(args);

      console.log('GETOPT', thisCommand.getOption('wat'));
      // TODO
      // expect(thisCommand.getOption('wat')).to.be(true);
    });
  });
});

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
      .action(function (command, optionsList) {
        spyAction();
        var args = command.get('args');
        var rootArgs = command.get('rootArgs');
        expect(command).to.be(thisCommand);
        expect(expectedArgs.equals(args)).to.be.ok();
        expect(args.get('_').toArray()).to.eql(inputArgs);
        expect(rootArgs.get('_').toArray()).to.eql(inputArgs);
        console.log(optionsList);
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
      .action(function (command, optionsList) {
        var args = command.get('args');
        var rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).to.be(thisCommand);
        expect(expectedArgs.equals(args)).to.be(true);
        expect(args.get('_').toArray()).to.eql([]);
        expect(rootArgs.get('_').toArray()).to.eql([]);
        // expect(args.get('f')).to.be.ok();
        console.log(optionsList);
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
      .action(function (command, args, optionsList) {
        var cmdArgs = command.get('args');
        var rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).to.be(thisCommand);
        expect(cmdArgs).to.be(args);
        expect(expectedArgs.equals(cmdArgs)).to.be(true);
        expect(cmdArgs.get('_').toArray()).to.eql([]);
        expect(rootArgs.get('_').toArray()).to.eql([]);
        expect(cmdArgs.get('test-pass')).to.be.ok();
        console.log(cmdArgs, optionsList);
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
      .action(function (command, args, optionsList) {
        var cmdArgs = command.get('args');
        var rootArgs = command.get('rootArgs');
        spyAction();
        expect(command).to.be(thisCommand);
        expect(cmdArgs).to.be(args);
        expect(expectedArgs.equals(cmdArgs)).to.be(true);
        expect(cmdArgs.get('_').toArray()).to.eql(expectPositional);
        expect(rootArgs.get('_').toArray()).to.eql(expectPositional);
        expect(cmdArgs.get('test-pass')).to.be.ok();
        expect(cmdArgs.get('f')).to.be.ok();
        expect(cmdArgs.get('cmd')).to.be(undefined);
        expect(cmdArgs.get('subc')).to.be(undefined);
        expect(cmdArgs.get('arg1')).to.be(undefined);
        console.log(cmdArgs, optionsList);
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
      // console.log('CMD', thisCommand);
      // console.log('CMD', subCommand);
      // console.log('CMD', thisSubCommand);
      // console.log('CMD', defaultAction.getCall(0));
      // console.log('CMD', subcAction.getCall(0));
      console.log('CMD ARGS', subcAction.args[0][0]);
      console.log('CMD EQ', thisSubCommand);

      expect(defaultAction.called).to.be(false);
      expect(subcAction.calledOnce).to.be(true);
      expect(thisSubCommand.get('name')).to.be('subc1');
      expect(subcAction.args).to.not.be.empty();
      expect(subcAction.args[0][0]).to.be(thisSubCommand);
      expect(subcAction.calledWith(thisCommand)).to.be(false);
    });
  });
});

describe('Option', function () {
  describe('#parseOptString()', function () {
    var option = new Option();
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
      expect(option.parseOptstring).withArgs('-s -s').to.throwException();
      expect(option.parseOptstring).withArgs('--ss --ss').to.throwException();
      expect(option.parseOptstring).withArgs('-s --ss -s').to.throwException();
      expect(option.parseOptstring).withArgs('-s --ss').to.not.throwException();
      expect(option.parseOptstring).withArgs('-s --ss [abc] [abc]').to.throwException();
      expect(option.parseOptstring).withArgs('-s --ss [abc] <abc>').to.throwException();
      expect(option.parseOptstring).withArgs('[abc] <abc>').to.throwException();
      expect(option.parseOptstring).withArgs('[abc]').to.throwException();
      expect(option.parseOptstring).withArgs('<abc>').to.throwException();
    });
  });
  describe('#constructor()', function () {
    it('creates short flags', function () {
      var o = new Commando.Option('-o', 'an option', false);
      var commando = Commando('testRootCommand').option(o);

      expect(o).to.be.ok();
      expect(o.get('short')).to.be('o');
      expect(o.get('long')).to.be(undefined);
      expect(o.get('arg')).to.be(undefined);
      expect(o.get('default')).to.be(false);
      expect(o.get('required')).to.be(undefined);
    });

    it('creates long flags', function () {
      var o = new Commando.Option('--opt', 'an option', true);
      var commando = Commando('testRootCommand').option(o);

      expect(o).to.be.ok();
      expect(o.get('short')).to.be(undefined);
      expect(o.get('long')).to.be('opt');
      expect(o.get('arg')).to.be(undefined);
      expect(o.get('default')).to.be(true);
      expect(o.get('required')).to.be(undefined);
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

describe('Argument Parsing', function () {
  var commandSpyAction = sinon.spy();
  function expectCallToSetValue(commando, args, value, argNames) {
    var spyAction = commando.get('action');
    spyAction.reset();
    var thisCommand = commando.args(args);
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
    expect(invokedCommand).to.be(thisCommand);
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
      // expect(commando.args(['-r a']).run()).to.be.ok();
    });

  });
});
