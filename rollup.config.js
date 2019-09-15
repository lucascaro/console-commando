import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import stripCode from "rollup-plugin-strip-code";

const IS_PROD = process.env.NODE_ENV === "production";
if (IS_PROD) {
  console.log(`Production build started...`);
}

const when = (cond, plugin, ifNot) => (cond ? plugin : ifNot);

export default {
  input: "./src/index.ts",
  plugins: [
    when(
      IS_PROD,
      stripCode({
        start_comment: "START.DEBUG",
        end_comment: "END.DEBUG",
      }),
    ),
    typescript({
      tsconfigOverride: {
        compilerOptions: { module: "esnext" },
      },
    }),
    when(IS_PROD, terser()),
  ],
  output: {
    file: "lib/index.js",
    format: "cjs",
    sourcemap: true,
  },
  external: ["debug", "immutable", "readline", "minimist"],
};
