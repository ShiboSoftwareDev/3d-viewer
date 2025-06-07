import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import wasmInlineBase64Plugin from "./vite-plugin-wasm-inline-base64"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), wasmInlineBase64Plugin()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    proxy: {
      // Use .storybook/main.ts to configure the proxy, for some reason it
      // doesn't work when configured here
    },
  },
  assetsInclude: ["**/*.wasm"],
})
