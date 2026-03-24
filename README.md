# Circuit Tutor Editor

一个面向电路分析学习者的可视化编辑器，支持拖拽组件、连接电路、编辑参数，并导出结构化 JSON 供 AI 分析解题。

> 让电路分析学习更简单，从画图到解题只需一键导出。

## 项目介绍

Circuit Tutor Editor 是一款专为电气工程学生和自学电路分析的用户设计的可视化工具。

### 核心功能

- **可视化编辑**：通过拖拽方式快速搭建电路图
- **组件丰富**：支持电阻、电源、电容、电感、开关等多种元件
- **参数配置**：灵活设置元件参数值和单位
- **AI 友好**：导出结构化 JSON，可直接用于 LLM 电路分析
- **实时验证**：自动检测未接地、未连接引脚等问题

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.3.0 | 前端框架 |
| TypeScript | ^5.4.5 | 类型系统 |
| Vite | ^5.2.0 | 构建工具 |
| React Flow | ^11.10.4 | 可视化画布 |
| Zustand | ^5.0.3 | 状态管理 |
| Zod | ^3.24.1 | 数据验证 |
| i18next | ^25.10.9 | 国际化 |

## 功能清单

| 功能名称 | 功能说明 | 状态 | 更新时间 |
|---------|---------|------|----------|
| 基础组件 | 电阻、电压源、电流源、接地 | ✅ 已完成 | 2026-03-24 |
| 储能元件 | 电容、电感 | ✅ 已完成 | 2026-03-24 |
| 受控源 | 电压控制源、电流控制源 | ✅ 已完成 | 2026-03-24 |
| 开关元件 | SPST、SPDT 开关 | ✅ 已完成 | 2026-03-24 |
| 通用负载 | 未知设备占位 | ✅ 已完成 | 2026-03-24 |
| 连线系统 | 引脚连接、自动节点识别 | ✅ 已完成 | 2026-03-24 |
| 参数编辑 | 数值、单位、标签编辑 | ✅ 已完成 | 2026-03-24 |
| JSON 导出 | AI 友好的结构化导出 | ✅ 已完成 | 2026-03-24 |
| 电路验证 | 接地检测、连接检查 | ✅ 已完成 | 2026-03-24 |
| 国际化 | 中英文切换 | ✅ 已完成 | 2026-03-24 |

## 安装说明

### 环境要求

- Node.js 16+
- pnpm 8+ (推荐)

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/your-username/circuit-tutor-editor.git

# 进入目录
cd circuit-tutor-editor

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 使用说明

### 快速开始

1. 从左侧组件面板拖拽元件到画布
2. 点击元件引脚并拖动连线到其他引脚
3. 选中元件在右侧属性面板编辑参数
4. 点击导出按钮获取 JSON

### 支持的组件

| 组件类型 | 引脚数 | 说明 |
|---------|-------|------|
| 电阻 (Resistor) | 2 | 可设置阻值 |
| 电压源 (Voltage Source) | 2 | 直流电压源 |
| 电流源 (Current Source) | 2 | 直流电流源 |
| 电容 (Capacitor) | 2 | 储能元件 |
| 电感 (Inductor) | 2 | 储能元件 |
| 接地 (Ground) | 1 | 参考节点 |
| 开关 SPST | 2 | 单刀单掷 |
| 开关 SPDT | 3 | 单刀双掷 |
| 受控电压源 | 2+2 | 电压控制 |
| 受控电流源 | 2+2 | 电流控制 |

### 导出示例

```json
{
  "components": [
    {
      "id": "R1",
      "type": "resistor",
      "value": { "magnitude": 10, "unit": "Ohm" },
      "nodes": ["N1", "N2"]
    }
  ],
  "nodes": [...],
  "annotations": [...],
  "solveTargets": [...]
}
```

## 项目结构

```
circuit-tutor-editor/
├── src/
│   ├── features/
│   │   └── circuit-editor/
│   │       ├── components/         # React 组件
│   │       │   ├── canvas/         # 画布区域
│   │       │   ├── nodes/          # 元件节点
│   │       │   ├── palette/        # 组件面板
│   │       │   └── panel/          # 属性面板
│   │       ├── store/              # Zustand 状态管理
│   │       └── types/              # TypeScript 类型定义
│   ├── i18n/                       # 国际化配置
│   ├── App.tsx                     # 根组件
│   └── main.tsx                    # 入口文件
├── docs/                           # 项目文档
│   ├── PRD.md                      # 产品需求文档
│   ├── tech-design-v2.md           # 技术设计文档
│   ├── component-matrix.md         # 组件矩阵
│   └── export-schema.md            # 导出格式规范
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 文档地址

- [产品需求文档 (PRD)](./docs/PRD.md)
- [技术设计文档](./docs/tech-design-v2.md)
- [组件矩阵](./docs/component-matrix.md)
- [导出格式规范](./docs/export-schema.md)

## 开发指南

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

### 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 状态管理使用 Zustand
- 类型定义统一放在 `types/` 目录

## 常见问题

<details>
<summary>如何添加新的电路元件？</summary>

1. 在 `src/features/circuit-editor/types/circuit.ts` 添加元件类型
2. 在 `src/features/circuit-editor/componentTemplates.ts` 添加模板
3. 在 `src/features/circuit-editor/components/nodes/` 创建节点组件
4. 在组件面板注册新元件

</details>

<details>
<summary>导出的 JSON 格式可以自定义吗？</summary>

导出格式遵循 `docs/export-schema.md` 规范，这是为了确保与 AI 分析工具的兼容性。如有特殊需求，可修改 `exportCircuit.ts` 中的导出逻辑。

</details>

<details>
<summary>支持电路仿真吗？</summary>

目前不支持 SPICE 仿真。本项目专注于**结构 → 语义 → 导出**的流程，为 AI 分析提供准确的电路结构化数据。

</details>

## 技术交流群

欢迎加入技术交流群，分享使用心得和建议！

## 作者联系

- **微信**: laohaibao2025
- **邮箱**: 75271002@qq.com

## 打赏

如果这个项目对你有帮助，欢迎请我喝杯咖啡 ☕

## 项目统计

### 代码统计

| 语言 | 文件数 | 代码行数 |
|------|-------|---------|
| TypeScript | 20+ | ~2000 |
| CSS | 2 | ~200 |

### 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1.0 | 2026-03-24 | 初始版本，支持基础电路编辑和导出 |

## 路线图

### 计划功能

- [ ] 电路自动求解（集成 AI）
- [ ] 分步解题过程展示
- [ ] 图片导入识别（OCR + AI）
- [ ] 更多电路分析功能

### 优化项

- [ ] 性能优化（大型电路）
- [ ] 移动端适配
- [ ] 深色模式

## License

[MIT](LICENSE) © Circuit Tutor Editor

## Star History

如果觉得项目不错，欢迎点个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/circuit-tutor-editor&type=Date)](https://star-history.com/#your-username/circuit-tutor-editor&Date)
