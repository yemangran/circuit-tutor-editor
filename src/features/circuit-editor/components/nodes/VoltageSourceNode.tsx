import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function VoltageSourceSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  const isVertical = rotation === 90 || rotation === 270
  const isPositiveForward = rotation === 0 || rotation === 90
  const positiveOffset = isPositiveForward ? -7 : 7
  const negativeOffset = -positiveOffset

  return (
    <svg width="64" height="42" viewBox="0 0 64 42" fill="none" aria-hidden="true">
      {isVertical ? (
        <>
          <line x1="32" y1="2" x2="32" y2="10" stroke="#0f172a" strokeWidth="2" />
          <line x1="32" y1="32" x2="32" y2="40" stroke="#0f172a" strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="2" y1="21" x2="14" y2="21" stroke="#0f172a" strokeWidth="2" />
          <line x1="50" y1="21" x2="62" y2="21" stroke="#0f172a" strokeWidth="2" />
        </>
      )}
      <circle cx="32" cy="21" r="18" stroke="#0f172a" strokeWidth="2" fill="#fff" />
      {isVertical ? (
        <>
          <line
            x1="32"
            y1={21 + positiveOffset - 4}
            x2="32"
            y2={21 + positiveOffset + 4}
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1="28"
            y1={21 + positiveOffset}
            x2="36"
            y2={21 + positiveOffset}
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1="28"
            y1={21 + negativeOffset}
            x2="36"
            y2={21 + negativeOffset}
            stroke="#0f172a"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <line
            x1={32 + positiveOffset}
            y1="17"
            x2={32 + positiveOffset}
            y2="25"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1={28 + positiveOffset}
            y1="21"
            x2={36 + positiveOffset}
            y2="21"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1={28 + negativeOffset}
            y1="21"
            x2={36 + negativeOffset}
            y2="21"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  )
}

export function VoltageSourceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<VoltageSourceSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'positive', position: Position.Left },
        { id: 'negative', position: Position.Right },
      ]}
    />
  )
}
