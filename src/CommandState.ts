import { Map as IMap, List as IList } from "immutable";
import {
  Handler,
  SubCommands,
  ParsedRuntimeArgs,
  PreProcessor,
} from "./Command";
import { StoredOptions } from "./Options";
import { StoredArguments } from "./Arguments";
import { getOptionOrParentOption } from "./helpers/args";

export interface StateData {
  name: string;
  version?: string;
  description?: string;
  handler?: Handler;
  preProcessors: IList<PreProcessor>;
  options: StoredOptions;
  arguments: StoredArguments;
  parentOptions: StoredOptions;
  parentArguments: StoredArguments;
  subCommands: SubCommands;
  runtimeArgs: IList<string>;
  parsedRuntimeArgs: ParsedRuntimeArgs;
  sealed?: boolean;
}

export interface CommandState {
  get: <P extends keyof StateData>(prop: P) => StateData[P];
  getFlag: (name: string) => boolean;
  getStringOption: (name: string) => string | undefined;
  getNumericOption: (name: string) => number | undefined;
  getMultiStringOption: (name: string) => string[];
  getStringArg: (name: string) => string | undefined;
  getNumericArg: (name: string) => number | undefined;
  getMultiStringArg: (name: string) => string[];
}

export function makeCommandState(data: StateData): CommandState {
  const state: CommandState = {
    get,
    getFlag,
    getStringOption,
    getNumericOption,
    getMultiStringOption,
    getStringArg,
    getNumericArg,
    getMultiStringArg,
  };

  function get<P extends keyof StateData>(prop: P): StateData[P] {
    return data[prop];
  }

  function getFlag(name: string): boolean {
    const opt = getOptionOrParentOption(name, data.options, data.parentOptions);
    if (opt.kind !== "boolean" || opt.multiple) {
      throw new TypeError(`${name} is not a flag`);
    }
    return !!opt.value;
  }

  function getStringOption(name: string): string | undefined {
    const opt = getOptionOrParentOption(name, data.options, data.parentOptions);
    if (opt.kind !== "string" || opt.multiple === true) {
      throw new TypeError(`${name} is not a string option`);
    }
    return opt.value || opt.default;
  }

  function getNumericOption(name: string): number | undefined {
    const opt = getOptionOrParentOption(name, data.options, data.parentOptions);
    if (opt.kind !== "number" || opt.multiple) {
      throw new TypeError(`${name} is not a numeric option`);
    }
    return opt.value || opt.default;
  }

  function getMultiStringOption(name: string): string[] {
    const opt = getOptionOrParentOption(name, data.options, data.parentOptions);
    if (opt.kind !== "string" || !opt.multiple) {
      throw new TypeError(`${name} is not a multi string option`);
    }
    return opt.value || opt.default || [];
  }

  function getStringArg(name: string): string | undefined {
    const opt = data.arguments.get(name);
    if (!opt) {
      throw new TypeError(`${name} is not a known option`);
    }
    if (opt.kind !== "string" || opt.multiple === true) {
      throw new TypeError(`${name} is not a string option`);
    }
    return opt.value || opt.default;
  }

  function getNumericArg(name: string): number | undefined {
    const opt = data.arguments.get(name);
    if (!opt) {
      throw new TypeError(`${name} is not a known option`);
    }
    if (opt.kind !== "number" || opt.multiple) {
      throw new TypeError(`${name} is not a numeric option`);
    }
    return opt.value || opt.default;
  }

  function getMultiStringArg(name: string): string[] {
    const opt = data.arguments.get(name);
    if (!opt) {
      throw new TypeError(`${name} is not a known option`);
    }
    if (opt.kind !== "string" || !opt.multiple) {
      throw new TypeError(`${name} is not a multi string option`);
    }
    return opt.value || opt.default || [];
  }
  return Object.freeze(state);
}
