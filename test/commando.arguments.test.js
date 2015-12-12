'use strict';

var Commando = require('../lib/commando');
// var Immutable = require('immutable');
// var Argument = require('../lib/argument');

var expect = require('expect.js');
// var minimist = require('minimist');
// var sinon = require('sinon');

/** @test {Commando} */
describe('Commando', function () {
  /** @test {Commando#argument} */
  describe('#argument()', function () {
    it('can be created with no config', function () {
      var commando = new Commando()
        .argument('[testArg]');
      var config = Commando.defaultConfig();
      // expect(commando._config).to.eql(config);
    });
  });
});
