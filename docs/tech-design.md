# Technical Design - Circuit Tutor Editor

## 1. Overview
This document defines the technical architecture for the MVP of Circuit Tutor Editor.

The product is a front-end circuit editor for circuit analysis coursework. Users can drag components onto a canvas, connect them with wires, add current direction and voltage polarity annotations, explicitly mark circuit nodes, and export AI-readable JSON.

The MVP focuses on **semantic correctness for circuit analysis**, not simulation or PCB design.

---

## 2. Technical Goals
- Make circuit structure easy to edit visually.
- Preserve a clear semantic model for AI export.
- Support course concepts including:
  - resistor
  - voltage source
  - current source
  - ground
  - current direction annotation
  - voltage polarity annotation
  - node labeling for KCL
- Resolve connectivity into named nodes such as `N1`, `N2`, and `GND`.
- Allow users to explicitly create and name nodes used in KCL equations.

---

## 3. Tech Stack
- **React**
- **TypeScript**
- **Vite**
- **React Flow** for canvas, nodes, and connections
- **Zustand** for editor state
- **Zod** for export validation

---

## 4. Architecture
The system is split into five layers:

### 4.1 Presentation Layer
Responsible for layout, side panels, toolbar, and editor interactions.

### 4.2 Canvas Layer
Responsible for rendering components, wires, and node markers on the React Flow canvas.

### 4.3 Semantic Model Layer
Stores the real circuit meaning independent of UI coordinates.

### 4.4 Analysis Layer
Resolves connections into circuit nodes and maps annotations to node names.

### 4.5 Export Layer
Converts the editor model into AI-readable JSON.

---

## 5. Directory Structure
```txt
src/
  features/
    circuit-editor/
      components/
        canvas/
          CircuitCanvas.tsx
          nodes/
            ResistorNode.tsx
            VoltageSourceNode.tsx
            CurrentSourceNode.tsx
            GroundNode.tsx
            CircuitNodeMarker.tsx
        inspector/
          PropertyPanel.tsx
        palette/
          PalettePanel.tsx
        toolbar/
          EditorToolbar.tsx
      core/
        unionFind.ts
        resolveNodes.ts
        exportCircuit.ts
        validateCircuit.ts
      store/
        circuitStore.ts
      types/
        circuit.ts
        export.ts
      utils/
        componentFactories.ts
```

---

## 6. Domain Model
The system must separate **editor objects** from **export objects**.

### 6.1 Editor Model
This is the source of truth used during editing.

```ts
export type ComponentType =
  | 'resistor'
  | 'voltage_source'
  | 'current_source'
  | 'ground'

export type AnnotationType =
  | 'current_arrow'
  | 'voltage_polarity'

export type UnitType = 'Ohm' | 'kOhm' | 'V' | 'A' | 'mA'

export type PinRole =
  | 'a'
  | 'b'
  | 'positive'
  | 'negative'
  | 'from'
  | 'to'
  | 'gnd'

export type Pin = {
  id: string
  role: PinRole
}

export type ValueSpec = {
  magnitude: number
  unit: UnitType
}

export type Component = {
  id: string
  type: ComponentType
  label: string
  value?: ValueSpec
  pins: Pin[]
  position: { x: number; y: number }
  rotation: 0 | 90 | 180 | 270
}

export type WireEndpoint = {
  componentId: string
  pinId: string
}

export type Wire = {
  id: string
  from: WireEndpoint
  to: WireEndpoint
}

export type Annotation = {
  id: string
  type: AnnotationType
  label: string
  targetComponentId?: string
  fromPinRef?: WireEndpoint
  toPinRef?: WireEndpoint
  positivePinRef?: WireEndpoint
  negativePinRef?: WireEndpoint
}

export type NamedNode = {
  id: string
  label: string
  position: { x: number; y: number }
  attachedPinRefs: WireEndpoint[]
}

export type CircuitDocument = {
  components: Component[]
  wires: Wire[]
  annotations: Annotation[]
  namedNodes: NamedNode[]
  meta: {
    title: string
    description?: string
  }
}
```

### 6.2 Why `namedNodes` are needed
The course requires explicit reasoning about nodes for KCL. Automatic node resolution alone is not enough.

