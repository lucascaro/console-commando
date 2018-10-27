import Command from '../src/Command';

Command.create('name-only')
.run();

Command.create('name-and-version')
.withVersion('1.0.0')
.run();

Command.create('with-description')
.withVersion('v1.0.1')
.withDescription('A description, which could be long.')
.run();

Command.create('with-flags')
.withVersion('1.0.2')
// tslint:disable-next-line:max-line-length
.withDescription('A description, which could be long or even very long. Note how flags can never have the same short or long names.')
.withFlag({ name: 'force', short: 'f', long: 'force' })
.withFlag({ name: 'gorce', short: 'g', long: 'gorce', description: 'a flag' })
.withFlag({ name: 'horce', short: 'h', long: 'horce', description: 'a flag', default: true })
.run();

const withHandler = Command.create('with-handler')
.withVersion('1.0.4')
.withDescription('A description, which could be long.')
.withFlag({ name: 'force', short: 'f', long: 'force', description: 'a flag', default: false })
.withNumberArg({ name: 'number', short: 'n', long: 'number', description: 'a number', default: 66 })
.withStringArg({
  name: 'string',
  short: 's',
  long: 'string',
  description: 'a string',
  default: 'test',
})
.withStringArrayArg({
  name: 'array',
  short: 'a',
  long: 'array',
  description: 'a string array',
  default: ['test'],
})
.withPositionalString({ name: 'pos1', description: 'a positional string', default: 'test' })
.withPositionalNumber({ name: 'pos2', description: 'a positional number', default: 10 });
withHandler.run();

withHandler.withHandler(cmd => console.log('HANDLER!'))
.run();

const fullTest = Command.create('full-test')
.withVersion('1.0.5')
.withDescription('A description, which could be long.')
.withFlag({ name: 'force', short: 'f', long: 'force', description: 'a flag' })
.withNumberArg({ name: 'number', short: 'n', long: 'number', description: 'a number' })
.withStringArg({ name: 'string', short: 's', long: 'string', description: 'a string' })
.withStringArrayArg({ name: 'array', short: 'a', long: 'array', description: 'a string array' })
.withPositionalString({ name: 'pos1', description: 'a positional string' })
.withPositionalNumber({ name: 'pos2', description: 'a positional number' })
.withPreProcessor((_, state) => {
  return state.set('runtime', 'state');
});
fullTest.run();

fullTest.withHandler((cmd, state) => {
  console.log(JSON.stringify(state));
})
.run();

const subTest = Command.create('sub-test')
.withVersion('1.0.6')
.withDescription('A description, which could be long.')
.withFlag({ name: 'force', short: 'f', long: 'force', description: 'a flag', default: false })
.withNumberArg({ name: 'number', short: 'n', long: 'number', description: 'a number', default: 66 })
.withStringArg({
  name: 'string',
  short: 's',
  long: 'string',
  description: 'a string',
  default: 'test',
})
.withStringArrayArg({
  name: 'array',
  short: 'a',
  long: 'array',
  description: 'a string array',
  default: ['test'],
})
.withPositionalString({ name: 'pos1', description: 'a positional string', default: 'test' })
.withPositionalNumber({ name: 'pos2', description: 'a positional number', default: 10 })
.withPreProcessor((_, state) => {
  console.log('pre1');
  return state.set('runtime', 'state');
})
.withSubCommand(
  Command.create('sub')
  .withPreProcessor((_, state) => {
    return state.set('runtime2', 'state2');
  })
  .withHandler((cmd, state) => {
    console.log('SUBCOMMAND!');
    console.log(JSON.stringify(state));
  })
  .withSubCommand(
    Command.create('sub2')
    .withPreProcessor((_, state) => {
      console.log('pre3');
      return state.set('runtime3', 'state3');
    })
    .withHandler((cmd, state) => {
      console.log('SUB SUBCOMMAND!');
      console.log(JSON.stringify(state));
    }),
  ),
)
.withHandler((cmd, state) => {
  console.log('PARENT!');
  console.log(JSON.stringify(state));
});

subTest.run();
subTest.withRuntimeArgs(['sub']).run();
subTest.withRuntimeArgs(['sub', 'sub2']).run();
