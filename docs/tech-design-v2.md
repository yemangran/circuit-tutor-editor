# Technical Design v2 - Universal Circuit Model

## Goal
Support full set of circuit analysis components and export AI-friendly JSON.

---

## Core Principle

👉 Component = pins + parameters + state + controlRelations

---

## Component Model

```ts
type Component = {
  id: string
  kind: string
  label: string
  pins: Pin[]
  parameters: Record<string, any>
  position: { x: number; y: number }
  rotation: number
  metadata?: {
    state?: string
  }
}
```

---

## Node Resolution

Node connectivity =
- wires
- switch states
- SPDT routing

---

## Switch Rules

SPST:
- closed → union
- open → no union

SPDT:
- state A → common ↔ throwA
- state B → common ↔ throwB

---

## Controlled Sources

Must use explicit control relations.

---

## Export Pipeline

```text
Editor → Resolve Nodes → Apply Rules → Export JSON
```

---

## Constraints

- no simulation
- no SPICE
- focus on structure

---

## Key Outcome

System can express full teaching circuits and feed them into LLM reliably.
