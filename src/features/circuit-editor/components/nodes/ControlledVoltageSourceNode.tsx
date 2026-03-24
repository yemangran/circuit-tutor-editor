import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

const controlledVoltageSourceSymbol = (
  <svg width="68" height="42" viewBox="0 0 68 42" fill="none" aria-hidden="true">
    <line x1="2" y1="21" x2="16" y2="21" stroke="#0f172a" strokeWidth="2" />
    <line x1="52" y1="21" x2="66" y2="21" stroke="#0f172a" strokeWidth="2" />
    <path d="M34 4L50 21L34 38L18 21L34 4Z" stroke="#0f172a" strokeWidth="2" fill="#fff" />
    <line x1="34" y1="12" x2="34" y2="19" stroke="#0f172a" strokeWidth="2" />
    <line x1="30" y1="15.5" x2="38" y2="15.5" stroke="#0f172a" strokeWidth="2" />
    <line x1="30" y1="27" x2="38" y2="27" stroke="#0f172a" strokeWidth="2" />
  </svg>
)

export function ControlledVoltageSourceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={controlledVoltageSourceSymbol}
      handles={[
        { id: 'positive', position: Position.Left },
        { id: 'negative', position: Position.Right },
      ]}
    />
  )
}
