import { Position } from 'reactflow'

const JUNCTION_PIN_RADIUS = 20

type JunctionOffset = {
  x: number
  y: number
}

function getBaseJunctionOffset(pinId: string): JunctionOffset {
  if (pinId === 'n') {
    return { x: 0, y: -JUNCTION_PIN_RADIUS }
  }

  if (pinId === 's') {
    return { x: 0, y: JUNCTION_PIN_RADIUS }
  }

  if (pinId === 'e') {
    return { x: JUNCTION_PIN_RADIUS, y: 0 }
  }

  if (pinId === 'w') {
    return { x: -JUNCTION_PIN_RADIUS, y: 0 }
  }

  const extraIndex = Math.max(Number(pinId.slice(1)) - 1, 0)
  const side = extraIndex % 2 === 0 ? -1 : 1
  const row = Math.floor(extraIndex / 2)

  return {
    x: side * JUNCTION_PIN_RADIUS,
    y: (row - 0.5) * 18,
  }
}

function rotateOffset(
  offset: JunctionOffset,
  rotation: 0 | 90 | 180 | 270,
): JunctionOffset {
  switch (rotation) {
    case 90:
      return { x: -offset.y, y: offset.x }
    case 180:
      return { x: -offset.x, y: -offset.y }
    case 270:
      return { x: offset.y, y: -offset.x }
    default:
      return offset
  }
}

function getPositionForOffset(offset: JunctionOffset): Position {
  if (Math.abs(offset.x) >= Math.abs(offset.y)) {
    return offset.x >= 0 ? Position.Right : Position.Left
  }

  return offset.y >= 0 ? Position.Bottom : Position.Top
}

export function getJunctionHandleLayout(
  pinId: string,
  rotation: 0 | 90 | 180 | 270,
) {
  const offset = rotateOffset(getBaseJunctionOffset(pinId), rotation)

  return {
    position: getPositionForOffset(offset),
    offset,
    style: {
      left: `calc(50% + ${offset.x}px)`,
      top: `calc(50% + ${offset.y}px)`,
      right: 'auto',
      bottom: 'auto',
    },
  }
}
