import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function GroundSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotation} 22 17)`}>
        <line x1="22" y1="2" x2="22" y2="12" stroke="#0f172a" strokeWidth="2" />
        <line x1="8" y1="14" x2="36" y2="14" stroke="#0f172a" strokeWidth="2" />
        <line x1="12" y1="20" x2="32" y2="20" stroke="#0f172a" strokeWidth="2" />
        <line x1="16" y1="26" x2="28" y2="26" stroke="#0f172a" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function GroundNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<GroundSymbol rotation={props.data.rotation} />}
      handles={[
        {
          id: 'gnd',
          position: Position.Top,
          style: { top: -6 },
        },
      ]}
    />
  )
}
