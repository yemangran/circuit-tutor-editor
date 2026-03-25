Implement a complete ASCII export feature for the existing circuit editor.

Project context:
- This is a circuit editor for circuit analysis education.
- The project already supports semantic circuit export to JSON.
- We now need a high-quality ASCII export that is easier for weaker LLMs and humans to read.

Core goal:
Build an ASCII export engine that converts the semantic circuit model into a readable schematic-style ASCII diagram.

IMPORTANT:
This feature is NOT a simple text summary.
It should generate a structured ASCII schematic with horizontal/vertical wires, visible junctions, and component blocks.

==================================================
LATEST ASCII EXPORT RULES (ONLY FOLLOW THESE)
==================================================

1. ASCII output must be generated from the semantic circuit model, NOT from raw React Flow geometry.

Required pipeline:
doc -> resolveNodes -> exportCircuit -> exportAscii

2. Component endpoint pins are INTERNAL ONLY.
Do NOT render component pins or internal endpoint node labels in the ASCII diagram.

Examples of things that must NOT appear as visible node labels:
- resistor pin a/b
- voltage source positive/negative
- current source from/to
- auto-generated internal pin endpoints unless they are explicitly meaningful junctions

3. ONLY explicitly meaningful analysis nodes should be rendered in ASCII.

Visible nodes in ASCII are limited to:
- user-added junction nodes
- ground
- explicitly named visible analysis nodes

4. Junction nodes are the key visible node concept.
A junction represents a real circuit-analysis node where multiple branches meet.

Rendering rule:
- Unnamed junction: render as "+"
- Named junction: render the junction clearly and show its label nearby or inline
- Junctions are the only normal nodes that should appear in the ASCII diagram

5. ASCII output should prioritize:
- topology readability
- branch clarity
- KCL/KVL usefulness
- deterministic rendering

Do NOT prioritize:
- pixel-perfect resemblance to canvas
- arbitrary freeform layout reproduction

6. Component labels and values should be readable in the diagram.

Examples:
- resistor: [R1:5Ω] or [5Ω]
- voltage source: [V1:60V]
- current source: [I1:3A↑]
- generic load: [X2:N]
- capacitor: [C1:5uF]
- inductor: [L1:2H]
- switch: [S1:open]

7. The engine must support branch current semantics when available.

If branch current annotation exists, render it in ASCII in a readable way.

Examples:
- I2 ->
- [I2:2A→]
- branch annotation near corresponding branch

8. The engine must support horizontal and vertical wiring using ASCII characters.

Preferred characters:
- horizontal wire: ─
- vertical wire: │
- junction: +
- optional node label text near junction

9. The output should look like a circuit schematic, not a bullet list.

Target style example:

        R1(5Ω)              X1(10V,+left-right)
N2 ──────[5Ω]────── + ────[10V]──── -
│                   │                │
[V1:60V]         [I1:3A↑]        [X2:N]
(+N2,-N3)          │                │
│                  N1              N4
│                   │                │
N3 ──────[R2:10Ω]──N1    N1──[R3:2Ω]──N4

The engine does NOT need to reproduce this exact layout,
but it should aim for this level of schematic readability.

==================================================
IMPLEMENTATION REQUIREMENTS
==================================================

Create or update an ASCII export module.

Suggested file:
src/features/circuit-editor/exportAscii.ts

You may split into helper modules if needed, for example:
- ascii/normalizeAsciiGraph.ts
- ascii/layoutAsciiGraph.ts
- ascii/routeAsciiEdges.ts
- ascii/renderAsciiGrid.ts
- ascii/componentAsciiTemplates.ts
- ascii/CharGrid.ts

==================================================
REQUIRED FUNCTIONS
==================================================

Implement at least:

1. exportAsciiDiagram(payload: ExportCircuitPayload): string

Optional helper:
2. exportAsciiSummary(payload: ExportCircuitPayload): string

Main focus is exportAsciiDiagram.

==================================================
ENGINE DESIGN REQUIREMENTS
==================================================

Use a layered architecture:

1. Normalize semantic payload into an ASCII graph
2. Build layout nodes and edges
3. Compute logical layout
4. Route orthogonal wires
5. Render into a character grid

==================================================
1. NORMALIZE ASCII GRAPH
==================================================

Convert semantic export into an internal graph suitable for ASCII layout.

Important:
- Components should become renderable component blocks
- Visible junctions should become visible graph anchors
- Internal component pins should remain hidden

Suggested internal concepts:

- VisibleNode
  - id
  - label
  - kind: junction | ground | named_node

- ComponentBlock
  - id
  - kind
  - label
  - textLines
  - connectedVisibleNodes

