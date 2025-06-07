import React, { useEffect, useState, useMemo } from "react"
import type { AnyCircuitElement, CadComponent } from "circuit-json"
import { su } from "@tscircuit/soup-util"
import manifoldWasmBase64 from "manifold-3d/manifold.wasm?inline-base64"
import { CadViewerContainer } from "./CadViewerContainer"
import ManifoldModule from "manifold-3d"
import { useManifoldBoardBuilder } from "./hooks/useManifoldBoardBuilder"
import type { ManifoldToplevel } from "manifold-3d/manifold.d.ts"
import { AnyCadComponent } from "./AnyCadComponent"
import { ThreeErrorBoundary } from "./three-components/ThreeErrorBoundary"
import { Error3d } from "./three-components/Error3d"
import { createGeometryMeshes } from "./utils/manifold/create-three-geometry-meshes"
import { createTextureMeshes } from "./utils/manifold/create-three-texture-meshes"

interface CadViewerManifoldProps {
  circuitJson: AnyCircuitElement[]
  autoRotateDisabled?: boolean
  clickToInteractEnabled?: boolean
}

const CadViewerManifold: React.FC<CadViewerManifoldProps> = ({
  circuitJson,
  autoRotateDisabled,
  clickToInteractEnabled,
}) => {
  const [manifoldJSModule, setManifoldJSModule] =
    useState<ManifoldToplevel | null>(null)
  const [manifoldLoadingError, setManifoldLoadingError] = useState<
    string | null
  >(null)

  useEffect(() => {
    const initializeManifold = async () => {
      try {
        const base64ToUint8Array = (base64: string): Uint8Array => {
          const binaryString = atob(base64)
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          return bytes
        }
        const wasmBytes = base64ToUint8Array(manifoldWasmBase64)

        // Config for ManifoldModule factory, using embedded wasmBinary
        const factoryConfig = {
          wasmBinary: wasmBytes.buffer,
        }

        const loadedModule: ManifoldToplevel = await (ManifoldModule as any)(
          factoryConfig,
        )
        loadedModule.setup()
        setManifoldJSModule(loadedModule)
      } catch (error: any) {
        console.error("Failed to load or initialize Manifold module:", error)
        setManifoldLoadingError(
          `Failed to load or initialize Manifold module. Check console for details. Error: ${
            error.message || String(error)
          }`,
        )
      }
    }

    initializeManifold()
  }, [])

  const {
    geoms,
    textures,
    pcbThickness,
    error: builderError,
    isLoading: builderIsLoading,
    boardData,
  } = useManifoldBoardBuilder(manifoldJSModule, circuitJson)

  const geometryMeshes = useMemo(() => createGeometryMeshes(geoms), [geoms])
  const textureMeshes = useMemo(
    () => createTextureMeshes(textures, boardData, pcbThickness),
    [textures, boardData, pcbThickness],
  )

  const cadComponents = useMemo(
    () => (circuitJson ? su(circuitJson).cad_component.list() : []),
    [circuitJson],
  )

  const initialCameraPosition = useMemo(() => {
    if (!boardData) return [5, 5, 5] as const
    const { width = 0, height = 0 } = boardData
    const safeWidth = Math.max(width, 1)
    const safeHeight = Math.max(height, 1)
    const largestDim = Math.max(safeWidth, safeHeight, 5)
    return [largestDim * 0.75, largestDim * 0.75, largestDim * 0.75] as const
  }, [boardData])

  if (manifoldLoadingError) {
    return (
      <div
        style={{
          color: "red",
          padding: "1em",
          border: "1px solid red",
          margin: "1em",
        }}
      >
        Error: {manifoldLoadingError}
      </div>
    )
  }
  if (!manifoldJSModule) {
    return <div style={{ padding: "1em" }}>Loading Manifold module...</div>
  }
  if (builderError) {
    return (
      <div
        style={{
          color: "red",
          padding: "1em",
          border: "1px solid red",
          margin: "1em",
        }}
      >
        Error: {builderError}
      </div>
    )
  }
  if (builderIsLoading || !boardData || !geoms || !textures) {
    return <div style={{ padding: "1em" }}>Processing board geometry...</div>
  }

  return (
    <CadViewerContainer
      initialCameraPosition={initialCameraPosition}
      autoRotateDisabled={autoRotateDisabled}
      clickToInteractEnabled={clickToInteractEnabled}
    >
      {geometryMeshes.map((mesh, index) => (
        <primitive object={mesh} key={`${mesh.name}-${index}`} />
      ))}
      {textureMeshes.map((mesh, index) => (
        <primitive object={mesh} key={`${mesh.name}-${index}`} />
      ))}
      {cadComponents.map((cad_component: CadComponent) => (
        <ThreeErrorBoundary
          key={cad_component.cad_component_id}
          fallback={({ error }) => (
            <Error3d cad_component={cad_component} error={error} />
          )}
        >
          <AnyCadComponent
            cad_component={cad_component}
            circuitJson={circuitJson}
          />
        </ThreeErrorBoundary>
      ))}
    </CadViewerContainer>
  )
}

export default CadViewerManifold
