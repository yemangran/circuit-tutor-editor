export type ComponentKind =
  | 'resistor'
  | 'conductance'
  | 'capacitor'
  | 'inductor'
  | 'voltage_source'
  | 'current_source'
  | 'controlled_voltage_source'
  | 'controlled_current_source'
  | 'generic_load'
  | 'switch_spst'
  | 'switch_spdt'
  | 'junction'
  | 'ground'

export type PinName = string

export type ParameterValue = {
  magnitude?: number | null
  unit?: string
  expression?: string | null
  isUnknown?: boolean
}

export type CircuitComponent = {
  id: string
  kind: ComponentKind
  label: string
  pins: PinName[]
  parameters: Record<string, ParameterValue>
  position: { x: number; y: number }
  rotation: 0 | 90 | 180 | 270
  metadata?: {
    state?: string
  }
}

export type WireEndpoint = {
  componentId: string
  pinId: string
}

export type CircuitWire = {
  id: string
  from: WireEndpoint
  to: WireEndpoint
}

export type NamedNode = {
  id: string
  label: string
  position: { x: number; y: number }
}

export type Annotation = {
  id: string
  type: 'current_arrow' | 'voltage_polarity'
  label: string
  targetComponentId?: string
  fromPinRef?: WireEndpoint
  toPinRef?: WireEndpoint
  positivePinRef?: WireEndpoint
  negativePinRef?: WireEndpoint
}

export type ControlRelation = {
  id: string
  targetComponentId: string
  mode: 'VCVS' | 'VCCS' | 'CCVS' | 'CCCS'
  controlType: 'voltage' | 'current'
  control: Record<string, unknown>
  gain: ParameterValue
}

export type SolveTarget = {
  targetType: 'component_parameter' | 'branch_current' | 'node_voltage'
  componentId?: string
  nodeLabel?: string
  quantity: 'power' | 'current' | 'voltage' | 'resistance' | 'conductance'
  symbol?: string
}

export type CircuitDocument = {
  components: CircuitComponent[]
  wires: CircuitWire[]
  annotations: Annotation[]
  namedNodes: NamedNode[]
  controlRelations: ControlRelation[]
  solveTargets: SolveTarget[]
  meta: {
    title: string
    description?: string
  }
}
