import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function InductorSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  return (
    <svg width="76" height="24" viewBox="0 0 76 24" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotation} 38 12)`}>
        <line x1="2" y1="12" x2="14" y2="12" stroke="#0f172a" strokeWidth="2" />
        <path
          d="M14 12C14 8.7 16.7 6 20 6C23.3 6 26 8.7 26 12C26 8.7 28.7 6 32 6C35.3 6 38 8.7 38 12C38 8.7 40.7 6 44 6C47.3 6 50 8.7 50 12C50 8.7 52.7 6 56 6C59.3 6 62 8.7 62 12"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="62" y1="12" x2="74" y2="12" stroke="#0f172a" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function InductorNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<InductorSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'a', position: Position.Left },
        { id: 'b', position: Position.Right },
      ]}
    />
  )
}
