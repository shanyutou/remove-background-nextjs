# 第三阶段：核心业务逻辑

本阶段深入理解项目的核心业务实现，包括页面结构、图像处理工具、组件设计和状态管理。

## 目录

1. [主页面结构](#1-主页面结构-apppagetsx)
2. [图像处理工具库](#2-图像处理工具库-libimageUtilsts)
3. [背景移除核心逻辑](#3-背景移除核心逻辑-libremovebackgroundts)
4. [模型加载器](#4-模型加载器-libmodelloaderTs)
5. [自定义 Hook 状态管理](#5-自定义-hook-状态管理)
6. [业务组件](#6-业务组件)
7. [数据流架构图](#7-数据流架构图)

---

## 1. 主页面结构 (app/page.tsx)

```tsx
'use client'  // 🔑 必须标记：页面包含客户端交互

import { Sparkles, Shield, Zap } from 'lucide-react'
import { ImageProcessor } from '@/components/ImageProcessor'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Header - 标题和描述 */}
        <header className="text-center mb-8 md:mb-12">
          <h1>AI Background Remover</h1>
          <p>100% free, runs locally in your browser...</p>
        </header>

        {/* Features - 三个特性卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard icon={Shield} title="100% Private" />
          <FeatureCard icon={Zap} title="Fast Processing" />
          <FeatureCard icon={Sparkles} title="AI Powered" />
        </div>

        {/* Main processor - 核心功能组件 */}
        <ImageProcessor />

        {/* Footer - 技术致谢 */}
        <footer>Powered by RMBG-1.4 and Transformers.js</footer>
      </main>
    </div>
  )
}
```

### 页面结构特点

| 特点 | 说明 |
|------|------|
| `'use client'` | 整个页面需要客户端渲染（包含 AI 处理） |
| 响应式设计 | `md:` 前缀适配桌面端，移动优先 |
| 单一职责 | 页面只负责布局，核心逻辑在 `ImageProcessor` 中 |
| 渐变背景 | `bg-gradient-to-b from-background to-muted/20` |

---

## 2. 图像处理工具库 (lib/imageUtils.ts)

这是图像处理的基础工具集，所有操作都基于 Canvas API。

### 常量定义

```typescript
export const MODEL_INPUT_SIZE = 1024           // 模型输入尺寸
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
```

### 核心函数

#### 1. 文件验证

```typescript
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查格式
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return { valid: false, error: 'Unsupported format...' }
  }
  // 检查大小
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large...' }
  }
  return { valid: true }
}
```

#### 2. 图像加载到 Canvas

```typescript
export async function loadImageToCanvas(
  file: File,
  targetSize: number = MODEL_INPUT_SIZE
): Promise<ImageLoadResult> {
  const img = await loadImage(file)

  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize

  // 计算缩放比例，保持宽高比
  const scale = Math.min(targetSize / img.width, targetSize / img.height)
  const scaledWidth = img.width * scale
  const scaledHeight = img.height * scale

  // 居中绘制
  const offsetX = (targetSize - scaledWidth) / 2
  const offsetY = (targetSize - scaledHeight) / 2

  ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

  return { canvas, ctx, originalWidth: img.width, originalHeight: img.height }
}
```

**图解**：
```
原图 (800x600)                     Canvas (1024x1024)
┌──────────────┐                   ┌─────────────────────┐
│              │     缩放+居中      │     ┌─────────┐     │
│   图片内容   │  ─────────────>   │     │  图片   │     │
│              │                   │     │  内容   │     │
└──────────────┘                   │     └─────────┘     │
                                   └─────────────────────┘
```

#### 3. 棋盘格背景（透明度预览）

```typescript
export function createCheckerboardPattern(
  size: number = 10,
  color1: string = '#ffffff',
  color2: string = '#e0e0e0'
): HTMLCanvasElement {
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = size * 2
  patternCanvas.height = size * 2

  // 绘制棋盘格
  ctx.fillStyle = color1
  ctx.fillRect(0, 0, size * 2, size * 2)
  ctx.fillStyle = color2
  ctx.fillRect(0, 0, size, size)           // 左上
  ctx.fillRect(size, size, size, size)     // 右下

  return patternCanvas
}
```

**图解**：
```
棋盘格模式 (size=10)
┌─────┬─────┐
│ 灰  │ 白  │  → 用作 Canvas pattern
├─────┼─────┤     重复平铺显示透明区域
│ 白  │ 灰  │
└─────┴─────┘
```

#### 4. 下载功能

```typescript
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)   // 创建临时 URL
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()                             // 触发下载
  document.body.removeChild(link)
  URL.revokeObjectURL(url)                // 释放内存
}
```

---

## 3. 背景移除核心逻辑 (lib/removeBackground.ts)

这是整个项目的**核心文件**，实现完整的 AI 推理流程。

### 处理阶段定义

```typescript
export type ProcessingStage =
  | 'loading-model'    // 加载 AI 模型
  | 'preprocessing'    // 预处理图像
  | 'inference'        // AI 推理
  | 'postprocessing'   // 后处理（应用 mask）
  | 'complete'         // 完成
```

### 主函数流程

```typescript
export async function removeBackground(
  file: File,
  onProgress?: ProcessingProgressCallback,
  onModelProgress?: ProgressCallback
): Promise<RemoveBackgroundResult> {
  const startTime = performance.now()

  // Stage 1: 加载模型
  onProgress?.('loading-model', 0, 'Loading AI model...')
  const segmenter = await getSegmenter(onModelProgress)

  // Stage 2: 预处理图像
  onProgress?.('preprocessing', 0, 'Loading image...')
  const { canvas, ctx, originalWidth, originalHeight } =
    await loadImageToCanvas(file, MODEL_INPUT_SIZE)

  // Stage 3: AI 推理
  onProgress?.('inference', 0, 'Processing image...')
  const imageDataUrl = canvas.toDataURL('image/png')
  const result = await segmenter(imageDataUrl)  // 🔑 核心推理

  // Stage 4: 应用 mask
  onProgress?.('postprocessing', 0, 'Applying transparency...')
  const outputCanvas = await applySegmentationMask(canvas, ctx, result)

  return {
    canvas: outputCanvas,
    originalWidth,
    originalHeight,
    processingTime: performance.now() - startTime,
  }
}
```

### Mask 应用原理

```typescript
async function applySegmentationMask(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  segmentationResult: any
): Promise<HTMLCanvasElement> {
  // 获取原图像素数据
  const imageData = getImageData(canvas)
  const pixels = imageData.data  // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]

  // 提取 mask 数据 (0-255)
  const maskData = await extractMaskData(segmentationResult, canvas.width, canvas.height)

  // 🔑 核心：将 mask 值应用到 Alpha 通道
  for (let i = 0; i < maskData.length; i++) {
    pixels[i * 4 + 3] = maskData[i]  // 设置每个像素的透明度
    //     ↑ Alpha 通道位置 (R=0, G=1, B=2, A=3)
  }

  putImageData(outputCanvas, imageData)
  return outputCanvas
}
```

**图解**：
```
原图像素                        Mask 数据                     结果
[R, G, B, 255]                 [255]  (前景)                [R, G, B, 255] 不透明
[R, G, B, 255]     +           [0]    (背景)       =        [R, G, B, 0]   完全透明
[R, G, B, 255]                 [128]  (边缘)                [R, G, B, 128] 半透明
```

### Mask 数据提取

模型输出格式可能不同，需要处理多种情况：

```typescript
async function extractMaskData(result: any, width: number, height: number): Promise<Uint8Array> {
  // 情况 1: RawImage 对象 (有 toCanvas 方法)
  if (segment.mask?.toCanvas) {
    const maskCanvas = mask.toCanvas()
    // 从 Canvas 提取灰度值作为 mask
  }

  // 情况 2: 直接的数据数组
  if (mask.data) {
    // 值可能是 0-1 或 0-255，需要归一化
    maskData[i] = value <= 1 ? Math.round(value * 255) : Math.round(value)
  }

  // 情况 3: 需要调整尺寸
  if (maskWidth !== width || maskHeight !== height) {
    return resizeMask(data, maskWidth, maskHeight, width, height)
  }

  // 兜底：返回全不透明 mask
  maskData.fill(255)
  return maskData
}
```

---

## 4. 模型加载器 (lib/modelLoader.ts)

### 单例模式

```typescript
// 单例实例
let segmenterInstance: any = null
let loadingPromise: Promise<any> | null = null

export async function getSegmenter(onProgress?: ProgressCallback): Promise<any> {
  // 已加载，直接返回
  if (segmenterInstance) {
    onProgress?.({ status: 'ready', progress: 100 })
    return segmenterInstance
  }

  // 正在加载，返回同一个 Promise（避免重复加载）
  if (loadingPromise) {
    return loadingPromise
  }

  // 首次加载
  loadingPromise = initializeModel(onProgress)
  segmenterInstance = await loadingPromise
  return segmenterInstance
}
```

### Transformers.js 配置

```typescript
async function getTransformers() {
  const transformers = await import('@huggingface/transformers')

  // 浏览器环境配置
  transformers.env.allowLocalModels = false   // 禁用本地模型
  transformers.env.useBrowserCache = true     // 🔑 启用浏览器缓存 (IndexedDB)

  return transformers
}

async function initializeModel(onProgress?: ProgressCallback): Promise<any> {
  const { pipeline } = await getTransformers()

  const segmenter = await pipeline(
    'image-segmentation',      // 任务类型
    'briaai/RMBG-1.4',         // 模型 ID
    {
      device: 'wasm',          // 使用 WebAssembly 运行
      progress_callback: (data) => {
        onProgress?.(normalizeProgress(data))
      },
    }
  )

  return segmenter
}
```

### 模型缓存机制

```
首次加载:
用户访问 → 下载模型 (176MB) → 存储到 IndexedDB → 运行推理
                ↓
        耗时 5-30 秒（取决于网速）

后续访问:
用户访问 → 从 IndexedDB 加载 → 运行推理
                ↓
           耗时 < 1 秒
```

### 辅助函数

```typescript
// 检查 WebAssembly 支持
export function checkWasmSupport(): { supported: boolean; error?: string }

// 预加载模型（页面加载时可调用）
export function preloadModel(onProgress?: ProgressCallback): void

// 释放模型内存
export async function disposeModel(): Promise<void>

// 获取模型信息
export function getModelInfo(): { name: string; size: string; parameters: string }
// → { name: 'RMBG-1.4', size: '~176MB', parameters: '44.1M' }
```

---

## 5. 自定义 Hook 状态管理

### useBackgroundRemoval Hook

```typescript
// hooks/useBackgroundRemoval.ts
'use client'

export type ProcessingStatus =
  | 'idle'           // 空闲，等待上传
  | 'validating'     // 验证文件
  | 'loading-model'  // 加载模型
  | 'preprocessing'  // 预处理
  | 'processing'     // AI 推理中
  | 'complete'       // 完成
  | 'error'          // 错误

export interface BackgroundRemovalState {
  status: ProcessingStatus
  error: string | null
  modelProgress: number        // 模型加载进度 0-100
  processingProgress: number   // 处理进度 0-100
  stageMessage: string         // 当前阶段消息
  originalFile: File | null    // 原始文件
  originalPreview: string | null  // 原图预览 URL
  result: RemoveBackgroundResult | null
  resultPreview: string | null    // 结果预览 URL
  processingTime: number | null   // 处理耗时
}
```

### Hook 返回接口

```typescript
export interface UseBackgroundRemovalReturn extends BackgroundRemovalState {
  // 方法
  processImage: (file: File) => Promise<void>  // 处理图像
  reset: () => void                            // 重置状态
  downloadResult: (filename?: string) => Promise<void>  // 下载结果

  // 计算属性
  isProcessing: boolean    // 是否正在处理
  isModelLoading: boolean  // 是否正在加载模型
  isComplete: boolean      // 是否已完成
}
```

### 核心实现

```typescript
export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [state, setState] = useState<BackgroundRemovalState>(initialState)
  const isProcessingRef = useRef(false)  // 防止并发处理

  const processImage = useCallback(async (file: File) => {
    if (isProcessingRef.current) return  // 🔑 防止重复触发
    isProcessingRef.current = true

    try {
      // 1. 验证文件
      updateState({ status: 'validating' })
      const validation = validateImageFile(file)
      if (!validation.valid) throw new Error(validation.error)

      // 2. 创建原图预览
      const originalPreview = URL.createObjectURL(file)
      updateState({ originalPreview })

      // 3. 处理图像
      updateState({ status: 'loading-model' })
      const result = await removeBackground(file, handleProcessingProgress, handleModelProgress)

      // 4. 生成结果预览
      const resultPreview = canvasToDataURL(result.canvas)
      updateState({ status: 'complete', result, resultPreview })

    } catch (error) {
      updateState({ status: 'error', error: error.message })
    } finally {
      isProcessingRef.current = false
    }
  }, [])

  const reset = useCallback(() => {
    // 释放 Object URL 防止内存泄漏
    if (state.originalPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(state.originalPreview)
    }
    setState(initialState)
  }, [state.originalPreview])

  return { ...state, processImage, reset, downloadResult, isProcessing, ... }
}
```

---

## 6. 业务组件

### 6.1 ImageProcessor - 主控制器

```tsx
// components/ImageProcessor.tsx
'use client'

export function ImageProcessor() {
  const {
    status, error, modelProgress, processingProgress, stageMessage,
    originalPreview, resultPreview, processingTime,
    processImage, reset, downloadResult, isProcessing, isComplete,
  } = useBackgroundRemoval()

  // 根据状态决定显示哪个组件
  const showUploader = status === 'idle'
  const showProgress = isProcessing
  const showPreview = isComplete || resultPreview
  const showError = status === 'error' && error

  return (
    <div>
      {showError && <Alert variant="destructive">...</Alert>}
      {showUploader && <ImageUploader onFileSelect={processImage} />}
      {showProgress && <ProgressIndicator status={status} ... />}
      {showPreview && <ImagePreview ... onDownload={downloadResult} onReset={reset} />}
    </div>
  )
}
```

**状态机流程**：
```
idle ──[选择文件]──→ validating ──→ loading-model ──→ preprocessing
                          │              │                  │
                          ↓              ↓                  ↓
                       [错误]         [错误]             processing
                          │              │                  │
                          ↓              ↓                  ↓
                        error ←────────←────────←────── complete
                          │                                 │
                          └────────[重置]──────────────────┘
```

### 6.2 ImageUploader - 上传组件

```tsx
// components/ImageUploader.tsx
export function ImageUploader({ onFileSelect, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 拖拽处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // 文件处理（验证 + 回调）
  const handleFile = (file: File) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    onFileSelect(file)
  }

  return (
    <Card
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input type="file" ref={fileInputRef} hidden accept="image/*" />
      {/* 上传区域 UI */}
    </Card>
  )
}
```

### 6.3 ProgressIndicator - 进度组件

```tsx
// components/ProgressIndicator.tsx
function getOverallProgress(status, modelProgress, processingProgress): number {
  switch (status) {
    case 'validating':     return 5
    case 'loading-model':  return Math.round(modelProgress * 0.5)  // 0-50%
    case 'preprocessing':  return 55
    case 'processing':     return 60 + Math.round(processingProgress * 0.35)  // 60-95%
    case 'complete':       return 100
    default:               return 0
  }
}

export function ProgressIndicator({ status, modelProgress, processingProgress }) {
  const progress = getOverallProgress(status, modelProgress, processingProgress)

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" />
        <span>{statusLabels[status]}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
      {status === 'loading-model' && (
        <p>First-time setup: downloading AI model (~176MB)...</p>
      )}
    </Card>
  )
}
```

### 6.4 ImagePreview - 预览组件

```tsx
// components/ImagePreview.tsx
export function ImagePreview({ originalPreview, resultPreview, onDownload, onReset }) {
  return (
    <Card>
      {/* 并排对比 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 原图 */}
        <div>
          <p>Original</p>
          <img src={originalPreview} />
        </div>

        {/* 结果 - 棋盘格背景显示透明 */}
        <div>
          <p>Result</p>
          <div style={{
            backgroundImage: `linear-gradient(45deg, #e0e0e0 25%, ...)`,
            backgroundSize: '20px 20px',
          }}>
            <img src={resultPreview} />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div>
        <Button onClick={onDownload}>Download PNG</Button>
        <Button variant="outline" onClick={onReset}>Process Another</Button>
      </div>
    </Card>
  )
}
```

---

## 7. 数据流架构图

### 完整数据流

```
用户操作                    组件层                      逻辑层                      AI 层
────────────────────────────────────────────────────────────────────────────────────────

[拖放/点击上传]
      │
      ↓
ImageUploader ──────→ validateImageFile()
      │                      │
      │                      ↓
      │               [验证失败] → 显示错误
      │                      │
      ↓                      ↓ [验证成功]
ImageProcessor ←──── useBackgroundRemoval.processImage()
      │                      │
      │                      ↓
      │               loadImageToCanvas()
      │                      │
      │                      ↓
ProgressIndicator ←── getSegmenter() ─────────────────→ Transformers.js
      │                      │                               │
      │               [首次加载模型]                          ↓
      │                      │                         pipeline()
      │                      ↓                               │
      │               segmenter(imageDataUrl) ←──────────────┘
      │                      │
      │                      ↓
      │               applySegmentationMask()
      │                      │
      │                      ↓
      │               extractMaskData()
      │                      │
      │                      ↓
      │               [设置 Alpha 通道]
      │                      │
      ↓                      ↓
ImagePreview ←─────── canvasToDataURL()
      │
      ↓
[下载 PNG] ──────────→ downloadImage()
```

### 状态流转

```
useBackgroundRemoval 状态管理

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  initialState ──→ processImage() ──→ 各阶段状态更新         │
│       ↑                                     │               │
│       │                                     ↓               │
│       └──────────── reset() ←───────── complete/error       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

状态对应的 UI:
┌──────────────┬────────────────────┐
│ idle         │ ImageUploader      │
│ validating   │ ProgressIndicator  │
│ loading-model│ ProgressIndicator  │
│ preprocessing│ ProgressIndicator  │
│ processing   │ ProgressIndicator  │
│ complete     │ ImagePreview       │
│ error        │ Alert + Uploader   │
└──────────────┴────────────────────┘
```

---

## 理解检查点

完成本阶段学习后，你应该能回答：

1. **为什么 `page.tsx` 需要 `'use client'` 指令？**
   > 因为页面包含 `ImageProcessor` 组件，该组件使用了 `useBackgroundRemoval` Hook 进行状态管理和 AI 推理，这些都需要在客户端执行。

2. **`loadImageToCanvas` 为什么要居中绘制图像？**
   > 模型输入是固定的 1024×1024，不同比例的图片需要缩放后居中，保持宽高比的同时填充到正方形画布。

3. **Mask 是如何应用到图像上的？**
   > 将 mask 数据（0-255 灰度值）直接写入图像的 Alpha 通道（每 4 个像素的第 4 个值），mask 值越大越不透明。

4. **为什么使用单例模式加载模型？**
   > 模型很大（176MB），单例模式确保只加载一次，后续调用直接复用，避免重复下载和内存浪费。

5. **`useBackgroundRemoval` Hook 如何防止并发处理？**
   > 使用 `useRef` 创建 `isProcessingRef`，处理开始时设为 true，结束时设为 false，处理中的新请求会被忽略。

6. **为什么 `reset` 函数需要调用 `URL.revokeObjectURL`？**
   > `URL.createObjectURL` 创建的 blob URL 会占用内存，不再使用时需要手动释放，否则会导致内存泄漏。

---

## 下一步

继续 [第四阶段：AI 推理核心](./04-ai-inference.md) 深入理解 Transformers.js 模型加载、ONNX Runtime Web 执行和 Tensor 数据转换。
