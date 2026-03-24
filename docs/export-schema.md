# Export Schema (AI-friendly JSON)

## Goal
Provide a structured representation of circuits that LLMs can reliably understand for circuit analysis tasks.

---

## Top-level Structure

```json
{
  "components": [],
  "nodes": [],
  "annotations": [],
  "controlRelations": [],
  "solveTargets": [],
  "meta": {}
}
```

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

This schema is optimized for:
- KCL / KVL reasoning
- Node voltage method
- Mesh current method
- Power calculations

Not intended for:
- SPICE simulation
- transient analysis
