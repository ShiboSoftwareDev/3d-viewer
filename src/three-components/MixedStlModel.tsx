import { useEffect, useState } from "react"
import { Euler, Vector3 } from "three"
import { MTLLoader, OBJLoader } from "three-stdlib"

export function MixedStlModel({
  url,
  position,
  rotation,
}: {
  url: string
  position?: Vector3 | [number, number, number]
  rotation?: Euler | [number, number, number]
}) {
  // const group = useLoader(OBJLoader, url)
  // const materials = useLoader(MTLLoader, url)
  // const obj = useLoader(OBJLoader, url)

  const [obj, setObj] = useState<any | null>(null)
  useEffect(() => {
    async function loadUrlContent() {
      const response = await fetch(url)
      const text = await response.text()

      // Extract all the sections of the file that have newmtl...endmtl to
      // separate into mtlContent and objContent

      const mtlContent = text
        .match(/newmtl[\s\S]*?endmtl/g)
        ?.join("\n")!
        .replace(/d 0\./g, "d 1.")!
      const objContent = text.replace(/newmtl[\s\S]*?endmtl/g, "")

      const mtlLoader = new MTLLoader()
      mtlLoader.setMaterialOptions({
        invertTrProperty: true,
      })
      const materials = mtlLoader.parse(mtlContent, "test.mtl")

      const objLoader = new OBJLoader()
      objLoader.setMaterials(materials)
      setObj(objLoader.parse(objContent))
    }
    loadUrlContent()
  }, [url])

  return (
    <group rotation={rotation} position={position}>
      {obj && <primitive object={obj} />}
    </group>
  )
}
