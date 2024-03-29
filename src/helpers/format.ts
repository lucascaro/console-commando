import { Map as IMap } from "immutable";
import { SubCommands } from "../Command";
import colors from "./colors";
import { StoredOptions, Option } from "../Options";
import { StateData } from "../CommandState";
import { StoredArguments } from "../Arguments";

export function formatColumns(columns: IMap<string, string[]>): string {
  if (columns.isEmpty()) {
    return "";
  }
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
  const padded = columns
    .map(o => {
      return o.map((v, i) => v.padEnd(colWidths[i] + 2)).join("");
    })
    .map(l => `    ${l}`);

  return padded.join("\n");
}
export function formatOptions(options: StoredOptions): string {
  const longParam = (o: Option): string => (o.long ? `=<${o.kind}>` : "");
  const optHelp = options
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(o => {
      const short = o.short ? `-${o.short}` : "";
      const long = o.long ? `--${o.long + longParam(o)}` : "";
      const name = [short, long].filter(n => n !== "").join(",");
      return [name, o.description || ""];
    });
  return formatColumns(optHelp);
}

export function formatSubCommands(commands: SubCommands): string {
  const columns = commands.map(c => {
    return [c.state.name, c.state.description || ""];
  });
  return formatColumns(columns);
}

export function formatArgHelp(args: StoredArguments): string {
  return args
    .map(({ required, name }) => (required ? `<${name}>` : `[${name}]`))
    .join(" ");
}

export function formatHelp(s: StateData): string {
  const helpText = [] as string[];
  const version = s.version ? `(v${s.version})` : "";
  helpText.push(`${colors.green(s.name)} ${colors.yellow(version)}`);
  if (s.description) {
    helpText.push(s.description);
  }
  const options = s.parentOptions.merge(s.options);
  const args = s.arguments;

  const optsHelp = !options.isEmpty() ? "[...options]" : "";
  const argsHelp = formatArgHelp(args);

  helpText.push(colors.yellow("\nUsage:"));
  helpText.push(`    ${colors.green(s.name)} ${optsHelp} ${argsHelp}`);

  if (!s.options.isEmpty()) {
    helpText.push(colors.yellow("\nOptions:"));
    helpText.push(formatOptions(options));
  }

  if (!s.subCommands.isEmpty()) {
    helpText.push(colors.yellow("\nSub Commands:"));
    helpText.push(formatSubCommands(s.subCommands));
  }
  helpText.push("");

  return helpText.join("\n");
}
