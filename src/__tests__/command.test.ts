import Command, { ReturnValue } from "../Command";

describe('Command', () => {
  test('can create a command with a name', () => {
    expect(() => Command.create('testCmd')).not.toThrowError();
    expect(
      Command.create('testCmd').run()
    ).resolves.toBe(ReturnValue.SUCCESS);
  })
})

Command.create('testCmd')
.withVersion('1')
.run();

Command.create('testCmd')
.withVersion('1')
.withDescription('a description')
.run();

Command.create('testCmd')
.withVersion('1')
.withDescription('a description')
.withFlag({name: 'force', short: 'f', long: 'force'})
.withFlag({name: 'gorce', short: 'g', long: 'gorce', description: 'a flag'})
.withFlag({name: 'horce', short: 'h', long: 'horce', description: 'a flag', default: true})
.run();

Command.create('testCmd')
.withVersion('1')
.withDescription('a description')
.withFlag({name: 'force', short: 'f', long: 'force', description: 'a flag', default: false})
.run();

Command.create('testCmd')
.withVersion('1')
.withDescription('a description')
.withFlag({name: 'force', short: 'f', long: 'force', description: 'a flag', default: false})
.withNumberArg({name: 'number', short: 'n', long: 'number', description: 'a number', default: 66})
.withStringArg({name: 'string', short: 's', long: 'string', description: 'a string', default: 'test'})
.withStringArrayArg({name: 'array', short: 'a', long: 'array', description: 'a string array', default: ['test']})
.withPositionalString({name: 'pos1', description: 'a positional string', default: 'test'})
.withPositionalNumber({name: 'pos2', description: 'a positional number', default: 10})
.withHandler((cmd) => console.log(JSON.stringify(cmd)))
.run();

Command.create('testCmd')
.withVersion('1')
.withDescription('a description')
.withFlag({name: 'force', short: 'f', long: 'force', description: 'a flag', default: false})
.withNumberArg({name: 'number', short: 'n', long: 'number', description: 'a number', default: 66})
.withStringArg({name: 'string', short: 's', long: 'string', description: 'a string', default: 'test'})
.withStringArrayArg({name: 'array', short: 'a', long: 'array', description: 'a string array', default: ['test']})
.withPositionalString({name: 'pos1', description: 'a positional string', default: 'test'})
.withPositionalNumber({name: 'pos2', description: 'a positional number', default: 10})
.withPreProcessor((_, state) => {
  return state.set('runtime', 'state');
})
.withHandler((cmd, state) => {
  console.log(JSON.stringify(cmd))
  console.log(JSON.stringify(state))
})
.run();

const subTest =Command.create('testCmd')
.withVersion('1')
.withDescription('a description')
.withFlag({name: 'force', short: 'f', long: 'force', description: 'a flag', default: false})
.withNumberArg({name: 'number', short: 'n', long: 'number', description: 'a number', default: 66})
.withStringArg({name: 'string', short: 's', long: 'string', description: 'a string', default: 'test'})
.withStringArrayArg({name: 'array', short: 'a', long: 'array', description: 'a string array', default: ['test']})
.withPositionalString({name: 'pos1', description: 'a positional string', default: 'test'})
.withPositionalNumber({name: 'pos2', description: 'a positional number', default: 10})
.withPreProcessor((_, state) => {
  return state.set('runtime', 'state');
})
.withSubCommand(
  Command.create('sub')
  .withHandler((cmd, state) => {
    console.log('SUBCOMMAND!');
    console.log(JSON.stringify(state))
  })
  .withSubCommand(
    Command.create('sub2')
    .withHandler((cmd, state) => {
      console.log('SUB SUBCOMMAND!');
      console.log(JSON.stringify(state))
    })
  )
)
.withHandler((cmd, state) => {
  console.log('PARENT!');
  console.log(JSON.stringify(cmd))
  console.log(JSON.stringify(state))
});

subTest.run();
subTest.withRuntimeArgs(['sub']).run();
subTest.withRuntimeArgs(['sub', 'sub2']).run();