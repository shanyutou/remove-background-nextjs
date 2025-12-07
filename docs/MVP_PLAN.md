# AI图片背景去除工具 - MVP开发计划

> 基于 REQUIREMENTS.md 生成的详细开发步骤
> 版本: v1.0
> 创建日期: 2025-11-24

---

## 🎯 MVP 开发计划

### **阶段一：项目初始化与环境搭建** (1-2天)

#### 步骤 1.1：创建 Next.js 项目
```bash
# 使用 create-next-app 创建项目（TypeScript + Tailwind CSS）
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

#### 步骤 1.2：配置 shadcn/ui
```bash
# 初始化 shadcn/ui
npx shadcn@latest init

# 安装 MVP 所需的组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add progress
npx shadcn@latest add alert
npx shadcn@latest add separator
```

#### 步骤 1.3：安装 AI 相关依赖
```bash
# 安装 Transformers.js
npm install @huggingface/transformers

# 安装图标库
npm install lucide-react
```

#### 步骤 1.4：配置 Next.js
- 配置 `next.config.js` 支持 WASM
- 配置 TypeScript 编译选项
- 设置 Tailwind CSS 主题色

---

### **阶段二：核心工具函数开发** (1-2天)

#### 步骤 2.1：创建图片处理工具 (`lib/imageUtils.ts`)
- 图片加载到 Canvas
- 图片尺寸调整（1024×1024）
- 格式转换（File → ImageData）
- PNG 导出功能

#### 步骤 2.2：创建模型加载器 (`lib/modelLoader.ts`)
- 封装 Transformers.js 管道
- 模型缓存逻辑（IndexedDB）
- 加载进度跟踪
- 错误处理

#### 步骤 2.3：创建背景去除核心逻辑 (`lib/removeBackground.ts`)
- 图片预处理（Tensor 转换）
- RMBG-1.4 模型推理
- 分割掩码生成
- Alpha 通道应用

#### 步骤 2.4：创建自定义 Hook (`hooks/useBackgroundRemoval.ts`)
- 状态管理（上传、处理、完成、错误）
- 模型加载状态
- 处理进度跟踪
- 结果缓存

---

### **阶段三：UI 组件开发** (2-3天)

#### 步骤 3.1：图片上传组件 (`components/ImageUploader.tsx`)
**功能**：
- 点击上传按钮
- 拖拽上传区域
- 文件类型验证（JPG, PNG, WebP）
- 文件大小限制（≤10MB）
- 上传预览

**使用 shadcn/ui 组件**：
- `Card` 作为上传区域
- `Button` 作为上传按钮
- `Alert` 显示错误提示

#### 步骤 3.2：进度指示器组件 (`components/ProgressIndicator.tsx`)
**功能**：
- 模型加载进度
- 图片处理进度
- 状态文字提示

**使用 shadcn/ui 组件**：
- `Progress` 进度条
- `Card` 容器

#### 步骤 3.3：图片预览组件 (`components/ImagePreview.tsx`)
**功能**：
- 透明背景显示（棋盘格底纹）
- 下载按钮
- 重新处理按钮

**使用 shadcn/ui 组件**：
- `Card` 结果容器
- `Button` 操作按钮
- `Separator` 分隔线

#### 步骤 3.4：图片处理组件 (`components/ImageProcessor.tsx`)
**功能**：
- 集成上传、处理、预览流程
- 状态流转控制
- 错误边界处理

---

### **阶段四：主页面开发** (1天)

#### 步骤 4.1：创建主页面 (`app/page.tsx`)
**布局结构**：
```
┌─────────────────────────────────┐
│       Header（标题 + 说明）       │
├─────────────────────────────────┤
│                                 │
│    ImageProcessor 主组件         │
│    - 上传区域                    │
│    - 进度指示                    │
│    - 结果预览                    │
│                                 │
└─────────────────────────────────┘
```

#### 步骤 4.2：优化布局 (`app/layout.tsx`)
- 全局样式
- 元数据配置（SEO）
- 字体优化

---

### **阶段五：集成与测试** (1-2天)

#### 步骤 5.1：功能集成
- 连接所有组件
- 测试完整流程：上传 → 处理 → 下载
- 验证模型加载和推理

#### 步骤 5.2：错误处理
- 浏览器兼容性检查（WASM 支持）
- 文件类型错误
- 模型加载失败
- 推理超时处理

#### 步骤 5.3：性能优化
- 代码分割（动态导入 Transformers.js）
- 图片压缩优化
- Canvas 渲染优化

#### 步骤 5.4：UI/UX 优化
- 响应式设计测试（桌面 + 移动端）
- 加载状态优化
- 操作引导提示

---

### **阶段六：部署准备** (0.5天)

#### 步骤 6.1：构建验证
```bash
npm run build
npm run start
```

#### 步骤 6.2：部署配置
- 配置 Vercel 部署
- 设置环境变量（如需要）
- 配置 CDN 加速（HuggingFace 模型）

---

## 📋 详细开发检查清单

### Phase 1: 基础设施 ✅
- [ ] Next.js 项目初始化（App Router + TypeScript）
- [ ] Tailwind CSS 配置
- [ ] shadcn/ui 安装和配置
- [ ] 安装 lucide-react 图标
- [ ] 安装 @huggingface/transformers
- [ ] 配置 next.config.js 支持 WASM
- [ ] ESLint + Prettier 配置

### Phase 2: 核心工具 🔧
- [ ] `lib/imageUtils.ts` - 图片工具函数
  - [ ] loadImageToCanvas
  - [ ] resizeImage
  - [ ] imageDataToBlob
  - [ ] downloadImage
- [ ] `lib/modelLoader.ts` - 模型加载器
  - [ ] initModel
  - [ ] getModelInstance
  - [ ] cacheModel
- [ ] `lib/removeBackground.ts` - 背景去除
  - [ ] preprocessImage
  - [ ] runInference
  - [ ] applyMask
  - [ ] generateOutput
- [ ] `hooks/useBackgroundRemoval.ts` - 状态管理 Hook

### Phase 3: UI 组件 🎨
- [ ] `components/ui/*` - shadcn/ui 基础组件
- [ ] `components/ImageUploader.tsx`
  - [ ] 点击上传
  - [ ] 拖拽上传
  - [ ] 文件验证
  - [ ] 错误提示
- [ ] `components/ProgressIndicator.tsx`
  - [ ] 进度条
  - [ ] 状态文字
- [ ] `components/ImagePreview.tsx`
  - [ ] 棋盘格背景
  - [ ] 下载按钮
  - [ ] 重置按钮
- [ ] `components/ImageProcessor.tsx` - 主组件

### Phase 4: 页面 📄
- [ ] `app/page.tsx` - 主页面
- [ ] `app/layout.tsx` - 布局优化
- [ ] `app/globals.css` - 全局样式

### Phase 5: 测试与优化 🚀
- [ ] 功能测试（完整流程）
- [ ] 浏览器兼容性测试
- [ ] 移动端响应式测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] UX 细节优化

### Phase 6: 部署 🌐
- [ ] 本地构建测试
- [ ] Vercel 部署配置
- [ ] 生产环境验证

---

## ⚡ 关键技术点

### 1. 客户端组件配置
所有 AI 处理组件必须使用 `'use client'` 指令：
```tsx
'use client'
import { pipeline } from '@huggingface/transformers'
```

### 2. WASM 配置
`next.config.js` 必须配置：
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }
    return config
  },
}
```

### 3. 模型使用示例
```typescript
import { pipeline } from '@huggingface/transformers'

const segmenter = await pipeline(
  'image-segmentation',
  'briaai/RMBG-1.4',
  { device: 'wasm' }
)
```

### 4. 图片处理流程
```typescript
// 1. 加载图片到 Canvas
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
ctx.drawImage(image, 0, 0, 1024, 1024)

// 2. 获取 ImageData
const imageData = ctx.getImageData(0, 0, 1024, 1024)

// 3. 运行模型推理
const result = await segmenter(imageData)

// 4. 应用掩码到 Alpha 通道
const output = applyMask(imageData, result.mask)

// 5. 导出 PNG
const blob = await canvas.toBlob('image/png')
```

---

## 🏗️ 项目结构

```
remove-background-nextjs/
├── app/
│   ├── page.tsx              # 主页面（客户端组件）
│   ├── layout.tsx            # 全局布局
│   ├── globals.css           # 全局样式
│   └── favicon.ico
├── components/
│   ├── ui/                   # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── alert.tsx
│   │   └── separator.tsx
│   ├── ImageUploader.tsx     # 上传组件
│   ├── ImageProcessor.tsx    # 处理组件
│   ├── ImagePreview.tsx      # 预览组件
│   └── ProgressIndicator.tsx # 进度组件
├── lib/
│   ├── removeBackground.ts   # 核心推理逻辑
│   ├── imageUtils.ts         # 图片处理工具
│   ├── modelLoader.ts        # 模型加载器
│   └── utils.ts              # shadcn/ui 工具函数
├── hooks/
│   └── useBackgroundRemoval.ts # 自定义 Hook
├── public/
│   └── examples/             # 示例图片（可选）
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── REQUIREMENTS.md
└── MVP_PLAN.md              # 本文档
```

---

## 📊 预计时间表

| 阶段 | 任务 | 预计时间 | 状态 |
|------|------|----------|------|
| 1 | 项目初始化与环境搭建 | 1-2天 | ⬜ 待开始 |
| 2 | 核心工具函数开发 | 1-2天 | ⬜ 待开始 |
| 3 | UI 组件开发 | 2-3天 | ⬜ 待开始 |
| 4 | 主页面开发 | 1天 | ⬜ 待开始 |
| 5 | 集成与测试 | 1-2天 | ⬜ 待开始 |
| 6 | 部署准备 | 0.5天 | ⬜ 待开始 |
| **总计** | **MVP 完成** | **7-11天** | **0%** |

---

## 🎯 MVP 成功标准

### 功能完整性
- ✅ 支持点击和拖拽上传图片
- ✅ 成功去除图片背景（RMBG-1.4）
- ✅ 实时显示处理进度
- ✅ 透明背景预览（棋盘格）
- ✅ 下载 PNG 格式图片

### 性能指标
- ✅ 首次模型加载 ≤ 5秒
- ✅ 单张图片处理 ≤ 3秒
- ✅ 首屏加载 ≤ 2秒（不含模型）
- ✅ 内存占用 ≤ 500MB

### 用户体验
- ✅ 界面简洁直观
- ✅ 操作流程流畅（3步以内）
- ✅ 错误提示友好
- ✅ 支持桌面和移动端

### 技术质量
- ✅ TypeScript 无类型错误
- ✅ 代码结构清晰
- ✅ 无控制台错误
- ✅ 支持主流浏览器（Chrome/Firefox/Safari/Edge）

---

## 📝 开发注意事项

### 必须遵守
1. ✅ 所有 AI 推理在客户端执行（使用 `'use client'`）
2. ✅ 不依赖后端 API 处理图片
3. ✅ 模型从 HuggingFace CDN 加载
4. ✅ 使用 TypeScript 保证类型安全
5. ✅ 隐私优先（图片不上传服务器）

### 建议遵守
1. 使用 React Server Components（非 AI 处理部分）
2. 使用 Next.js 内置优化（图片、字体等）
3. 代码分割减少初始加载
4. 考虑使用 Web Worker 处理密集计算
5. 实现错误边界（Error Boundary）

### 常见问题
1. **WASM 未加载**：检查 `next.config.js` 配置
2. **模型加载失败**：检查网络和 HuggingFace CDN
3. **内存溢出**：优化图片尺寸和模型缓存
4. **处理速度慢**：检查设备性能和 WASM 支持

---

## 🔗 参考资源

- **原项目**: https://huggingface.co/spaces/Xenova/remove-background-web
- **Transformers.js**: https://github.com/xenova/transformers.js
- **RMBG-1.4 模型**: https://huggingface.co/briaai/RMBG-1.4
- **Next.js 文档**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **ONNX Runtime**: https://onnxruntime.ai/

---

## 📞 下一步

准备开始开发？执行以下命令开始阶段一：

```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# 2. 初始化 shadcn/ui
npx shadcn@latest init

# 3. 安装依赖
npm install @huggingface/transformers lucide-react
```

---

**文档版本**: v1.0
**最后更新**: 2025-11-24
**维护者**: Claude Code
