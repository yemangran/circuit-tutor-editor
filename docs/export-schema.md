# Export Schema (AI-friendly JSON)

## Goal
Provide a structured representation of circuits that LLMs can reliably understand for circuit analysis tasks.

---

## Top-level Structure

```json
{
  "schemaVersion": "2",
  "rules": [],
  "components": [],
  "junctions": [],
  "nodes": [],
  "annotations": [],
  "controlRelations": [],
  "solveTargets": [],
  "meta": {}
}
```

---

## AI Parsing Guidance

- Read `schemaVersion` first and interpret the payload using that contract only.
- Reconstruct electrical connectivity from `components[].nodes` and `nodes[]`; do not infer connectivity from canvas geometry.
- Treat equal node labels as the same electrical node.
- Preserve the order of `components[].nodes`, because it matches the component pin order defined by the editor.
- Use `meta.groundNode = "GND"` as the reference node when present.
- Treat `junctions[]` as explicit user-drawn splice summaries for already-resolved nodes, not as extra components that create new connectivity.
- Treat `annotations[]`, `branchCurrents[]`, and `solveTargets[]` as semantic overlays on top of the resolved circuit, not as topology definitions.

---

## Components

```json
{
  "id": "R1",
  "kind": "resistor",
  "label": "R1",
  "nodes": ["N1", "N2"],
  "parameters": {
    "resistance": { "magnitude": 10, "unit": "Ohm" }
  }
}
```

### Special fields

#### Voltage source
```json
"polarity": {
  "positive": "N1",
  "negative": "GND"
}
```

#### Current source
```json
"direction": {
  "from": "N1",
  "to": "GND"
}
```

#### Switch
```json
"state": "open"
```

---

## Junctions

```json
{
  "id": "J1",
  "kind": "junction",
  "label": "J1",
  "node": "Va",
  "junctionType": "wire_splice",
  "connectedComponents": [
    {
      "componentId": "R1",
      "componentKind": "resistor",
      "componentLabel": "R1",
      "pinId": "b"
    }
  ]
}
```

Use `junctions[]` for explicit junction objects placed by the user in the editor.
In schema v2, each junction is exported as a node-level wire splice summary instead of a per-pin expansion.
The electrically-meaningful node identity still comes from `nodes[]` and each component's `nodes`.

---

## Nodes

```json
{
  "label": "Va",
  "kind": "user_named"
}
```

Kinds:
- ground
- user_named
- auto_generated

---

## Annotations

### Current arrow
```json
{
  "type": "current_arrow",
  "label": "i1",
  "fromNode": "N1",
  "toNode": "N2"
}
```

### Voltage polarity
```json
{
  "type": "voltage_polarity",
  "label": "u1",
  "positiveNode": "N1",
  "negativeNode": "N2"
}
```

---

## Control Relations

### Voltage-controlled
```json
{
  "target": "E1",
  "mode": "VCVS",
  "control": {
    "positiveNode": "N3",
    "negativeNode": "N4"
  },
  "gain": { "magnitude": 2 }
}
```

### Current-controlled
```json
{
  "target": "F1",
  "mode": "CCCS",
  "control": {
    "branch": "I_R1"
  },
  "gain": { "magnitude": 3 }
}
```

---

## Solve Targets (optional)

```json
{
  "targetType": "component_parameter",
  "componentId": "X1",
  "quantity": "power",
  "symbol": "P"
}
```

---

## Meta

```json
{
  "title": "Example Circuit",
  "groundNode": "GND"
}
```

---

## Design Principles

- Explicit > implicit
- Always include node list
- Always include direction/polarity when relevant
- Avoid requiring LLM to infer topology from geometry

---

## Notes

Schema versioning:
- `schemaVersion: "2"` marks the current junction export contract
- v2 junctions use `node` + `connectedComponents[]`
- v1-style `nodes` / `pinCount` / `pins[].connectedPins` is no longer emitted

This schema is optimized for:
- KCL / KVL reasoning
- Node voltage method
- Mesh current method
- Power calculations

Not intended for:
- SPICE simulation
- transient analysis
