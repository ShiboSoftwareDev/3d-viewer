declare module "@jscad/stl-serializer" {
  export function serialize(options: any, objects: any[]): any[]
}

declare module "*.wasm?inline-base64" {
  const content: string
  export default content
}

declare module "*.wasm" {
  // Prevent direct import of WASM files without ?inline-base64
  // This will throw at runtime if someone tries to import a .wasm file directly
  const _err: never
  export default _err
}
