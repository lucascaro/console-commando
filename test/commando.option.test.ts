import 'mocha';

import Commando from '../src/commando';

const expect = require('expect.js');
const sinon = require('sinon');

/** @test {Option} */
describe('Option', function () {
  /** @test {Option#parseOptString} */
  describe('#parseOptString()', function () {
    var option = new Commando.Option();
    it('Parses short options', function () {
      const e = {
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
