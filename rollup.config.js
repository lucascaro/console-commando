import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default {
  input: "./src/index.ts",
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: { module: "esnext" },
      },
    }),
    resolve(),
    commonjs(),
    terser(),
  ],
  output: {
    file: "lib/bundle.js",
    format: "cjs",
  },
  external: ["readline", "os", "tty", "util", "immutable", "minimist"],
};
