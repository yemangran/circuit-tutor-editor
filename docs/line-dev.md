Implement branch current semantics for the circuit editor.

We need three related features:

1. Set Branch Current Direction
- Let the user define a semantic current direction on a branch
- Show the direction as an arrow on canvas
- Allow reversing direction

2. Add Branch Current Label
- Let the user assign labels like I1, I2, ix to a branch current
- Show the label near the branch arrow

3. Set Known Branch Current
- Let the user specify a known current value such as I2 = 2A
- Also support unknown current values

Architecture requirement:
These three features should be represented by a single semantic object, for example:

type BranchCurrentAnnotation = {
  id: string
  type: 'branch_current'
  label: string
  fromNode: string
  toNode: string
  value?: {
    magnitude?: number | null
    unit?: string
    isUnknown?: boolean
  }
  targetWireIds?: string[]
}

Important:
- Do not treat this as a pure visual wire style
- This is circuit analysis semantics
- It must be included in exported AI-friendly JSON
- It should help KCL/KVL equation generation