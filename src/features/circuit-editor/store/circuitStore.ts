import { create } from 'zustand'
import { componentTemplates, createComponentFromTemplate } from '../componentTemplates'
import {
  ControlRelation,
  CircuitDocument,
  ComponentKind,
  ParameterValue,
  CircuitWire,
  WireEndpoint,
} from '../types/circuit'

function createInitialDoc(): CircuitDocument {
  return {
    components: [],
    wires: [],
    annotations: [],
    namedNodes: [],
    controlRelations: [],
    solveTargets: [],
    meta: { title: 'Untitled Circuit' },
  }
}

const DEFAULT_COMPONENT_POSITION = {
  x: 120,
  y: 80,
}

function getDefaultComponentPosition(componentCount: number) {
  const column = componentCount % 4
  const row = Math.floor(componentCount / 4)

  return {
    x: DEFAULT_COMPONENT_POSITION.x + column * 180,
    y: DEFAULT_COMPONENT_POSITION.y + row * 120,
  }
}

export const useCircuitStore = create<{
  doc: CircuitDocument
  selectedComponentId: string | null
  selectComponent: (componentId: string | null) => void
  addComponent: (
    kind: ComponentKind,
    position?: { x: number; y: number },
  ) => void
  addWire: (from: WireEndpoint, to: WireEndpoint) => void
  clearCanvas: () => void
  updateComponentPosition: (
    componentId: string,
    position: { x: number; y: number },
  ) => void
  updateComponentLabel: (componentId: string, label: string) => void
  updateComponentParameter: (
    componentId: string,
    key: string,
    patch: Partial<ParameterValue>,
  ) => void
  updateComponentState: (componentId: string, state: string) => void
  setNamedNode: (pinKey: string, label: string) => void
  removeNamedNode: (pinKey: string) => void
  upsertControlRelation: (
    targetComponentId: string,
    patch: Partial<Omit<ControlRelation, 'id' | 'targetComponentId'>>,
  ) => void
  removeControlRelation: (targetComponentId: string) => void
}>((set) => ({
  doc: createInitialDoc(),
  selectedComponentId: null,
  selectComponent: (componentId) => set({ selectedComponentId: componentId }),
  addComponent: (kind, position) =>
    set((state) => {
      const labelPrefix = componentTemplates[kind].labelPrefix
      const nextIndex =
        state.doc.components.filter(
          (component) => componentTemplates[component.kind].labelPrefix === labelPrefix,
        ).length + 1
      const resolvedPosition =
        position ?? getDefaultComponentPosition(state.doc.components.length)
      const component = createComponentFromTemplate(kind, resolvedPosition, nextIndex)

      return {
        doc: {
          ...state.doc,
          components: [...state.doc.components, component],
        },
      }
    }),
  updateComponentPosition: (componentId, position) =>
    set((state) => {
      const currentComponent = state.doc.components.find(
        (component) => component.id === componentId,
      )

      if (
        currentComponent &&
        currentComponent.position.x === position.x &&
        currentComponent.position.y === position.y
      ) {
        return state
      }

      return {
        doc: {
          ...state.doc,
          components: state.doc.components.map((component) =>
            component.id === componentId ? { ...component, position } : component,
          ),
        },
      }
    }),
  updateComponentLabel: (componentId, label) =>
    set((state) => ({
      doc: {
        ...state.doc,
        components: state.doc.components.map((component) =>
          component.id === componentId ? { ...component, label } : component,
        ),
      },
    })),
  updateComponentParameter: (componentId, key, patch) =>
    set((state) => ({
      doc: {
        ...state.doc,
        components: state.doc.components.map((component) =>
          component.id === componentId
            ? {
                ...component,
                parameters: {
                  ...component.parameters,
                  [key]: {
                    ...component.parameters[key],
                    ...patch,
                  },
                },
              }
            : component,
        ),
      },
    })),
  updateComponentState: (componentId, stateValue) =>
    set((state) => ({
      doc: {
        ...state.doc,
        components: state.doc.components.map((component) =>
          component.id === componentId
            ? {
                ...component,
                metadata: {
                  ...component.metadata,
                  state: stateValue,
                },
              }
            : component,
        ),
      },
    })),
  setNamedNode: (pinKey, label) =>
    set((state) => {
      const componentId = pinKey.split(':')[0]
      const component = state.doc.components.find((item) => item.id === componentId)
      const position = component?.position ?? { x: 0, y: 0 }
      const existingNamedNode = state.doc.namedNodes.find((node) => node.id === pinKey)

      if (existingNamedNode) {
        return {
          doc: {
            ...state.doc,
            namedNodes: state.doc.namedNodes.map((node) =>
              node.id === pinKey ? { ...node, label, position } : node,
            ),
          },
        }
      }

      return {
        doc: {
          ...state.doc,
          namedNodes: [...state.doc.namedNodes, { id: pinKey, label, position }],
        },
      }
    }),
  removeNamedNode: (pinKey) =>
    set((state) => ({
      doc: {
        ...state.doc,
        namedNodes: state.doc.namedNodes.filter((node) => node.id !== pinKey),
      },
    })),
  upsertControlRelation: (targetComponentId, patch) =>
    set((state) => {
      const targetComponent = state.doc.components.find(
        (component) => component.id === targetComponentId,
      )
      const existing = state.doc.controlRelations.find(
        (relation) => relation.targetComponentId === targetComponentId,
      )
      const isVoltageControlledSource =
        targetComponent?.kind === 'controlled_voltage_source'
      const defaultMode: ControlRelation['mode'] =
        isVoltageControlledSource ? 'VCVS' : 'CCCS'
      const defaultControlType = isVoltageControlledSource ? 'voltage' : 'current'
      const defaultControl =
        defaultControlType === 'voltage'
          ? { positiveNode: '', negativeNode: '' }
          : { branch: '' }

      const nextRelation: ControlRelation = {
        id: existing?.id ?? `CR${state.doc.controlRelations.length + 1}`,
        targetComponentId,
        mode: existing?.mode ?? defaultMode,
        controlType: existing?.controlType ?? defaultControlType,
        control: existing?.control ?? defaultControl,
        gain: existing?.gain ?? targetComponent?.parameters.gain ?? { magnitude: null },
        ...patch,
      }

      return {
        doc: {
          ...state.doc,
          controlRelations: existing
            ? state.doc.controlRelations.map((relation) =>
                relation.targetComponentId === targetComponentId ? nextRelation : relation,
              )
            : [...state.doc.controlRelations, nextRelation],
        },
      }
    }),
  removeControlRelation: (targetComponentId) =>
    set((state) => ({
      doc: {
        ...state.doc,
        controlRelations: state.doc.controlRelations.filter(
          (relation) => relation.targetComponentId !== targetComponentId,
        ),
      },
    })),
  addWire: (from, to) =>
    set((state) => {
      const hasDuplicate = state.doc.wires.some(
        (wire) =>
          (wire.from.componentId === from.componentId &&
            wire.from.pinId === from.pinId &&
            wire.to.componentId === to.componentId &&
            wire.to.pinId === to.pinId) ||
          (wire.from.componentId === to.componentId &&
            wire.from.pinId === to.pinId &&
            wire.to.componentId === from.componentId &&
            wire.to.pinId === from.pinId),
      )

      if (hasDuplicate) {
        return state
      }

      const wire: CircuitWire = {
        id: `W${state.doc.wires.length + 1}`,
        from,
        to,
      }

      return {
        doc: {
          ...state.doc,
          wires: [...state.doc.wires, wire],
        },
      }
    }),
  clearCanvas: () =>
    set({
      doc: createInitialDoc(),
      selectedComponentId: null,
    }),
}))
