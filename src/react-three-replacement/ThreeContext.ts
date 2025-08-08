import React, { createContext, useContext } from "react"
import * as THREE from "three"

export interface ThreeContextState {
  scene: THREE.Scene
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  rootObject: THREE.Object3D
  addFrameListener: (listener: (time: number, delta: number) => void) => void
  removeFrameListener: (listener: (time: number, delta: number) => void) => void
}

export const ThreeContext = createContext<ThreeContextState | null>(null)

export const useThree = () => {
  const context = useContext(ThreeContext)
  if (!context) {
    throw new Error("useThree must be used within a ThreeProvider")
  }
  return context
}

export const useFrame = (
  callback: (time: number, delta: number) => void,
  deps: React.DependencyList = [],
) => {
  const { addFrameListener, removeFrameListener } = useThree()
  React.useEffect(() => {
    addFrameListener(callback)
    return () => removeFrameListener(callback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFrameListener, removeFrameListener, ...deps])
}
