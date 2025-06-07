import { promises as fs } from "fs"

export default function wasmInlineBase64Plugin() {
  return {
    name: "vite-plugin-wasm-inline-base64",
    async transform(_src: string, id: string) {
      if (id.endsWith("?inline-base64")) {
        const filePath = id.replace("?inline-base64", "")
        try {
          const wasmBuffer = await fs.readFile(filePath)
          const base64String = wasmBuffer.toString("base64")
          return {
            code: `export default "${base64String}";`,
            map: null,
          }
        } catch (e: any) {
          const errorMessage = `[vite-plugin-wasm-inline-base64] Failed to read WASM file ${filePath}: ${e.message}`
          console.error(errorMessage)
          return {
            code: null,
            map: null,
            errors: [errorMessage],
          }
        }
      }
      return null
    },
  }
}
