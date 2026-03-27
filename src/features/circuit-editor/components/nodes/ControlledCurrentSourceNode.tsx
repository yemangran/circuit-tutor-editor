import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function ControlledCurrentSourceSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  return (
    <svg width="68" height="42" viewBox="0 0 68 42" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotation} 34 21)`}>
        <line x1="2" y1="21" x2="16" y2="21" stroke="#0f172a" strokeWidth="2" />
        <line x1="52" y1="21" x2="66" y2="21" stroke="#0f172a" strokeWidth="2" />
        <path d="M34 4L50 21L34 38L18 21L34 4Z" stroke="#0f172a" strokeWidth="2" fill="#fff" />
        <line x1="27" y1="21" x2="40" y2="21" stroke="#0f172a" strokeWidth="2" />
        <path d="M35 16L40 21L35 26" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function ControlledCurrentSourceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<ControlledCurrentSourceSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'from', position: Position.Left },
        { id: 'to', position: Position.Right },
      ]}
    />
  )
}
