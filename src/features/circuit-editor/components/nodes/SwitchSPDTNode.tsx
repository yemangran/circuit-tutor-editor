import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

const switchSpdtSymbol = (
  <svg width="78" height="38" viewBox="0 0 78 38" fill="none" aria-hidden="true">
    <line x1="2" y1="19" x2="24" y2="19" stroke="#0f172a" strokeWidth="2" />
    <circle cx="24" cy="19" r="2.5" fill="#0f172a" />
    <circle cx="54" cy="10" r="2.5" fill="#0f172a" />
    <circle cx="54" cy="28" r="2.5" fill="#0f172a" />
    <line x1="26" y1="17.8" x2="50.5" y2="11" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <line x1="54" y1="10" x2="76" y2="10" stroke="#0f172a" strokeWidth="2" />
    <line x1="54" y1="28" x2="76" y2="28" stroke="#0f172a" strokeWidth="2" />
  </svg>
)

export function SwitchSPDTNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={switchSpdtSymbol}
      handles={[
        { id: 'common', position: Position.Left },
        { id: 'throwA', position: Position.Right, style: { top: '30%' } },
        { id: 'throwB', position: Position.Right, style: { top: '72%' } },
      ]}
    />
  )
}
