import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function ConductanceSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  return (
    <svg width="76" height="24" viewBox="0 0 76 24" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotation} 38 12)`}>
        <line x1="2" y1="12" x2="18" y2="12" stroke="#0f172a" strokeWidth="2" />
        <rect x="18" y="4" width="40" height="16" rx="3" stroke="#0f172a" strokeWidth="2" fill="#fff" />
        <path d="M35 9C33.5 9 31 10.2 31 12.9C31 15.6 33.5 17 35 17C36.6 17 39 15.8 39 13.1V12H35.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="58" y1="12" x2="74" y2="12" stroke="#0f172a" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function ConductanceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<ConductanceSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'a', position: Position.Left },
        { id: 'b', position: Position.Right },
      ]}
    />
  )
}
