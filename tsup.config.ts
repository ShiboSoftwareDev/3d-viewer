import { defineConfig, type Options } from "tsup"
import { promises as fs } from "fs"

const wasmInlineBase64PluginEsbuild = {
  name: "esbuild-wasm-inline-base64",
  setup(build: any) {
    build.onResolve({ filter: /\?inline-base64$/ }, async (args: any) => {
      const resolved = await build.resolve(
        args.path.replace("?inline-base64", ""),
        {
          resolveDir: args.resolveDir,
          kind: args.kind,
        },
      )

      if (resolved.errors && resolved.errors.length > 0) {
        return { errors: resolved.errors }
      }

      return {
        path: resolved.path,
        namespace: "wasm-inline-base64-ns",
      }
    })

    // Load files in the 'wasm-inline-base64-ns' namespace.
    build.onLoad(
      { filter: /.*/, namespace: "wasm-inline-base64-ns" },
      async (args: any) => {
        try {
          const wasmBuffer = await fs.readFile(args.path)
          const base64String = wasmBuffer.toString("base64")
          return {
            contents: `export default "${base64String}";`,
            loader: "js",
          }
        } catch (e: any) {
          return {
            errors: [
              {
                text: `[esbuild-wasm-inline-base64] Failed to read WASM file ${args.path}: ${e.message}`,
              },
            ],
          }
        }
      },
    )

    // Alias: rewrite all imports of 'manifold-3d/manifold.wasm' to use '?inline-base64'
    build.onResolve(
      { filter: /^manifold-3d\/manifold\.wasm$/ },
      (args: any) => {
        return {
          path: args.path + "?inline-base64",
          namespace: args.namespace,
        }
      },
    )
  },
}

export default defineConfig({
  entry: ["src/index.tsx"],
  platform: "neutral",
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  esbuildPlugins: [wasmInlineBase64PluginEsbuild],
})
