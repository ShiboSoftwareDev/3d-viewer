import type { AnySoupElement } from "@tscircuit/soup"
import { useConvertChildrenToSoup } from "./hooks/use-convert-children-to-soup"
import { su } from "@tscircuit/soup-util"
import { useMemo, useState } from "react"
import { createBoardGeomFromSoup } from "./soup-to-3d"
import { useStlsFromGeom } from "./hooks/use-stls-from-geom"
import { STLModel } from "./three-components/STLModel"
import { CadViewerContainer } from "./CadViewerContainer"
import { MixedStlModel } from "./three-components/MixedStlModel"
import { Euler } from "three"
import { JscadModel } from "./three-components/JscadModel"
import { Footprinter3d } from "jscad-electronics"
import { FootprinterModel } from "./three-components/FootprinterModel"
import { tuple } from "./utils/tuple"

interface Props {
  soup?: AnySoupElement[]
  children?: any
}

export const CadViewer = ({ soup, children }: Props) => {
  const [hoveredComponent, setHoveredComponent] = useState<{
    id: string | null
    name: string | null
    mousePosition: [number, number, number] | null
  }>({
    id: null,
    name: null,
    mousePosition: null,
  })
  soup ??= useConvertChildrenToSoup(children, soup) as any

  if (!soup) return null

  const boardGeom = useMemo(() => {
    if (!soup.some((e) => e.type === "pcb_board")) return null
    return createBoardGeomFromSoup(soup)
  }, [soup])

  const { stls, loading } = useStlsFromGeom(boardGeom)

  const cad_components = su(soup).cad_component.list()

  const handleHover = (
    componentId: string | null,
    componentName?: string,
    mousePosition?: [number, number, number],
  ) => {
    setHoveredComponent({
      id: componentId,
      name: componentName || null,
      mousePosition: mousePosition || null,
    })
  }

  return (
    <CadViewerContainer hoveredComponent={hoveredComponent}>
      {stls.map(({ stlUrl, color }, index) => (
        <STLModel
          key={stlUrl}
          stlUrl={stlUrl}
          color={color}
          opacity={index === 0 ? 0.95 : 1}
        />
      ))}
      {cad_components.map((cad_component) => {
        const componentName = su(soup).source_component.getUsing({
          source_component_id: cad_component.source_component_id,
        })?.name
        const url = cad_component.model_obj_url ?? cad_component.model_stl_url
        const rotationOffset = cad_component.rotation
          ? tuple(
              (cad_component.rotation.x * Math.PI) / 180,
              (cad_component.rotation.y * Math.PI) / 180,
              (cad_component.rotation.z * Math.PI) / 180,
            )
          : undefined

        if (url) {
          return (
            <MixedStlModel
              key={cad_component.cad_component_id}
              url={url}
              position={
                cad_component.position
                  ? [
                      cad_component.position.x,
                      cad_component.position.y,
                      cad_component.position.z,
                    ]
                  : undefined
              }
              rotation={rotationOffset}
              componentId={cad_component.cad_component_id}
              name={componentName || cad_component.cad_component_id}
              onHover={handleHover}
              isHovered={hoveredComponent.id === cad_component.cad_component_id}
            />
          )
        }

        if (cad_component.model_jscad) {
          return (
            <JscadModel
              key={cad_component.cad_component_id}
              jscadPlan={cad_component.model_jscad as any}
              rotationOffset={rotationOffset}
              componentId={cad_component.cad_component_id}
              name={componentName || cad_component.cad_component_id}
              onHover={handleHover}
              isHovered={hoveredComponent.id === cad_component.cad_component_id}
            />
          )
        }

        if (cad_component.footprinter_string) {
          return (
            <FootprinterModel
              positionOffset={
                cad_component.position
                  ? [
                      cad_component.position.x,
                      cad_component.position.y,
                      cad_component.position.z,
                    ]
                  : undefined
              }
              rotationOffset={rotationOffset}
              footprint={cad_component.footprinter_string}
              componentId={cad_component.cad_component_id}
              name={componentName || cad_component.cad_component_id}
              onHover={handleHover}
              isHovered={hoveredComponent.id === cad_component.cad_component_id}
            />
          )
        }
      })}
    </CadViewerContainer>
  )
}
