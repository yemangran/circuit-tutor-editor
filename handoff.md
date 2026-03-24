# Codex Handoff Prompt — Circuit Tutor Editor

## ROLE

You are a senior frontend + systems engineer working on a circuit editor product.

Your job is to CONTINUE implementation of an existing project.

You MUST:
- Follow the existing architecture
- Extend the system (not redesign from scratch)
- Prioritize correctness of circuit semantics over UI polish

---

## PROJECT OVERVIEW

This project is:

👉 A circuit editor for circuit analysis education

Core goal:
1. Users draw circuits visually
2. System exports AI-friendly structured JSON
3. JSON is used by LLMs for solving circuit problems

---

## IMPORTANT: WHAT THIS PROJECT IS NOT

- NOT a SPICE simulator
- NOT a PCB design tool
- NOT a physics engine

👉 Only focus:
**Structure → semantics → export**

---

## CURRENT TECH STACK

- React
- TypeScript
- Vite
- React Flow (canvas)
- Zustand (state)
- Zod (validation)

---

## CURRENT CODE STATUS

### Already implemented:

1. Basic project setup (React + Vite)
2. Type system (`types/circuit.ts`)
3. Zustand store (basic)
4. React Flow canvas (empty)
5. Core architecture defined in docs

---

## SOURCE OF TRUTH (IMPORTANT)

You MUST follow these docs:

- docs/tech-design-v2.md
- docs/component-matrix.md
- docs/export-schema.md

DO NOT use:
- docs/tech-design.md (deprecated)

---

## CORE ARCHITECTURE PRINCIPLE

👉 Universal Component Model

Every component is defined as:

Component = pins + parameters + state + controlRelations + topology rules

This is CRITICAL.

---

## SUPPORTED COMPONENTS (MANDATORY)

You MUST support ALL of these:

- resistor
- conductance
- capacitor
- inductor
- voltage_source
- current_source
- controlled_voltage_source
- controlled_current_source
- generic_load (unknown device)
- switch_spst
- switch_spdt
- ground

---

## CORE DATA MODEL (ALREADY DEFINED)

File:
src/features/circuit-editor/types/circuit.ts

Includes:

- CircuitComponent
- CircuitWire
- NamedNode
- ControlRelation
- SolveTarget
- CircuitDocument

---

## CORE ENGINE REQUIREMENTS

You MUST implement or extend:

### 1. Node Resolution

- Use Union-Find
- Inputs:
  - components
  - wires
  - switch states
- Rules:
  - wires connect pins
  - ground → GND
  - SPST:
    - closed → connect pins
    - open → no connection
  - SPDT:
    - state A → common ↔ throwA
    - state B → common ↔ throwB
  - named nodes override naming

---

### 2. Export JSON

Must match:

docs/export-schema.md

Include:

- components
- nodes
- annotations
- controlRelations
- solveTargets
- meta

---

## CURRENT UI STATUS

File:
src/features/circuit-editor/components/canvas/CircuitCanvas.tsx

Currently:
- React Flow initialized
- nodes = []
- edges = []

👉 Needs to be connected to store

---

## YOUR TASK (VERY IMPORTANT)

Continue implementation to make the editor usable.

---

## TASK BREAKDOWN

### TASK 1 — Connect Store to Canvas

- Map:
  - CircuitComponent → React Flow node
  - CircuitWire → React Flow edge

---

### TASK 2 — Implement Node Components

Create React Flow custom nodes:

- ResistorNode
- VoltageSourceNode
- CurrentSourceNode
- GroundNode
- CapacitorNode
- InductorNode
- ConductanceNode
- GenericLoadNode
- ControlledVoltageSourceNode
- ControlledCurrentSourceNode
- SwitchSPSTNode
- SwitchSPDTNode

Each must:

- Render label
- Have correct number of handles (pins)
- Support connections

---

### TASK 3 — Implement Handles

Each component must expose handles based on pins:

Examples:

- resistor → 2 handles
- ground → 1 handle
- SPDT → 3 handles

---

### TASK 4 — Add Component Creation

Implement a simple palette:

- Click to add component
- Auto-generate:
  - id
  - label
  - pins
  - parameters
- Insert into Zustand store

---

### TASK 5 — Wire Creation

- React Flow edge → CircuitWire
- Persist in store

---

### TASK 6 — Property Panel (Basic)

Allow editing:

- label
- parameters (value + unit)
- switch state
- node label (later)

---

### TASK 7 — Export Button

- Call exportCircuit(doc)
- Display JSON
- Copy button

---

## CONSTRAINTS

- Do NOT redesign architecture
- Do NOT remove types
- Do NOT simplify component system
- Do NOT drop support for any listed component

---

## PRIORITY ORDER

1. Make canvas interactive
2. Support basic components (R, V, I, GND)
3. Enable wiring
4. Enable export
5. Then extend to full component set

---

## SUCCESS CRITERIA

User can:

1. Add components
2. Connect wires
3. See nodes rendered
4. Export valid JSON

---

## FINAL NOTE

This system is NOT a drawing tool.

👉 It is a:

**Circuit → Structured Language → AI reasoning pipeline**

Accuracy of structure > UI beauty.

---

## START IMPLEMENTATION
