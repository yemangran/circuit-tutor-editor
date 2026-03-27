import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function CurrentSourceSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  return (
    <svg width="64" height="42" viewBox="0 0 64 42" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotation} 32 21)`}>
        <line x1="2" y1="21" x2="14" y2="21" stroke="#0f172a" strokeWidth="2" />
        <line x1="50" y1="21" x2="62" y2="21" stroke="#0f172a" strokeWidth="2" />
        <circle cx="32" cy="21" r="18" stroke="#0f172a" strokeWidth="2" fill="#fff" />
        <line x1="25" y1="21" x2="39" y2="21" stroke="#0f172a" strokeWidth="2" />
        <path d="M34 16L39 21L34 26" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function CurrentSourceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<CurrentSourceSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'from', position: Position.Left },
        { id: 'to', position: Position.Right },
      ]}
    />
  )
}
