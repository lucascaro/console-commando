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
    terser(),
  ],
  output: {
    file: "lib/index.js",
    format: "cjs",
    sourcemap: true,
  },
  external: ["debug", "immutable", "readline", "minimist"],
};
