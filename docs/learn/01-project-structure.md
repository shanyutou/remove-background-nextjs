# 第一阶段：项目结构与配置

本阶段帮助你理解项目的基础配置和目录结构。

## 1. package.json - 依赖分析

```json
{
  "dependencies": {
    "next": "16.0.3",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "@huggingface/transformers": "^3.8.0",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.554.0",
    "tailwind-merge": "^3.4.0"
  }
}
```

### 依赖结构图

```
核心依赖：
├── next: 16.0.3              # Next.js 框架 (最新版)
├── react: 19.2.0             # React 19 (最新版)
├── @huggingface/transformers # 🔑 浏览器端 AI 推理核心
├── lucide-react              # 图标库
│
├── UI 组件层 (shadcn/ui 基础)：
│   ├── @radix-ui/react-*     # 无样式基础组件
│   ├── class-variance-authority # 组件变体管理
│   ├── clsx + tailwind-merge # 样式合并工具
│
└── 开发依赖：
    ├── tailwindcss: ^4       # Tailwind CSS 4 (新版)
    └── tw-animate-css        # 动画扩展
```

### 关键依赖说明

| 依赖 | 作用 | 说明 |
|------|------|------|
| `@huggingface/transformers` | 浏览器端 AI 推理 | 官方 Transformers.js，支持在浏览器中运行 Hugging Face 模型 |
| `@radix-ui/react-*` | UI 基础组件 | shadcn/ui 的底层依赖，提供无样式但功能完整的组件 |
| `class-variance-authority` | 组件变体 | 管理组件的不同样式变体（如 Button 的 primary/secondary） |
| `clsx` + `tailwind-merge` | 样式工具 | 条件合并 class 名，处理 Tailwind 类名冲突 |

### 注意事项

项目使用的是 `@huggingface/transformers` 而不是早期的 `@xenova/transformers`。这是官方新版本，API 基本兼容但有改进。

---

## 2. next.config.ts - WASM 配置详解

这个配置是让**浏览器端 AI 运行**的关键：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack 配置 (Next.js 16+ 默认构建工具)
  turbopack: {},

  // Webpack 配置 - 支持 WASM 和 ONNX Runtime
  webpack: (config, { isServer }) => {
    // 第一部分：禁用 Node.js 专用模块
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,           // 图像处理库 (Node 专用)
      "onnxruntime-node$": false // ONNX Node 版本
    };

    // 第二部分：启用 WASM 实验特性
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,    // 允许异步加载 .wasm 文件
      layers: true               // 支持 webpack layers
    };

    // 第三部分：WASM 输出配置 (仅客户端)
    if (!isServer) {
      config.output = {
        ...config.output,
        webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
      };
    }

    return config;
  },
};

export default nextConfig;
```

### 配置详解

#### 第一部分：禁用 Node.js 模块

```typescript
"sharp$": false,
"onnxruntime-node$": false
```

**为什么需要这样做？**

Transformers.js 库在设计时同时支持 Node.js 和浏览器环境。当它被打包时，会尝试导入：
- `sharp` - Node.js 图像处理库
- `onnxruntime-node` - ONNX Runtime 的 Node 版本

但在浏览器中这些库无法运行，设为 `false` 告诉 Webpack 忽略这些导入，改用浏览器兼容的替代方案（如 Canvas API 和 `onnxruntime-web`）。

#### 第二部分：启用 WASM 特性

```typescript
asyncWebAssembly: true,
layers: true
```

- `asyncWebAssembly: true` - 允许 Webpack 异步加载 `.wasm` 文件，这是 ONNX Runtime Web 运行的前提
- `layers: true` - 支持 Webpack 5 的 layers 特性，用于更细粒度的模块分离

#### 第三部分：WASM 输出路径

```typescript
webassemblyModuleFilename: 'static/wasm/[modulehash].wasm'
```

指定 `.wasm` 文件的输出位置，便于浏览器通过 HTTP 请求加载。

---

## 3. App 目录结构

```
app/
├── layout.tsx    # 根布局（字体、全局 Provider）
├── page.tsx      # 主页面（应用入口）
├── globals.css   # 全局样式
└── favicon.ico   # 网站图标
```

### Next.js App Router 概念

Next.js 16 使用 App Router，核心概念：

| 文件 | 作用 | 说明 |
|------|------|------|
| `layout.tsx` | 布局组件 | 包裹所有页面，可嵌套，状态在导航时保持 |
| `page.tsx` | 页面组件 | 对应 URL 路由，是实际渲染的内容 |
| `globals.css` | 全局样式 | 在 layout 中导入，影响所有页面 |

### 服务端 vs 客户端组件

```tsx
// 默认是服务端组件 (Server Component)
export default function Page() { ... }

// 添加 'use client' 变成客户端组件
'use client'
export default function ClientPage() { ... }
```

本项目的 AI 推理必须在客户端运行，因此核心组件需要 `'use client'` 指令。

---

## 理解检查点

完成本阶段学习后，你应该能回答：

1. **为什么要把 `sharp` 和 `onnxruntime-node` 设为 `false`？**
   > 这些是 Node.js 专用库，浏览器无法运行。禁用后 Transformers.js 会使用浏览器兼容的替代方案。

2. **`asyncWebAssembly: true` 解决什么问题？**
   > 允许 Webpack 异步加载 .wasm 文件，这是 ONNX Runtime Web 运行 AI 模型的前提。

3. **App Router 中 `layout.tsx` 和 `page.tsx` 的区别？**
   > layout 是布局容器（可嵌套、状态保持），page 是具体页面内容。

---

## 下一步

继续 [第二阶段：UI 层](./02-ui-layer.md) 学习 layout.tsx、shadcn/ui 组件和 Tailwind CSS 4 配置。
