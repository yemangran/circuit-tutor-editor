import type {
  CircuitComponent,
  ComponentKind,
  ParameterValue,
  PinName,
} from './types/circuit'

export type ComponentTemplate = {
  kind: ComponentKind
  displayName: string
  labelPrefix: string
  pins: PinName[]
  defaultParameters: Record<string, ParameterValue>
  defaultState?: string
  defaultRotation?: 0 | 90 | 180 | 270
}

const createKnownParameter = (unit: string): ParameterValue => ({
  magnitude: null,
  unit,
})

const createUnknownParameter = (unit: string): ParameterValue => ({
  magnitude: null,
  unit,
  isUnknown: true,
})

const cloneParameters = (
  parameters: Record<string, ParameterValue>,
): Record<string, ParameterValue> => {
  const cloned: Record<string, ParameterValue> = {}

  for (const key in parameters) {
    cloned[key] = { ...parameters[key] }
  }

  return cloned
}

export const componentTemplates: Record<ComponentKind, ComponentTemplate> = {
  resistor: {
    kind: 'resistor',
    displayName: 'Resistor',
    labelPrefix: 'R',
    pins: ['a', 'b'],
    defaultParameters: {
      resistance: createKnownParameter('Ohm'),
    },
    defaultRotation: 0,
  },
  conductance: {
    kind: 'conductance',
    displayName: 'Conductance',
    labelPrefix: 'G',
    pins: ['a', 'b'],
    defaultParameters: {
      conductance: createKnownParameter('S'),
    },
    defaultRotation: 0,
  },
  capacitor: {
    kind: 'capacitor',
    displayName: 'Capacitor',
    labelPrefix: 'C',
    pins: ['a', 'b'],
    defaultParameters: {
      capacitance: createKnownParameter('F'),
    },
    defaultRotation: 0,
  },
  inductor: {
    kind: 'inductor',
    displayName: 'Inductor',
    labelPrefix: 'L',
    pins: ['a', 'b'],
    defaultParameters: {
      inductance: createKnownParameter('H'),
    },
    defaultRotation: 0,
  },
  voltage_source: {
    kind: 'voltage_source',
    displayName: 'Voltage Source',
    labelPrefix: 'V',
    pins: ['positive', 'negative'],
    defaultParameters: {
      voltage: createKnownParameter('V'),
    },
    defaultRotation: 0,
  },
  current_source: {
    kind: 'current_source',
    displayName: 'Current Source',
    labelPrefix: 'I',
    pins: ['from', 'to'],
    defaultParameters: {
      current: createKnownParameter('A'),
    },
    defaultRotation: 0,
  },
  controlled_voltage_source: {
    kind: 'controlled_voltage_source',
    displayName: 'Controlled Voltage Source',
    labelPrefix: 'E',
    pins: ['positive', 'negative'],
    defaultParameters: {
      gain: {
        magnitude: null,
      },
    },
    defaultRotation: 0,
  },
  controlled_current_source: {
    kind: 'controlled_current_source',
    displayName: 'Controlled Current Source',
    labelPrefix: 'F',
    pins: ['from', 'to'],
    defaultParameters: {
      gain: {
        magnitude: null,
      },
    },
    defaultRotation: 0,
  },
  generic_load: {
    kind: 'generic_load',
    displayName: 'Generic Load',
    labelPrefix: 'X',
    pins: ['a', 'b'],
    defaultParameters: {
      resistance: createUnknownParameter('Ohm'),
      voltage: createUnknownParameter('V'),
      current: createUnknownParameter('A'),
      power: createUnknownParameter('W'),
    },
    defaultRotation: 0,
  },
  switch_spst: {
    kind: 'switch_spst',
    displayName: 'SPST Switch',
    labelPrefix: 'S',
    pins: ['a', 'b'],
    defaultParameters: {},
    defaultState: 'open',
    defaultRotation: 0,
  },
  switch_spdt: {
    kind: 'switch_spdt',
    displayName: 'SPDT Switch',
    labelPrefix: 'S',
    pins: ['common', 'throwA', 'throwB'],
    defaultParameters: {},
    defaultState: 'A',
    defaultRotation: 0,
  },
  junction: {
    kind: 'junction',
    displayName: 'Junction',
    labelPrefix: 'J',
    pins: ['n', 'e', 'w'],
    defaultParameters: {},
    defaultRotation: 0,
  },
  ground: {
    kind: 'ground',
    displayName: 'Ground',
    labelPrefix: 'GND',
    pins: ['gnd'],
    defaultParameters: {},
    defaultRotation: 0,
  },
}

export function createComponentFromTemplate(
  kind: ComponentKind,
  position: { x: number; y: number },
  index = 1,
): CircuitComponent {
  const template = componentTemplates[kind]
  const label = `${template.labelPrefix}${index}`

  return {
    id: label,
    kind,
    label,
    pins: [...template.pins],
    parameters: cloneParameters(template.defaultParameters),
    position,
    rotation: template.defaultRotation ?? 0,
    ...(template.defaultState
      ? {
          metadata: {
            state: template.defaultState,
          },
        }
      : {}),
  }
}