- BranchEdge
  - from visible node
  - to visible node
  - through component block

If necessary, model the graph as:
visible_node -> component_block -> visible_node

But do NOT expose hidden internal pins in final ASCII.

==================================================
2. COMPONENT RENDER TEMPLATES
==================================================

Define consistent render templates for each component kind.

Suggested examples:

- resistor:
  [R1:5Ω]

- conductance:
  [G1:2S]

- capacitor:
  [C1:5uF]

- inductor:
  [L1:2H]

- voltage_source:
  [V1:60V]

- current_source:
  [I1:3A↑]

- controlled_voltage_source:
  [E1:k=2]

- controlled_current_source:
  [F1:k=3]

- generic_load:
  [X1:N]

- switch_spst:
  [S1:open]
  [S1:closed]

- switch_spdt:
  [S2:A]
  [S2:B]

- ground:
  GND or ground marker style if appropriate

Support multi-line text blocks if useful.

==================================================
3. VISIBLE NODE RULES
==================================================

This is critical.

When deciding whether a node appears in ASCII:

Render ONLY if:
- it is a user-added junction
- it is ground
- it is an explicitly meaningful named analysis node intended for KCL/KVL

Do NOT render:
- raw component endpoint pins
- hidden internal topology nodes
- automatically resolved internal endpoint nodes that are not explicit junctions

In other words:
ASCII is a teaching-oriented view, not a raw graph dump.

==================================================
4. JUNCTION RENDERING RULES
==================================================

Junctions are important and should be emphasized.

Rules:
- unnamed junction -> render "+"
- named junction -> render "+" with label nearby, or render label inline if cleaner
- if a visible node has degree >= 3, it should be rendered clearly as a junction point

Examples:
───── + ─────
      │
      Va

or
───── Va ─────
      │

Use whichever is cleaner and more stable.

==================================================
5. LAYOUT STRATEGY
==================================================

Do NOT attempt a generic perfect graph layout engine.

Instead use a practical schematic-oriented strategy.

Recommended approach:
- identify a main horizontal backbone path
- place backbone elements left-to-right
- place side branches vertically
- place lower or upper return paths horizontally as needed

This should produce a readable schematic-style layout for common teaching circuits.

The layout must be deterministic.

==================================================
6. WIRE ROUTING
==================================================

Wires must be orthogonal:
- horizontal only
- vertical only

Use:
- ─
- │
- +
for crossings/junctions as appropriate

Important:
- avoid routing through component text
- avoid routing through labels when possible
- junctions should merge cleanly

Do NOT implement freeform arbitrary path drawing.

==================================================
7. CHARACTER GRID RENDERER
==================================================

Implement a character grid renderer.

Suggested helper:
CharGrid class with methods like:
- write(x, y, text)
- drawHorizontalLine(x1, x2, y)
- drawVerticalLine(x, y1, y2)
- drawJunction(x, y)
- toString()

Need a merge strategy for overlapping chars:
- space + line = line
- horizontal + vertical = +
- line + junction = +
- text should override line only when intentional
- avoid corrupting component blocks

==================================================
8. BRANCH CURRENT ANNOTATIONS
==================================================

If branch-current semantic annotations exist, render them in ASCII.

Requirements:
- support current direction
- support label
- support known current value if present

Examples:
I2 ->
[I2:2A→]
(I2 = 2A, Va -> Vb)

Place them near the corresponding branch if possible.

These are semantic annotations, not just decoration.

==================================================
9. UI INTEGRATION
==================================================

Add an ASCII export option to the existing export flow.

Expected UX:
- user clicks export ASCII
- system generates ASCII diagram text
- show it in a modal, panel, or textarea
- allow copy to clipboard

Do NOT break existing JSON export.

==================================================
10. ACCEPTANCE CRITERIA
==================================================

The implementation is complete when:

1. ASCII export is generated from semantic data, not UI geometry
2. Internal component endpoint pins are hidden from ASCII output
3. Only explicit junction/ground/meaningful analysis nodes are shown
4. Junctions render clearly as "+"
5. Components render as readable ASCII blocks
6. Wires render orthogonally
7. Branch current annotations can appear in output
8. The result is substantially more readable for weaker LLMs than raw JSON

==================================================
11. DELIVERABLES
==================================================

After implementation, provide:

1. A short summary of files changed
2. A brief explanation of the ASCII export architecture
3. A sample ASCII output for a multi-branch circuit with at least:
   - resistor
   - voltage source
   - current source
   - junction
   - ground

==================================================
START IMPLEMENTATION
==================================================
