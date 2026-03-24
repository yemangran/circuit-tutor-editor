import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

const voltageSourceSymbol = (
  <svg width="64" height="42" viewBox="0 0 64 42" fill="none" aria-hidden="true">
    <line x1="2" y1="21" x2="14" y2="21" stroke="#0f172a" strokeWidth="2" />
    <line x1="50" y1="21" x2="62" y2="21" stroke="#0f172a" strokeWidth="2" />
    <circle cx="32" cy="21" r="18" stroke="#0f172a" strokeWidth="2" fill="#fff" />
    <line x1="32" y1="10" x2="32" y2="18" stroke="#0f172a" strokeWidth="2" />
    <line x1="28" y1="14" x2="36" y2="14" stroke="#0f172a" strokeWidth="2" />
    <line x1="28" y1="28" x2="36" y2="28" stroke="#0f172a" strokeWidth="2" />
  </svg>
)

export function VoltageSourceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={voltageSourceSymbol}
      handles={[
        { id: 'positive', position: Position.Left },
        { id: 'negative', position: Position.Right },
      ]}
    />
  )
}
