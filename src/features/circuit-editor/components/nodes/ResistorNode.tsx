import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

const resistorSymbol = (
  <svg width="76" height="22" viewBox="0 0 76 22" fill="none" aria-hidden="true">
    <path
      d="M2 11H12L18 4L26 18L34 4L42 18L50 4L58 18L64 11H74"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function ResistorNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={resistorSymbol}
      handles={[
        { id: 'a', position: Position.Left },
        { id: 'b', position: Position.Right },
      ]}
    />
  )
}
