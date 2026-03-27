import { Position, type NodeProps } from 'reactflow'
import { BaseCircuitNode, type CircuitFlowNodeData } from './BaseCircuitNode'

function ControlledVoltageSourceSymbol({
  rotation,
}: {
  rotation: CircuitFlowNodeData['rotation']
}) {
  const isVertical = rotation === 90 || rotation === 270
  const isPositiveForward = rotation === 0 || rotation === 90
  const positiveOffset = isPositiveForward ? -7 : 7
  const negativeOffset = -positiveOffset

  return (
    <svg width="68" height="42" viewBox="0 0 68 42" fill="none" aria-hidden="true">
      {isVertical ? (
        <>
          <line x1="34" y1="2" x2="34" y2="8" stroke="#0f172a" strokeWidth="2" />
          <line x1="34" y1="34" x2="34" y2="40" stroke="#0f172a" strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="2" y1="21" x2="16" y2="21" stroke="#0f172a" strokeWidth="2" />
          <line x1="52" y1="21" x2="66" y2="21" stroke="#0f172a" strokeWidth="2" />
        </>
      )}
      <path d="M34 4L50 21L34 38L18 21L34 4Z" stroke="#0f172a" strokeWidth="2" fill="#fff" />
      {isVertical ? (
        <>
          <line
            x1="34"
            y1={21 + positiveOffset - 4}
            x2="34"
            y2={21 + positiveOffset + 4}
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1="30"
            y1={21 + positiveOffset}
            x2="38"
            y2={21 + positiveOffset}
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1="30"
            y1={21 + negativeOffset}
            x2="38"
            y2={21 + negativeOffset}
            stroke="#0f172a"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <line
            x1={34 + positiveOffset}
            y1="17"
            x2={34 + positiveOffset}
            y2="25"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1={30 + positiveOffset}
            y1="21"
            x2={38 + positiveOffset}
            y2="21"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1={30 + negativeOffset}
            y1="21"
            x2={38 + negativeOffset}
            y2="21"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  )
}

export function ControlledVoltageSourceNode(props: NodeProps<CircuitFlowNodeData>) {
  return (
    <BaseCircuitNode
      {...props}
      symbol={<ControlledVoltageSourceSymbol rotation={props.data.rotation} />}
      handles={[
        { id: 'positive', position: Position.Left },
        { id: 'negative', position: Position.Right },
      ]}
    />
  )
}
