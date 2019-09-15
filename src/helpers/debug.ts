let _Debug: (name: string) => (...args: any[]) => void = (
  name: string,
): (() => null) => {
  return () => null;
};

/* START.DEBUG */
import Debug from "debug";

const debug = Debug("console-commando:helpers:debug");

if (process.env.NODE_ENV !== "production") {
  _Debug = (name: string): Debug.Debugger => {
    console.log("returning enabled debugger");
    debug("returning enabled debugger");
    return Debug(name);
  };
}
/* END.DEBUG */

export default _Debug;
