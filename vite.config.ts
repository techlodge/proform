import { resolve } from "path";
import { defineConfig } from "vite";
import vueJSX from "@vitejs/plugin-vue-jsx";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "./src"),
      },
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, "./src/index.ts"),
      name: "lib",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    sourcemap: mode === "development" ? "inline" : false,
  },
  plugins: [
    vueJSX(),
    dts({
      cleanVueFileName: true,
      outDir: "dist/types",
      include: ["./**/*"],
      exclude: ["**/*.spec.ts", "**/*.spec.tsx"],
    }),
  ],
}));
