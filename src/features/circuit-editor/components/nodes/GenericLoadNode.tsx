import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function GenericLoadSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  return (
    <svg width="76" height="24" viewBox="0 0 76 24" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotation} 38 12)`}>
        <line x1="2" y1="12" x2="18" y2="12" stroke="#0f172a" strokeWidth="2" />
        <rect x="18" y="3" width="40" height="18" rx="3" stroke="#0f172a" strokeWidth="2" fill="#fff" />
        <path d="M31 8L45 16M45 8L31 16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        <line x1="58" y1="12" x2="74" y2="12" stroke="#0f172a" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function GenericLoadNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<GenericLoadSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'a', position: Position.Left },
        { id: 'b', position: Position.Right },
      ]}
    />
  )
}
