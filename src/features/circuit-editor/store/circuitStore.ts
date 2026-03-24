import { create } from 'zustand'
import { CircuitDocument, CircuitComponent, CircuitWire } from '../types/circuit'

const initialDoc: CircuitDocument = {
  components: [],
  wires: [],
  annotations: [],
  namedNodes: [],
  controlRelations: [],
  solveTargets: [],
  meta: { title: 'Untitled Circuit' }
}

export const useCircuitStore = create<{
  doc: CircuitDocument
  addComponent: (c: CircuitComponent) => void
  addWire: (w: CircuitWire) => void
}>((set) => ({
  doc: initialDoc,
  addComponent: (c) => set((s) => ({ doc: { ...s.doc, components: [...s.doc.components, c] } })),
  addWire: (w) => set((s) => ({ doc: { ...s.doc, wires: [...s.doc.wires, w] } }))
}))
