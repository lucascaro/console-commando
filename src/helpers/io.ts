import * as readline from 'readline';

export function ask(prompt: string, defaultValue: string = ''): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${prompt} [${defaultValue}]`, (answer) => {
      resolve(answer || defaultValue);
      rl.close();
    });
  });
}
