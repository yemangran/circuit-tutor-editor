# Codex Task Prompt — Implement Plan A: Explicit Junction Component

## CONTEXT

You are continuing development on the existing project:

- repo: `yemangran/circuit-tutor-editor`

This project is a circuit editor for circuit analysis education.

Core goal:
1. Users draw circuits visually
2. The editor exports AI-friendly structured JSON
3. The exported JSON must preserve circuit semantics for KCL/KVL reasoning

Important:
- Do NOT redesign the system from scratch
- Extend the existing architecture
- Follow current docs:
  - `docs/tech-design-v2.md`
  - `docs/component-matrix.md`
  - `docs/export-schema.md`

Do NOT use deprecated `docs/tech-design.md`.

---

## NEW REQUIREMENT

Implement **Plan A** for explicit node/junction support.

### Why
In circuit analysis, especially for **parallel branches**, users need to represent a real circuit node where 3 or more wires meet.

Example:

```text
       R1
        |
--------●-------- R2
        |
       I1
```

That middle `●` is not just geometry.
 It is a **semantic circuit node** used for:

- KCL equations
- node naming (`Va`, `Vx`, etc.)
- clearer circuit export for LLM reasoning

The current model can resolve connected pins into nodes, but it does **not fully support an explicit drawable junction object**.

We need to implement that now.

## SOLUTION TO IMPLEMENT

Add a new component kind:

- `junction`

This should be a **real component** in the editor.

### Behavior

- It renders as a small visible node dot
- Multiple wires can connect to it
- All its pins are internally conductive
- It can be named by the user (e.g. `Va`)
- Its resolved node label must propagate into exported JSON
- It should work with the existing Union-Find based node resolution system

------

## IMPLEMENTATION REQUIREMENTS

### 1. Update types

File:

- `src/features/circuit-editor/types/circuit.ts`

Add `junction` to `ComponentKind`.

No other breaking redesign unless necessary.

------

### 2. Update component templates

File:

- `src/features/circuit-editor/componentTemplates.ts`

Add a template for `junction`.

Suggested shape:

- `kind: 'junction'`
- `displayName: 'Junction'`
- `labelPrefix: 'J'`
- `pins: ['n', 's', 'e', 'w', 'x1', 'x2']`
- `defaultParameters: {}`
- `defaultRotation: 0`

Notes:

- Fixed 6 pins is acceptable for v1
- This is better than trying to support arbitrary wire-to-wire topology right now

------

### 3. Update node resolution logic

File:

- `src/features/circuit-editor/unionFind.ts`

This is the MOST IMPORTANT change.

Currently the system unions:

- wires
- conductive switch paths

You must also union all pins of a junction.

Add logic so that for every `junction` component:

- all its pins belong to the same internal conductive set

Equivalent behavior:

- `J1:n`
- `J1:s`
- `J1:e`
- `J1:w`
- `J1:x1`
- `J1:x2`

must all resolve to the same node label.

Implementation approach:

- add a helper similar to switch conduction logic
- for `junction`, union all pins to the first pin

Pseudo idea:

```ts
if (component.kind === 'junction') {
  const pinKeys = component.pins.map((pin) => makePinKey(component.id, pin))
  for (let i = 1; i < pinKeys.length; i++) {
    unionFind.union(pinKeys[0], pinKeys[i])
  }
}
```

Make this fit the current architecture cleanly.

------

### 4. Add React Flow node component

Create a new node UI for junction.

Suggested new file:

- `src/features/circuit-editor/components/nodes/JunctionNode.tsx`

Requirements:

- visually render as a small circular node / dot
- show label if useful
- expose handles around the dot:
  - top / bottom / left / right
  - plus extra handles if needed (`x1`, `x2`)
- must be consistent with existing node component system

Then register it in:

- `src/features/circuit-editor/components/nodes/index.ts`
- wherever `nodeTypes` is defined for React Flow

------

### 5. Add to palette

File:

- `src/features/circuit-editor/components/palette/ComponentPalette.tsx`

Add `junction` to the palette so user can:

- click to add
- drag to canvas

Also provide a hint label like:

- `NODE`
   or
- `J`

Keep it consistent with the current palette style.

------

### 6. Property panel support

File:

- `src/features/circuit-editor/components/panel/PropertyPanel.tsx`

Make sure users can:

- select a junction
- rename it
- assign a named node label to one of its pins (or just use the current named-node mechanism)

Important:
 The existing named-node flow appears to be pin-based.

That is acceptable for now.

Example:

- if user sets `Va` on `J1:n`
- and the junction internally unions all pins
- then the whole resolved node should become `Va`

So:

- do NOT invent a whole new naming system unless needed
- just make sure junction works with the current named-node model

------

### 7. Canvas integration

File:

- `src/features/circuit-editor/components/canvas/CircuitCanvas.tsx`

Update:

- `nodeTypes`
- node rendering
- any connection assumptions if needed

Make sure the junction can participate in normal React Flow connections just like other components.

------

### 8. Export behavior

Files:

- `src/features/circuit-editor/resolveNodes.ts`
- `src/features/circuit-editor/exportCircuit.ts`

Desired result:

- if multiple branches connect through a junction
- and the junction is named (or auto-resolved)
- all connected branches should export the same node label

The exported JSON does NOT necessarily need a special `junction` entry if it is semantically redundant,
 but the node list and component node mappings must correctly reflect the shared node.

Example target effect:

```json
{
  "components": [
    {
      "id": "R1",
      "nodes": ["Va", "N2"]
    },
    {
      "id": "R2",
      "nodes": ["Va", "N3"]
    },
    {
      "id": "I1",
      "nodes": ["Va", "GND"]
    }
  ],
  "nodes": [
    { "label": "Va", "kind": "user_named" }
  ]
}
```

That is the important part.

------

## DESIGN CONSTRAINTS

### Do

- extend current architecture
- reuse existing named node system
- keep the change minimal and compatible
- preserve export semantics

### Do NOT

- redesign wires to connect to wire midpoints
- implement true wire-to-wire graph editing
- replace the current Union-Find approach
- break existing components

This is a targeted enhancement.

------

## ACCEPTANCE CRITERIA

The feature is complete when all of the following are true:

1. User can add a `junction` from palette
2. Junction is visible on canvas as a small node dot
3. Multiple wires can connect to the junction
4. Internally, junction pins are conductive as one node
5. User can assign a node label such as `Va`
6. Exported JSON uses that node label for all branches connected through the junction
7. This works for a parallel-branch circuit with 3 or more branches meeting at one node

------

## DELIVERABLES

Please implement the code changes directly in the existing codebase.

After implementation, also provide:

1. a short summary of files changed
2. a simple manual test scenario
3. a sample exported JSON for a parallel-branch example using a junction
