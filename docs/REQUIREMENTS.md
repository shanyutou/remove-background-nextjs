# AI图片背景去除工具 - 需求文档

## 1. 项目概述

基于 Next.js 开发的纯前端 AI 图片背景去除工具，在浏览器本地运行深度学习模型，实现隐私保护的图片处理功能。

**项目类型**: Next.js Web应用
**核心价值**: 客户端AI推理 + 隐私保护 + 现代Web体验
**参考项目**: Remove Background Web (Transformers.js)

---

## 2. 核心功能需求

### 2.1 基础功能（MVP）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **图片上传** | 支持点击上传、拖拽上传 | P0 |
| **背景去除** | 使用RMBG-1.4模型进行本地推理 | P0 |
| **结果预览** | 实时显示去除背景后的图片 | P0 |
| **图片下载** | 支持导出PNG格式（透明背景） | P0 |
| **加载状态** | 模型加载和处理进度提示 | P0 |

### 2.2 增强功能（V2）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **示例图片** | 提供示例图片快速体验 | P1 |
| **历史记录** | 本地缓存最近处理的图片 | P1 |
| **批量处理** | 支持多张图片队列处理 | P2 |
| **对比视图** | 原图与处理后对比显示 | P2 |
| **高级设置** | 调整边缘羽化、透明度等 | P3 |

---

## 3. 技术栈要求

### 3.1 核心技术

```
Next.js 14+          - React框架（App Router）
TypeScript           - 类型安全
Tailwind CSS         - 样式方案
shadcn/ui            - UI组件库（推荐）
@huggingface/transformers - AI模型管道
ONNX Runtime Web     - 模型推理引擎
```

**UI库选择**:
- **shadcn/ui** (推荐): 基于Radix UI + Tailwind，可定制性强，组件复制到项目中
- 备选方案: Ant Design, Material-UI (MUI), Chakra UI

### 3.2 AI/ML组件

- **模型**: RMBG-1.4 (briaai/RMBG-1.4)
- **推理**: 客户端WASM/WebGL
- **缓存**: IndexedDB存储模型文件

### 3.3 开发工具

- **包管理**: pnpm / npm
- **代码规范**: ESLint + Prettier
- **UI开发**: shadcn/ui CLI（组件安装）
- **图标**: lucide-react（shadcn/ui配套）
- **Git**: 版本控制

---

## 4. 架构设计

### 4.1 应用架构

```
Next.js App Router
├── app/
│   ├── page.tsx              # 主页面（客户端组件）
│   ├── layout.tsx            # 布局
│   └── api/                  # API路由（可选）
├── components/
│   ├── ui/                   # shadcn/ui组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── ImageUploader.tsx     # 上传组件
│   ├── ImageProcessor.tsx    # 处理组件
│   ├── ImagePreview.tsx      # 预览组件
│   └── ProgressIndicator.tsx # 进度组件
├── lib/
│   ├── removeBackground.ts   # 核心推理逻辑
│   ├── imageUtils.ts         # 图片处理工具
│   ├── modelLoader.ts        # 模型加载器
│   └── utils.ts              # shadcn/ui工具函数
└── hooks/
    └── useBackgroundRemoval.ts # 自定义Hook
```

### 4.2 数据流

```
用户上传图片
    ↓
前端接收文件
    ↓
Canvas读取并预处理
    ↓
Transformers.js推理（WASM）
    ↓
生成透明背景图片
    ↓
Canvas渲染结果
    ↓
用户下载PNG
```

---

## 5. 功能详细说明

### 5.1 图片上传

**支持方式**:
- 点击上传按钮选择文件
- 拖拽图片到指定区域
- 粘贴剪贴板图片（可选）

**限制**:
- 格式: JPG, PNG, WebP
- 大小: ≤ 10MB
- 尺寸: 自动缩放到1024×1024

### 5.2 背景去除处理

**处理流程**:
1. 图片加载到Canvas
2. 转换为Tensor格式（1024×1024）
3. RMBG-1.4模型推理
4. 生成分割掩码
5. 应用掩码到Alpha通道
6. 渲染透明背景结果

**性能目标**:
- 首次模型加载: ≤ 5秒
- 单张处理时间: ≤ 3秒
- 内存占用: ≤ 500MB

### 5.3 结果展示

**显示模式**:
- 透明背景（棋盘格底纹）
- 对比模式（左右分屏）
- 下载按钮（PNG格式）

---

## 6. 非功能需求

### 6.1 性能要求

- **首屏加载**: ≤ 2秒（不含模型）
- **响应速度**: UI操作≤100ms
- **SEO优化**: 支持SSR/SSG
- **渐进增强**: 模型按需加载

### 6.2 兼容性

- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **设备**: 桌面端 + 移动端响应式
- **WebAssembly**: 必须支持WASM

### 6.3 安全与隐私

- ✅ 所有处理在浏览器本地完成
- ✅ 图片不上传到服务器
- ✅ 无用户数据收集
- ✅ 模型从官方CDN加载（HuggingFace）

### 6.4 用户体验

- 简洁直观的界面设计
- 明确的操作引导
- 实时的处理进度反馈
- 友好的错误提示

---

## 7. 项目里程碑

### Phase 1: MVP开发（核心功能）
- [ ] Next.js项目初始化（TypeScript + Tailwind CSS）
- [ ] 配置shadcn/ui并安装基础组件
- [ ] 集成Transformers.js
- [ ] 实现图片上传组件（使用shadcn/ui Button、Card）
- [ ] 实现背景去除核心逻辑
- [ ] 实现结果预览和下载（使用shadcn/ui Progress）
- [ ] 基础UI/UX设计（使用shadcn/ui主题）

### Phase 2: 功能增强
- [ ] 添加示例图片
- [ ] 优化加载和处理性能
- [ ] 添加历史记录功能
- [ ] 响应式设计优化

### Phase 3: 高级功能（可选）
- [ ] 批量处理
- [ ] 高级编辑功能
- [ ] PWA支持
- [ ] 多语言支持

---

## 8. 技术约束

### 8.1 必须遵守

- ✅ 所有AI推理在客户端执行（使用'use client'）
- ✅ 不依赖后端API处理图片
- ✅ 模型文件从HuggingFace CDN加载
- ✅ 使用TypeScript保证类型安全

### 8.2 建议遵守

- 使用React Server Components（非AI处理部分）
- 使用Next.js内置优化（图片、字体等）
- 代码分割减少初始加载
- 使用Web Worker处理密集计算（可选）

---

## 9. 参考资源

- **原项目**: https://huggingface.co/spaces/Xenova/remove-background-web
- **Transformers.js**: https://github.com/xenova/transformers.js
- **RMBG-1.4模型**: https://huggingface.co/briaai/RMBG-1.4
- **Next.js文档**: https://nextjs.org/docs
- **ONNX Runtime**: https://onnxruntime.ai/

---

## 10. 成功标准

### 功能完整性
- ✅ 能成功去除常见图片的背景
- ✅ 支持主流浏览器和设备
- ✅ 处理速度在可接受范围

### 用户体验
- ✅ 界面简洁易用
- ✅ 操作流程流畅
- ✅ 错误处理友好

### 技术质量
- ✅ 代码结构清晰
- ✅ TypeScript类型完整
- ✅ 无严重性能问题

---

**文档版本**: v1.0
**创建日期**: 2025-11-23
**预计开发周期**: 2-3周（MVP）
