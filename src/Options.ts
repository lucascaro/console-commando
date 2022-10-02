import { Map as IMap, List as IList } from "immutable";

export interface GenericOption {
  name: string;
  short?: string;
  long?: string;
  description?: string;
  multiple?: boolean;
}
export interface BooleanOption extends GenericOption {
  kind: "boolean";
  required?: boolean;
  default?: never;
  value?: boolean;
}

export interface StringOption extends GenericOption {
  kind: "string";
  multiple?: false;
  required?: boolean;
  default?: string;
  value?: string;
}

export interface MultiStringOption extends GenericOption {
  kind: "string";
  multiple: true;
  required?: boolean;
  default?: string[];
  value?: string[];
}

export interface NumericOption extends GenericOption {
  kind: "number";
  required?: boolean;
  default?: number;
  value?: number;
}

export type Option =
  | BooleanOption
  | StringOption
  | NumericOption
  | MultiStringOption;
export type OptionValue =
  | boolean
  | string
  | number
  | Readonly<string[]>
  | undefined;

export type StoredOptions = IMap<string, Readonly<Option>>;
