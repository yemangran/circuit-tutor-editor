import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { componentTemplates, createComponentFromTemplate } from '../componentTemplates'
import {
  BranchCurrentAnnotation,
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

type CircuitStoreState = {
  doc: CircuitDocument
  selectedComponentId: string | null
  selectedWireId: string | null
  selectComponent: (componentId: string | null) => void
  selectWire: (wireId: string | null) => void
  addComponent: (
    kind: ComponentKind,
    position?: { x: number; y: number },
  ) => void
  addWire: (from: WireEndpoint, to: WireEndpoint) => void
  clearCanvas: () => void
  deleteComponent: (componentId: string) => void
  deleteWire: (wireId: string) => void
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
  addComponentPin: (componentId: string) => void
  upsertBranchCurrentAnnotation: (
    wireId: string,
    patch?: Partial<Omit<BranchCurrentAnnotation, 'id' | 'type' | 'targetWireIds'>>,
  ) => void
  removeBranchCurrentAnnotation: (wireId: string) => void
  setNamedNode: (pinKey: string, label: string) => void
  removeNamedNode: (pinKey: string) => void
  upsertControlRelation: (
    targetComponentId: string,
    patch: Partial<Omit<ControlRelation, 'id' | 'targetComponentId'>>,
  ) => void
  removeControlRelation: (targetComponentId: string) => void
}

export const useCircuitStore = create<CircuitStoreState>()(
  persist(
    (set) => ({
  doc: createInitialDoc(),
  selectedComponentId: null,
  selectedWireId: null,
  selectComponent: (componentId) =>
    set({ selectedComponentId: componentId, selectedWireId: null }),
  selectWire: (wireId) => set({ selectedWireId: wireId, selectedComponentId: null }),
  addComponent: (kind, position) =>
    set((state) => {
      let resolvedPosition =
        position ?? getDefaultComponentPosition(state.doc.components.length)

      // Junction components snap to grid intersections (center point)
      if (kind === 'junction') {
        const gridSize = 20
        const junctionHalfSize = 14 // 28x28 节点的一半

        // 计算中心点
        const centerX = resolvedPosition.x + junctionHalfSize
        const centerY = resolvedPosition.y + junctionHalfSize

        // 将中心点吸附到网格交点
        const snappedCenterX = Math.round(centerX / gridSize) * gridSize
        const snappedCenterY = Math.round(centerY / gridSize) * gridSize

        // 计算新的 position（左上角坐标）
        resolvedPosition = {
          x: snappedCenterX - junctionHalfSize,
          y: snappedCenterY - junctionHalfSize,
        }
      }

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
    set((state) => {
      const removedWireIds = new Set(
        state.doc.wires
          .filter(
            (wire) =>
              wire.from.componentId === componentId || wire.to.componentId === componentId,
          )
          .map((wire) => wire.id),
      )

      return {
        doc: {
          ...state.doc,
          components: state.doc.components.filter((component) => component.id !== componentId),
          wires: state.doc.wires.filter((wire) => !removedWireIds.has(wire.id)),
          namedNodes: state.doc.namedNodes.filter(
            (node) => !node.id.startsWith(`${componentId}:`),
          ),
          controlRelations: state.doc.controlRelations.filter(
            (relation) => relation.targetComponentId !== componentId,
          ),
          annotations: state.doc.annotations.filter(
            (annotation) =>
              !(
                annotation.type === 'branch_current' &&
                annotation.targetWireIds.some((wireId) => removedWireIds.has(wireId))
              ) &&
              ('targetComponentId' in annotation
                ? annotation.targetComponentId !== componentId
                : true) &&
              ('fromPinRef' in annotation
                ? annotation.fromPinRef?.componentId !== componentId
                : true) &&
              ('toPinRef' in annotation
                ? annotation.toPinRef?.componentId !== componentId
                : true) &&
              ('positivePinRef' in annotation
                ? annotation.positivePinRef?.componentId !== componentId
                : true) &&
              ('negativePinRef' in annotation
                ? annotation.negativePinRef?.componentId !== componentId
                : true),
          ),
          solveTargets: state.doc.solveTargets.filter(
            (target) => target.componentId !== componentId,
          ),
        },
        selectedComponentId:
          state.selectedComponentId === componentId ? null : state.selectedComponentId,
        selectedWireId:
          state.selectedWireId && removedWireIds.has(state.selectedWireId)
            ? null
            : state.selectedWireId,
      }
    }),
  deleteWire: (wireId) =>
    set((state) => ({
      doc: {
        ...state.doc,
        wires: state.doc.wires.filter((wire) => wire.id !== wireId),
        annotations: state.doc.annotations.filter(
          (annotation) =>
            annotation.type !== 'branch_current' ||
            !annotation.targetWireIds.includes(wireId),
        ),
      },
      selectedWireId: state.selectedWireId === wireId ? null : state.selectedWireId,
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
      let nextPosition = position ?? {
        x: sourceComponent.position.x + 40,
        y: sourceComponent.position.y + 40,
      }

      // Junction components snap to grid intersections (center point)
      if (sourceComponent.kind === 'junction') {
        const gridSize = 20
        const junctionHalfSize = 14 // 28x28 节点的一半

        // 计算中心点
        const centerX = nextPosition.x + junctionHalfSize
        const centerY = nextPosition.y + junctionHalfSize

        // 将中心点吸附到网格交点
        const snappedCenterX = Math.round(centerX / gridSize) * gridSize
        const snappedCenterY = Math.round(centerY / gridSize) * gridSize

        // 计算新的 position（左上角坐标）
        nextPosition = {
          x: snappedCenterX - junctionHalfSize,
          y: snappedCenterY - junctionHalfSize,
        }
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
        selectedWireId: null,
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
  addComponentPin: (componentId) =>
    set((state) => {
      const component = state.doc.components.find((item) => item.id === componentId)

      if (!component || component.kind !== 'junction') {
        return state
      }

      const nextPinId = component.pins.includes('s')
        ? `x${component.pins.filter((pinId) => /^x\d+$/.test(pinId)).length + 1}`
        : 's'

      if (component.pins.includes(nextPinId)) {
        return state
      }

      return {
        doc: {
          ...state.doc,
          components: state.doc.components.map((item) =>
            item.id === componentId
              ? {
                  ...item,
                  pins: [...item.pins, nextPinId],
                }
              : item,
          ),
        },
      }
    }),
  upsertBranchCurrentAnnotation: (wireId, patch) =>
    set((state) => {
      const wire = state.doc.wires.find((item) => item.id === wireId)

      if (!wire) {
        return state
      }

      const existing = state.doc.annotations.find(
        (annotation): annotation is BranchCurrentAnnotation =>
          annotation.type === 'branch_current' && annotation.targetWireIds.includes(wireId),
      )

      const nextAnnotation: BranchCurrentAnnotation = {
        id: existing?.id ?? `BC${state.doc.annotations.length + 1}`,
        type: 'branch_current',
        label: existing?.label ?? wireId.replace(/^W/, 'I'),
        fromPinRef: existing?.fromPinRef ?? wire.from,
        toPinRef: existing?.toPinRef ?? wire.to,
        value: existing?.value,
        targetWireIds: [wireId],
        ...patch,
      }

      return {
        doc: {
          ...state.doc,
          annotations: existing
            ? state.doc.annotations.map((annotation) =>
                annotation.id === existing.id ? nextAnnotation : annotation,
              )
            : [...state.doc.annotations, nextAnnotation],
        },
      }
    }),
  removeBranchCurrentAnnotation: (wireId) =>
    set((state) => ({
      doc: {
        ...state.doc,
        annotations: state.doc.annotations.filter(
          (annotation) =>
            annotation.type !== 'branch_current' ||
            !annotation.targetWireIds.includes(wireId),
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
        selectedWireId: wire.id,
      }
    }),
  clearCanvas: () =>
    set({
      doc: createInitialDoc(),
      selectedComponentId: null,
      selectedWireId: null,
    }),
    }),
    {
      name: 'circuit-tutor-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        doc: state.doc,
      }),
    },
  ),
)
