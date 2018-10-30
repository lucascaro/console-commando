import { command, option, multiOption } from '../src/index';

command('name-only')
.run();

command('name-and-version')
.withVersion('1.0.0')
.run();

command('with-description')
.withVersion('v1.0.1')
.withDescription('A description, which could be long.')
.run();

command('with-flags')
.withVersion('1.0.2')
// tslint:disable-next-line:max-line-length
.withDescription('A description, which could be long or even very long. Note how flags can never have the same short or long names.')
.withFlag({ name: 'force', short: 'f', long: 'force' })
.withFlag({ name: 'gorce', short: 'g', long: 'gorce', description: 'a flag' })
.withFlag({ name: 'horce', short: 'h', long: 'horce', description: 'a flag', default: true })
.run();

const withHandler = command('with-handler')
.withVersion('1.0.4')
.withDescription('A description, which could be long.')
.withFlag({ name: 'force', short: 'f', long: 'force', description: 'a flag', default: false })
.withNumberOption(option('number', 'n', 'a number', 66))
.withStringOption({
  name: 'string',
  short: 's',
  long: 'string',
  description: 'a string',
  default: 'test',
})
.withStringOption({
  name: 'array',
  short: 'a',
  long: 'array',
  description: 'a string array',
  multiple: true,
  default: ['test'],
})
.withPositionalString({ name: 'pos1', description: 'a positional string', default: 'test' })
.withPositionalNumber({ name: 'pos2', description: 'a positional number', default: 10 });
withHandler.run();

withHandler.withHandler(cmd => console.log('HANDLER!'))
.run();

const fullTest = command('full-test')
.withVersion('1.0.5')
.withDescription('A description, which could be long.')
.withFlag({ name: 'force', short: 'f', long: 'force', description: 'a flag' })
.withNumberOption(option('number', 'n', 'a number'))
.withStringOption({ name: 'string', short: 's', long: 'string', description: 'a string' })
.withStringOption(multiOption('array', 'a', 'a string array'))
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

const subTest = command('sub-test')
.withVersion('1.0.6')
.withDescription('A description, which could be long.')
.withFlag({ name: 'force', short: 'f', long: 'force', description: 'a flag', default: false })
.withFlag({ name: 'gorce', short: 'g', long: 'gorce', description: 'another flag', default: false })
.withNumberOption(option('number', 'n', 'a number', 66))
.withStringOption({
  name: 'string',
  short: 's',
  long: 'string',
  description: 'a string',
  default: 'test',
})
.withStringOption({
  name: 'array',
  short: 'a',
  long: 'array',
  description: 'a string array',
  multiple: true,
  default: ['test'],
})
.withPositionalString({ name: 'pos1', description: 'a positional string', default: 'test' })
.withPositionalNumber({ name: 'pos2', description: 'a positional number', default: 10 })
.withPreProcessor((_, state) => {
  console.log('pre1');
  return state.set('runtime', 'state');
})
.withSubCommand(
  command('sub')
  .withPreProcessor((_, state) => {
    console.log('pre2');
    return state.set('runtime2', 'state2');
  })
  .withHandler((cmd, state) => {
    console.log('SUBCOMMAND2!');
    console.log(JSON.stringify(state));
  }),
)
.withSubCommand(
  command('sub2')
  .withPreProcessor((_, state) => {
    console.log('pre2');
    return state.set('runtime2', 'state2');
  })
  .withHandler((cmd, state) => {
    console.log('SUBCOMMAND!');
    console.log(JSON.stringify(state));
  })
  .withSubCommand(
    command('sub')
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

console.log('\n$ sub-test');
subTest.run();
console.log('\n$ sub-test help');
subTest.withRuntimeArgs(['help']).run();
console.log('\n$ sub-test sub');
subTest.withRuntimeArgs(['sub']).run();
console.log('\n$ sub-test sub help');
subTest.withRuntimeArgs(['sub', 'help']).run();
console.log('\n$ sub-test sub sub2');
subTest.withRuntimeArgs(['sub', 'sub2']).run();
console.log('\n$ sub-test sub sub2 help');
subTest.withRuntimeArgs(['sub', 'sub2', 'help']).run();
console.log('\n$ sub-test sub sub2 --help');
subTest.withRuntimeArgs(['sub', 'sub2', '--help']).run();
// console.log('\n$ sub-test sub sub2 -f -g --gorce -a arr1 -a arr2 pos1 -- --pos2');
// subTest.withRuntimeArgs([
//   'sub', 'sub2', '-f', '-g', '--gorce', '-a', 'arr1', '-a', 'arr2', 'pos1', '--', '--pos2',
// ]).run();

subTest.withRuntimeArgs(process.argv.slice(2)).run();
