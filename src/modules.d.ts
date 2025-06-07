declare module "@jscad/stl-serializer" {
  export function serialize(options: any, objects: any[]): any[]
}

declare module "*.wasm?inline-base64" {
  const content: string
  export default content
}
