import { CadViewer } from "src/CadViewer"
import type { Meta, StoryObj } from "@storybook/react"
import { Circuit } from "@tscircuit/core"
import myObjUrl2 from "./myObj2.obj"
import myObjUrl from "./myObj.obj"

const meta = {
  title: "Tests/Simple Story Test",
  component: CadViewer,
} satisfies Meta<typeof CadViewer>

export default meta
type Story = StoryObj<typeof meta>

const createTestCircuit = () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="R1" footprint="0603" cadModel={{ objUrl: myObjUrl2 }} />
      <chip
        name="R2"
        footprint="0603"
        pcbY={3}
        cadModel={{ objUrl: myObjUrl }}
      />
      <chip
        name="R3"
        footprint="0603"
        pcbX={3}
        pcbRotation={90}
        cadModel={{ objUrl: myObjUrl }}
      />
      <chip
        name="R4"
        footprint="0603"
        pcbX={-3}
        layer={"bottom"}
        cadModel={{ objUrl: myObjUrl }}
      />
    </board>,
  )
  return circuit.getCircuitJson()
}

export const Default: Story = {
  args: {
    circuitJson: createTestCircuit() as any,
  },
}
