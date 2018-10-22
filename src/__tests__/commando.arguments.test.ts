import Commando from '../Commando';

// const expect = require('expect.js');

/** @test {Commando} */
describe('Commando', () => {
  /** @test {Commando#argument} */
  describe('#argument()', () => {
    it('can be created with no config', () => {
      const commando = new Commando('name')
        .argument('[testArg]');
      // expect(commando._config).to.eql(config);
    });
  });
});
