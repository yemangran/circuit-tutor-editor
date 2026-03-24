import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

const switchSpstSymbol = (
  <svg width="76" height="24" viewBox="0 0 76 24" fill="none" aria-hidden="true">
    <line x1="2" y1="16" x2="24" y2="16" stroke="#0f172a" strokeWidth="2" />
    <circle cx="24" cy="16" r="2.5" fill="#0f172a" />
    <circle cx="52" cy="8" r="2.5" fill="#0f172a" />
    <line x1="26" y1="14.5" x2="49" y2="9.5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <line x1="52" y1="8" x2="74" y2="8" stroke="#0f172a" strokeWidth="2" />
  </svg>
)

export function SwitchSPSTNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={switchSpstSymbol}
      handles={[
        { id: 'a', position: Position.Left },
        { id: 'b', position: Position.Right },
      ]}
    />
  )
}
