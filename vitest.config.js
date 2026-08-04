import { defineConfig } from "vite";

export default defineConfig({
  // Vite 8 defaults JSX to the classic runtime, which compiles every tag to
  // `React.createElement(...)` and therefore needs `React` in lexical scope. None of the test files
  // import React - they are written against the automatic runtime, the same as the rest of the
  // application and the same as what react-scripts uses for the production build - so all 33 of them
  // failed with `ReferenceError: React is not defined` before a single assertion ran.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    globals: true,
    css: true,
  },
});
