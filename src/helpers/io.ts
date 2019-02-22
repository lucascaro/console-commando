import * as readline from "readline";

const io = {
  ask(prompt: string, defaultValue: string = ""): Promise<string> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const suffix = defaultValue !== "" ? `[${defaultValue}] ` : "";
      rl.question(`${prompt} ${suffix}`, answer => {
        resolve(answer || defaultValue);
        rl.close();
      });
    });
  },
};

export default io;