Users must be able to:
- place a visible node marker on the canvas
- label a node such as `N1`, `Va`, `Vx`
- use the same node names when exporting JSON

This allows the exported structure to align with classroom notation.

---

## 7. Component Semantics
### 7.1 Resistor
Pins:
- `a`
- `b`

### 7.2 Voltage Source
Pins:
- `positive`
- `negative`

### 7.3 Current Source
Pins:
- `from`
- `to`

The `from -> to` semantic must represent the source arrow direction.

### 7.4 Ground
Pins:
- `gnd`

---

## 8. Current Direction and KCL Support
Current direction is a first-class concept in this product.

### 8.1 Requirements
- Users can add current arrows to branches or components.
- Current arrows are not decorative only; they must be exported semantically.
- Exported current direction must reference resolved nodes.
- This is required for LLM support when explaining KCL equations.

### 8.2 Modeling current arrows
```ts
export type CurrentArrowAnnotation = {
  id: string
  type: 'current_arrow'
  label: string
  targetComponentId: string
  fromPinRef: WireEndpoint
  toPinRef: WireEndpoint
}
```

### 8.3 KCL-oriented node labeling
For KCL workflows, node names should follow this rule priority:
1. If a connected group contains ground, its node name is `GND`.
2. If a connected group is associated with a user-defined named node, use that label.
3. Otherwise auto-generate sequential names such as `N1`, `N2`, `N3`.

This guarantees stable exports that match course notation.

---

## 9. Node Resolution Algorithm
The core algorithm resolves all pins into circuit nodes.

### 9.1 Input
- `components`
- `wires`
- `namedNodes`

### 9.2 Output
- map each pin to a node name
- map annotations to node names
- detect whether a node is ground or user-labeled

### 9.3 Approach
Use a **Union-Find / Disjoint Set** structure.

### 9.4 Steps
1. Register every component pin as a unique key.
   - Example: `R1:a`, `V1:positive`
2. Union connected pins using wires.
3. For each connected group:
   - if group contains `:gnd`, name it `GND`
   - else if it is attached to a user-created `namedNode`, use the user label
   - else assign `N1`, `N2`, ...
4. Build per-component node arrays.
5. Resolve annotation node references.

### 9.5 Pseudocode
```ts
function resolveCircuitNodes(doc: CircuitDocument) {
  const uf = new UnionFind()

  for (const component of doc.components) {
    for (const pin of component.pins) {
      uf.add(`${component.id}:${pin.id}`)
    }
  }

  for (const wire of doc.wires) {
    const a = `${wire.from.componentId}:${wire.from.pinId}`
    const b = `${wire.to.componentId}:${wire.to.pinId}`
    uf.union(a, b)
  }

  const groups = new Map<string, string[]>()

  for (const component of doc.components) {
    for (const pin of component.pins) {
      const key = `${component.id}:${pin.id}`
      const root = uf.find(key)
      if (!groups.has(root)) groups.set(root, [])
      groups.get(root)!.push(key)
    }
  }

  const rootToNodeName = new Map<string, string>()
  let nodeIndex = 1

  for (const [root, members] of groups.entries()) {
    const hasGround = members.some((m) => m.endsWith(':gnd'))
    if (hasGround) {
      rootToNodeName.set(root, 'GND')
      continue
    }

    const explicitNode = findExplicitNamedNodeForMembers(doc.namedNodes, members)
    if (explicitNode) {
      rootToNodeName.set(root, explicitNode.label)
      continue
    }

    rootToNodeName.set(root, `N${nodeIndex++}`)
  }

  return rootToNodeName
}
```

---

## 10. Export Model
The export format should be optimized for AI reasoning.

```ts
export type ExportedCircuit = {
  components: Array<{
    id: string
    type: 'resistor' | 'voltage_source' | 'current_source'
    value?: {
      magnitude: number
      unit: string
    }
    nodes: string[]
    polarity?: {
      positive: string
      negative: string
    }
    direction?: {
      from: string
      to: string
    }
  }>
  annotations: Array<{
    id: string
    type: 'current_arrow' | 'voltage_polarity'
    label: string
    targetComponent: string
    fromNode?: string
    toNode?: string
    positiveNode?: string
    negativeNode?: string
  }>
  nodes: Array<{
    label: string
    kind: 'ground' | 'user_named' | 'auto_generated'
  }>
  meta: {
    title: string
    groundNode: string
  }
}
```

