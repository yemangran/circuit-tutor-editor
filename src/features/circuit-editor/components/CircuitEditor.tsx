import CircuitCanvas from './canvas/CircuitCanvas'
import { PropertyPanel } from './panel/PropertyPanel'
import { ComponentPalette } from './palette/ComponentPalette'

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: '260px minmax(0, 1fr) 320px',
  gap: 20,
  alignItems: 'start',
  minHeight: 0,
  height: '100%',
}

export default function CircuitEditor() {
  return (
    <div style={layoutStyle}>
      <ComponentPalette />
      <CircuitCanvas />
      <PropertyPanel />
    </div>
  )
}
