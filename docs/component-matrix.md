# Component Capability Matrix

目标：定义 v1 支持的全部元器件的统一能力（pins/参数/状态/控制/拓扑）。

## 通用约定
- 所有元件由 **pins + parameters + (optional) state + (optional) controlRelations** 构成
- 节点通过解析 pins 连通性得到

## 列说明
- pins：端口列表（数量与名称）
- parameters：参数键（允许 unknown）
- state：是否有内部状态（影响拓扑）
- control：是否存在受控关系
- topology：是否影响节点连通（内部导通规则）

---

## Passive 2-terminal

### Resistor
- pins: a, b
- parameters: resistance (Ohm)
- state: none
- control: no
- topology: passive_2_terminal

### Conductance
- pins: a, b
- parameters: conductance (S)
- state: none
- control: no
- topology: passive_2_terminal

### Capacitor
- pins: a, b
- parameters: capacitance (F)
- state: optional (initial voltage)
- control: no
- topology: passive_2_terminal

### Inductor
- pins: a, b
- parameters: inductance (H)
- state: optional (initial current)
- control: no
- topology: passive_2_terminal

### Generic Load (未知用电器)
- pins: a, b
- parameters: resistance/voltage/current/power (allowUnknown)
- state: none
- control: no
- topology: passive_2_terminal

---

## Independent Sources

### Voltage Source
- pins: positive, negative
- parameters: voltage (V)
- state: none
- control: no
- topology: source_2_terminal

### Current Source
- pins: from, to
- parameters: current (A)
- state: none
- control: no
- topology: source_2_terminal

---

## Controlled Sources

### Controlled Voltage Source
- pins: positive, negative
- parameters: gain
- state: none
- control: yes (voltage/current)
- topology: source_2_terminal

### Controlled Current Source
- pins: from, to
- parameters: gain
- state: none
- control: yes (voltage/current)
- topology: source_2_terminal

---

## Switches

### SPST Switch
- pins: a, b
- parameters: none
- state: open | closed
- control: no
- topology: conditional_conduction
  - closed: a ↔ b 导通
  - open: 不导通

### SPDT Switch
- pins: common, throwA, throwB
- parameters: none
- state: A | B
- control: no
- topology: conditional_conduction
  - state A: common ↔ throwA
  - state B: common ↔ throwB

---

## Ground

### Ground
- pins: gnd
- parameters: none
- state: none
- control: no
- topology: fixed (node=GND)

---

## Annotations（非元件）

### Current Arrow
- target: component or branch
- fields: fromNode, toNode, label

### Voltage Polarity
- target: component
- fields: positiveNode, negativeNode, label

---

## Notes
- 所有元件均通过模板注册
- 开关/受控源会影响节点解析逻辑
- v1 目标：能画 + 能导出，不做仿真
