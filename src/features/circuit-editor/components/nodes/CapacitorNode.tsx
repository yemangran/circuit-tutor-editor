import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

const capacitorSymbol = (
  <svg width="76" height="24" viewBox="0 0 76 24" fill="none" aria-hidden="true">
    <line x1="2" y1="12" x2="28" y2="12" stroke="#0f172a" strokeWidth="2" />
    <line x1="30" y1="4" x2="30" y2="20" stroke="#0f172a" strokeWidth="2.4" />
    <line x1="46" y1="4" x2="46" y2="20" stroke="#0f172a" strokeWidth="2.4" />
    <line x1="48" y1="12" x2="74" y2="12" stroke="#0f172a" strokeWidth="2" />
  </svg>
)

export function CapacitorNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={capacitorSymbol}
      handles={[
        { id: 'a', position: Position.Left },
        { id: 'b', position: Position.Right },
      ]}
    />
  )
}
