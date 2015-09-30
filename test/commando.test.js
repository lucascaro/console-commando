'use strict';

var expect = require('expect.js');

var Commando = require('../lib/commando');

describe('Commando', function () {
  describe('#constructor()', function () {
    it('can be created with no config', function () {
      var commando = new Commando();
      expect(commando._config).to.eql(commando.defaultConfig());
    });

    it('can be created with version config', function () {
      var commando = new Commando({ version: '1.1.1' });
      expect(commando.get('version')).to.eql('1.1.1');
    });

    it('will test things soon', function () {
      expect(1).to.be(1);
      var commando = new Commando();

      // Test default version
      var initialVersion = commando.defaultConfig().get('version');
      expect(commando.get('version')).to.be(initialVersion);
      var commando2 = commando.version('1.0.1-test');

      expect(commando2.get('version')).to.be('1.0.1-test');
      expect(commando.get('version')).to.be(initialVersion);
      // expect(Object.isFrozen(commando)).to.be(true);
    });
  });
  describe('#command()', function () {
    it('can add a command', function () {
      var commando = new Commando();
      var command = new Commando.Command({ name: 'cmd1' });

      var testCmd = commando.command(command).get('commands').get('cmd1');
      expect(testCmd).to.eql(command);

    });
  });

  describe('Multi command', function () {
    var commando = new Commando();

    commando = commando.version('1.0.0');
    commando = commando.command(
        Commando.Command({ name: 'job' })
        .option('-f','--force', 'force it', false)
        .option('-x','--expand', 'force it', false)
        .command(
          Commando.Command({ name: 'list' })
          .action(function (args, rootArgs) {
            console.log('running action:', args, rootArgs);
          })
        )
      )
      .option('-a','--another', 'add another', false);

    commando = commando.command(
          Commando.Command({ name: 'schedule' })
          .option('-j','--jobName', 'force it', false)
          .command({ name: 'list' })
        )
        .option('-a','--another', 'add another', false);
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

});

describe('Argument Parsing', function () {
  describe('?', function () {
    var commando = new Commando()
    .version('1.0.0')
    .option('-f','--force', 'force it', false, false);

    commando.args([]).run();
    commando.args(['job']).run();
    commando.args(['job', 'list']).run();
    commando.args(['schedule', 'list', '-f']).run();
    commando.args(['job', 'list', '-f', 'thing']).run();
    commando.args(['wat', 'list', '-f', 'thing']).run();
  });
});