### 10.1 Why export `nodes`
For KCL, the LLM should not infer the node set from components only. Explicit node export makes KCL prompts more reliable.

Example:
```json
{
  "nodes": [
    { "label": "Va", "kind": "user_named" },
    { "label": "Vb", "kind": "user_named" },
    { "label": "GND", "kind": "ground" }
  ]
}
```

---

## 11. Example Export
```json
{
  "components": [
    {
      "id": "R1",
      "type": "resistor",
      "value": { "magnitude": 10, "unit": "Ohm" },
      "nodes": ["Va", "Vb"]
    },
    {
      "id": "V1",
      "type": "voltage_source",
      "value": { "magnitude": 5, "unit": "V" },
      "nodes": ["Va", "GND"],
      "polarity": {
        "positive": "Va",
        "negative": "GND"
      }
    },
    {
      "id": "I1",
      "type": "current_source",
      "value": { "magnitude": 2, "unit": "A" },
      "nodes": ["Vb", "GND"],
      "direction": {
        "from": "Vb",
        "to": "GND"
      }
    }
  ],
  "annotations": [
    {
      "id": "IA1",
      "type": "current_arrow",
      "label": "i_R1",
      "targetComponent": "R1",
      "fromNode": "Va",
      "toNode": "Vb"
    }
  ],
  "nodes": [
    { "label": "Va", "kind": "user_named" },
    { "label": "Vb", "kind": "user_named" },
    { "label": "GND", "kind": "ground" }
  ],
  "meta": {
    "title": "KCL Example Circuit",
    "groundNode": "GND"
  }
}
```

---

## 12. Validation Rules
Validation must run before export.

### 12.1 Structural Validation
- circuit must contain at least one ground
- every non-ground component pin must be connected
- every resistor, voltage source, and current source must have a value
- no duplicate component labels
- no duplicate named node labels

### 12.2 Node Validation
- each named node must be attached to at least one resolved connection
- node labels must not conflict with reserved names unless intended
- `GND` is reserved for ground

### 12.3 Annotation Validation
- current arrows must have both direction endpoints
- voltage polarity markers must have both positive and negative endpoints
- target components must exist

---

## 13. UI Design Notes
### 13.1 Left Panel
Palette for:
- resistor
- voltage source
- current source
- ground
- current arrow
- voltage polarity
- node marker

### 13.2 Center Canvas
- React Flow canvas
- draggable components
- connectable handles
- visible node markers

### 13.3 Right Panel
Property editor for:
- component label
- value magnitude
- value unit
- node label
- annotation label
- rotation

### 13.4 Toolbar
- export JSON
- copy JSON
- reset canvas
- undo / redo (later)

---

## 14. State Management
Use a single Zustand store with editor actions.

```ts
export type CircuitStore = {
  doc: CircuitDocument
  selectedId: string | null

  addComponent: (type: ComponentType, position: { x: number; y: number }) => void
  updateComponent: (id: string, patch: Partial<Component>) => void
  deleteComponent: (id: string) => void

  addWire: (wire: Wire) => void
  deleteWire: (id: string) => void

  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void
  deleteAnnotation: (id: string) => void

  addNamedNode: (node: NamedNode) => void
  updateNamedNode: (id: string, patch: Partial<NamedNode>) => void
  deleteNamedNode: (id: string) => void

  exportJson: () => ExportedCircuit
}
```

---

## 15. MVP Delivery Order
### Step 1
- types
- union find
- node resolution
- export model

### Step 2
- React Flow canvas
- resistor / voltage source / current source / ground nodes

### Step 3
- current arrow annotation
- voltage polarity annotation
- named node marker

### Step 4
- validation
- export button
- copy to clipboard

---

## 16. Future Enhancements
- KCL equation helper generated from exported nodes
- branch grouping and mesh support
- image-to-circuit import
- LLM prompt templates for node-voltage method and mesh-current method
- SPICE netlist export
