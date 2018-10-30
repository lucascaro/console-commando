import * as immutable from 'immutable';
import colors from './colors';
import {
  AllStoredOptions,
  TypeNamedOption,
  SubCommands,
  AllStoredArguments,
  CommandState,
  ParsedRuntimeArgs,
} from '../Command';
import { combinedOptions, combinedArguments } from './args';
import { flatten } from './array';

export function formatHelp(s: CommandState): string {
  const helpText = [] as string[];

  helpText.push(colors.green(s.name), colors.yellow(s.version || ''));
  if (s.description) {
    helpText.push(s.description);
  }
  const options = combinedOptions(s);
  const optsHelp = !options.isEmpty() ? '[...options]' : '';

  const args = combinedArguments(s);
  const argsHelp = formatArgHelp(args);

  helpText.push(colors.yellow('\nUsage:'));
  helpText.push(`    ${colors.green(s.name)} ${optsHelp} ${argsHelp}`);

  if (!options.isEmpty()) {
    helpText.push(colors.yellow('\nOptions:'));
    helpText.push(formatOptions(options));
  }

  if (!s.subCommands.isEmpty()) {
    helpText.push(colors.yellow('\nSub Commands:'));
    helpText.push(formatSubCommands(s.subCommands));
  }
  helpText.push('');

  return helpText.join('\n');
}

export function formatColumns(columns: immutable.Map<string, string[]>): string {
  if (columns.isEmpty()) { return ''; }
  const nCols = (columns.first() as string[]).length;
  const colWidths = columns
    .map(o => o.map(c => c.length))
    .reduce(
      // Reduce to the maximum lengts for each column.
      (p, c) => {
        return p.map((v, i) => Math.max(v, c[i]));
      },
      Array(nCols).fill(0),
    );
  // Pad all cells to the maximum cell width in that column + 3
  const padded = columns.map((o, k) => {
    return o.map((v, i) => v.padEnd(colWidths[i] + 2)).join('');
  })
  .map(l => `    ${l}`);

  return padded.join('\n');
}
export function formatOptions(options: AllStoredOptions): string {
  const longParam = <T>(o: TypeNamedOption<T>) =>
    o.long && o.typeName !== '' ? `=<${o.typeName}>` : '';
  const optHelp = options.map((o) => {
    const short = o.short ? `-${o.short}` : '';
    const long = o.long ? `--${o.long + longParam(o)}` :'';
    const name = [short, long].filter(n => n !== '').join(',');
    return [name, o.description || ''];
  });
  return formatColumns(optHelp);
}

export function formatSubCommands(commands: SubCommands): string {
  const columns = commands.map((c) => {
    return [c.state.name, c.state.description || ''];
  });
  return formatColumns(columns);
}

export function formatArgHelp(args: AllStoredArguments): string {
  return args
  .map(({ required, name }) => required ? `<${name}>` : `[${name}]`)
  .join(' ');
}

export function formatParsedArgs(parsed: ParsedRuntimeArgs): string[] {
  const argv = parsed.toArray()
  .map(([key, val]) => {
    const name = key.length === 1 ? `-${key}` : `--${key}`;
    if (Array.isArray(val)) {
      return flatten(val.map(v => [name, String(v)]));
    }
    return [name, String(val)];
  });
  return flatten(argv);
}
