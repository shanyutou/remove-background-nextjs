# 项目学习指南

本指南帮助你逐步深入了解这个浏览器端 AI 背景移除项目。

## 学习路径

### 第一阶段：项目结构与配置
- [1.1 package.json 依赖分析](./01-project-structure.md#1-packagejson---依赖分析)
- [1.2 next.config.ts WASM 配置](./01-project-structure.md#2-nextconfigts---wasm-配置详解)
- [1.3 App 目录结构](./01-project-structure.md#3-app-目录结构)

### 第二阶段：UI 层
- [2.1 app/layout.tsx - 根布局和字体配置](./02-ui-layer.md#1-applayouttsx---根布局和字体配置)
- [2.2 app/globals.css - Tailwind CSS 4 配置](./02-ui-layer.md#2-appglobalscss---tailwind-css-4-配置)
- [2.3 shadcn/ui 组件实现模式](./02-ui-layer.md#3-shadcnui-组件实现模式)

### 第三阶段：核心业务逻辑
- [3.1 主页面结构](./03-core-logic.md#1-主页面结构-apppagetsx)
- [3.2 图像处理工具库](./03-core-logic.md#2-图像处理工具库-libimageUtilsts)
- [3.3 背景移除核心逻辑](./03-core-logic.md#3-背景移除核心逻辑-libremovebackgroundts)
- [3.4 模型加载器](./03-core-logic.md#4-模型加载器-libmodelloaderTs)
- [3.5 自定义 Hook 状态管理](./03-core-logic.md#5-自定义-hook-状态管理)
- [3.6 业务组件](./03-core-logic.md#6-业务组件)
- [3.7 数据流架构图](./03-core-logic.md#7-数据流架构图)

### 第四阶段：AI 推理核心
- [4.1 浏览器端 AI 技术栈](./04-ai-inference.md#1-浏览器端-ai-技术栈)
- [4.2 Transformers.js 架构](./04-ai-inference.md#2-transformersjs-架构)
- [4.3 ONNX Runtime Web 执行机制](./04-ai-inference.md#3-onnx-runtime-web-执行机制)
- [4.4 模型加载流程详解](./04-ai-inference.md#4-模型加载流程详解)
- [4.5 数据转换流程](./04-ai-inference.md#5-数据转换流程)
- [4.6 RMBG-1.4 模型原理](./04-ai-inference.md#6-rmbg-14-模型原理)
- [4.7 Mask 应用与 Alpha 通道](./04-ai-inference.md#7-mask-应用与-alpha-通道)
- [4.8 性能优化策略](./04-ai-inference.md#8-性能优化策略)

## 学习建议

1. **从外到内**：先理解配置和结构，再深入业务逻辑
2. **从简单到复杂**：UI 层 → 状态管理 → AI 推理
3. **动手实践**：每个阶段后尝试修改代码观察效果

## 适合学习的知识点

| 领域 | 知识点 | 难度 |
|------|--------|------|
| 前端框架 | Next.js 16 App Router | ⭐⭐ |
| 前端框架 | React 19 + TypeScript | ⭐⭐ |
| 样式工具 | Tailwind CSS 4 + shadcn/ui | ⭐⭐ |
| 浏览器 AI | Transformers.js | ⭐⭐⭐ |
| 浏览器 AI | ONNX Runtime Web + WASM | ⭐⭐⭐⭐ |
| 图像处理 | Canvas API + 像素操作 | ⭐⭐⭐ |
| 架构设计 | 客户端隐私架构 | ⭐⭐ |
