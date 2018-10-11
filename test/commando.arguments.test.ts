import 'mocha';
import Commando from '../src/Commando';

const expect = require('expect.js');

/** @test {Commando} */
describe('Commando', () => {
  /** @test {Commando#argument} */
  describe('#argument()', () => {
    it('can be created with no config', () => {
      const commando = new Commando()
        .argument('[testArg]');
      const config = Commando.defaultConfig();
      // expect(commando._config).to.eql(config);
    });
  });
});
