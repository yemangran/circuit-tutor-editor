# PRD - Circuit Tutor Editor

## 1. Background
Students learning circuit analysis often struggle to translate circuit diagrams into a format that AI can understand for problem solving.

## 2. Goal
Provide a visual editor where users can:
- Drag and connect circuit components
- Annotate current and voltage
- Export a structured JSON for AI analysis

## 3. Target Users
- Electrical engineering students
- Self-learners studying circuit analysis

## 4. Core Features (MVP)
### 4.1 Circuit Editing
- Drag & drop components: resistor, voltage source, current source, ground
- Connect components via wires
- Rotate and delete components

### 4.2 Parameter Editing
- Set values (Ohm, Volt, Ampere)
- Auto label components (R1, V1, I1)

### 4.3 Annotation
- Current direction arrows
- Voltage polarity markers

### 4.4 Validation
- Detect missing ground
- Detect unconnected pins

### 4.5 Export
- Export JSON format for AI

## 5. Data Output Example
```json
{
  "components": [
    {
      "id": "R1",
      "type": "resistor",
      "value": { "magnitude": 10, "unit": "Ohm" },
      "nodes": ["N1", "N2"]
    }
  ]
}
```

## 6. Non-Goals
- No circuit simulation (SPICE)
- No PCB design

## 7. Success Metrics
- Users can build simple circuits within 1 minute
- Export JSON usable by LLM for solving problems

## 8. Future Roadmap
- Auto-solve circuits
- Generate step-by-step solutions
- Import from images (OCR + AI)
