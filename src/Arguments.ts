import { Map as IMap } from "immutable";

export interface StringArgument {
  kind: "string";
  name: string;
  description?: string;
  required?: boolean;
  multiple?: false;
  default?: string;
  value?: string;
}

export interface NumericArgument {
  kind: "number";
  name: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  default?: number;
  value?: number;
}
export interface MultiStringArgument {
  kind: "string";
  name: string;
  description?: string;
  required?: boolean;
  multiple: true;
  default?: string[];
  value?: string[];
}

export type Argument = StringArgument | MultiStringArgument | NumericArgument;

export type StoredArguments = IMap<string, Readonly<Argument>>;
