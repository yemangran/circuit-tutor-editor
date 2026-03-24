import { create } from 'zustand'
import { componentTemplates, createComponentFromTemplate } from '../componentTemplates'
import {
  ControlRelation,
  CircuitDocument,
  CircuitComponent,
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

function getNextComponentIndex(
  components: CircuitComponent[],
  kind: ComponentKind,
) {
  const labelPrefix = componentTemplates[kind].labelPrefix
  const usedIndexes = new Set(
    components
      .filter(
        (component) => componentTemplates[component.kind].labelPrefix === labelPrefix,
      )
      .map((component) => Number(component.id.slice(labelPrefix.length)))
      .filter((value) => Number.isFinite(value) && value > 0),
  )

  let nextIndex = 1

  while (usedIndexes.has(nextIndex)) {
    nextIndex += 1
  }

  return nextIndex
}

function getNextComponentLabel(
  components: CircuitComponent[],
  kind: ComponentKind,
) {
  return `${componentTemplates[kind].labelPrefix}${getNextComponentIndex(components, kind)}`
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
  deleteComponent: (componentId: string) => void
  duplicateComponent: (
    componentId: string,
    position?: { x: number; y: number },
  ) => void
  updateComponentPosition: (
    componentId: string,
    position: { x: number; y: number },
  ) => void
  updateComponentRotation: (
    componentId: string,
    rotation: 0 | 90 | 180 | 270,
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
      const resolvedPosition =
        position ?? getDefaultComponentPosition(state.doc.components.length)
      const component = createComponentFromTemplate(
        kind,
        resolvedPosition,
        getNextComponentIndex(state.doc.components, kind),
      )

      return {
        doc: {
          ...state.doc,
          components: [...state.doc.components, component],
        },
      }
    }),
  deleteComponent: (componentId) =>
    set((state) => ({
      doc: {
        ...state.doc,
        components: state.doc.components.filter((component) => component.id !== componentId),
        wires: state.doc.wires.filter(
          (wire) =>
            wire.from.componentId !== componentId && wire.to.componentId !== componentId,
        ),
        namedNodes: state.doc.namedNodes.filter(
          (node) => !node.id.startsWith(`${componentId}:`),
        ),
        controlRelations: state.doc.controlRelations.filter(
          (relation) => relation.targetComponentId !== componentId,
        ),
        annotations: state.doc.annotations.filter(
          (annotation) =>
            annotation.targetComponentId !== componentId &&
            annotation.fromPinRef?.componentId !== componentId &&
            annotation.toPinRef?.componentId !== componentId &&
            annotation.positivePinRef?.componentId !== componentId &&
            annotation.negativePinRef?.componentId !== componentId,
        ),
        solveTargets: state.doc.solveTargets.filter(
          (target) => target.componentId !== componentId,
        ),
      },
      selectedComponentId:
        state.selectedComponentId === componentId ? null : state.selectedComponentId,
    })),
  duplicateComponent: (componentId, position) =>
    set((state) => {
      const sourceComponent = state.doc.components.find(
        (component) => component.id === componentId,
      )

      if (!sourceComponent) {
        return state
      }

      const nextLabel = getNextComponentLabel(state.doc.components, sourceComponent.kind)
      const nextPosition = position ?? {
        x: sourceComponent.position.x + 40,
        y: sourceComponent.position.y + 40,
      }

      return {
        doc: {
          ...state.doc,
          components: [
            ...state.doc.components,
            {
              ...sourceComponent,
              id: nextLabel,
              label: nextLabel,
              position: nextPosition,
              parameters: Object.fromEntries(
                Object.entries(sourceComponent.parameters).map(([key, value]) => [
                  key,
                  { ...value },
                ]),
              ),
              metadata: sourceComponent.metadata
                ? { ...sourceComponent.metadata }
                : undefined,
            },
          ],
        },
        selectedComponentId: nextLabel,
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
  updateComponentRotation: (componentId, rotation) =>
    set((state) => ({
      doc: {
        ...state.doc,
        components: state.doc.components.map((component) =>
          component.id === componentId ? { ...component, rotation } : component,
        ),
      },
    })),
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
