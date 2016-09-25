
export function parseOptions(optstring: string): Map<string, string> {
  let options: string[] = optstring.split(/ +/);
  let parsed = new Map<string, string>();
  for (let i = 0; i < options.length; i++) {
    let option = options[i];
    this.parseNamedArgument(parsed, option);
  }
  return parsed;
}
