# 第二阶段：UI 层

本阶段帮助你理解项目的 UI 架构，包括 Next.js 布局、Tailwind CSS 4 配置和 shadcn/ui 组件模式。

## 1. app/layout.tsx - 根布局和字体配置

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 字体实例化 - 自动优化加载
const geistSans = Geist({
  variable: "--font-geist-sans",  // 导出为 CSS 变量
  subsets: ["latin"],              // 只加载拉丁字符子集
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO 元数据配置
export const metadata: Metadata = {
  title: "AI Background Remover - Free Online Tool",
  description: "Remove image backgrounds instantly with AI...",
  keywords: ["background remover", "AI", "image editing"...],
  openGraph: {
    title: "AI Background Remover - Free Online Tool",
    description: "...",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

### 关键概念

| 特性 | 说明 |
|------|------|
| `next/font/google` | Next.js 内置字体优化，构建时下载字体，避免布局偏移 (CLS) |
| `variable` | 将字体导出为 CSS 变量，可在 Tailwind 中通过 `font-sans` 使用 |
| `subsets` | 只加载需要的字符子集，减小字体文件体积 |
| `metadata` | Next.js 元数据 API，自动生成 SEO 相关的 `<head>` 标签 |
| `antialiased` | Tailwind 类，启用字体抗锯齿，提升文字渲染质量 |

### Next.js 字体优化原理

```
传统方式：
浏览器加载 HTML → 发现字体 → 请求 Google Fonts → 下载 → 渲染
                                    ↑ 阻塞渲染，可能导致闪烁

Next.js 优化：
构建时下载字体 → 内联到 CSS → 浏览器直接使用
                              ↑ 无网络请求，无闪烁
```

---

## 2. app/globals.css - Tailwind CSS 4 配置

```css
@import "tailwindcss";        /* Tailwind 4 新导入方式 */
@import "tw-animate-css";     /* 动画扩展库 */

/* 暗色模式变体定义 */
@custom-variant dark (&:is(.dark *));

/* 🔑 Tailwind 4 核心新特性：主题映射 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-destructive: var(--destructive);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  /* ... 更多映射 */
}

/* 亮色主题变量 */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);           /* 纯白 */
  --foreground: oklch(0.145 0 0);       /* 近黑 */
  --primary: oklch(0.205 0 0);          /* 深灰/黑 */
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);  /* 红色 */
  /* ... */
}

/* 暗色主题变量 */
.dark {
  --background: oklch(0.145 0 0);       /* 近黑 */
  --foreground: oklch(0.985 0 0);       /* 近白 */
  --primary: oklch(0.922 0 0);
  /* ... 反转的颜色值 */
}

/* 基础样式层 */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Tailwind CSS 4 vs 3 对比

| 特性 | Tailwind 3 | Tailwind 4 |
|------|------------|------------|
| 配置方式 | `tailwind.config.js` (JS 文件) | CSS 内 `@theme` 指令 |
| 导入方式 | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| 主题定义 | JS 对象 `theme.extend` | CSS 变量 + `@theme` 映射 |
| 颜色格式 | HSL | OKLCH (感知均匀色彩空间) |
| 暗色模式 | `darkMode: 'class'` 配置 | `@custom-variant` CSS 指令 |

### OKLCH 色彩空间

```css
/* OKLCH 格式：oklch(亮度 色度 色相) */
--primary: oklch(0.205 0 0);
/*              ↑     ↑  ↑
              亮度  色度 色相
              0-1   0+   0-360

亮度 0 = 黑色，1 = 白色
色度 0 = 灰色，越大越鲜艳
色相 = 色轮角度 (0=红, 120=绿, 240=蓝)
*/

/* 示例 */
oklch(1 0 0)              /* 纯白 (亮度1, 无色度) */
oklch(0.145 0 0)          /* 近黑 (低亮度, 无色度) */
oklch(0.577 0.245 27.325) /* 红色 (中亮度, 有色度, 色相≈红) */
```

**为什么用 OKLCH？**
- 感知均匀：相同数值变化 = 相同视觉变化
- 更广色域：支持 P3 显示器的更鲜艳颜色
- 更直观：亮度/饱和度调整更可预测

### @theme inline 的作用

```css
@theme inline {
  --color-primary: var(--primary);
}
```

这行代码的作用是**将 CSS 变量映射到 Tailwind 类名**：

```
CSS 变量                    Tailwind 类
--primary         →    无法直接使用
                       ↓ @theme 映射
--color-primary   →    bg-primary, text-primary, border-primary
```

---

## 3. shadcn/ui 组件实现模式

### 核心工具函数 cn()

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**两个库的分工**：

| 库 | 作用 | 示例 |
|-----|------|------|
| `clsx` | 条件合并类名 | `clsx("a", false && "b", "c")` → `"a c"` |
| `tailwind-merge` | 智能去重冲突的 Tailwind 类 | `twMerge("px-2 px-4")` → `"px-4"` |

**使用示例**：

```tsx
// 条件样式 + 用户自定义样式合并
<div className={cn(
  "px-4 py-2",                    // 基础样式
  isActive && "bg-primary",       // 条件样式
  className                       // 用户传入的自定义样式
)} />

// cn("px-4 py-2", "px-8") → "py-2 px-8" (px-8 覆盖 px-4)
```

### CVA 变体模式 (Class Variance Authority)

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  // 基础样式（所有变体共享）
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    // 变体定义
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    // 默认值
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**使用方式**：

```tsx
// 基础用法
<Button>Default Button</Button>

// 指定变体
<Button variant="destructive" size="lg">Delete</Button>

// 自定义样式（会与变体样式合并）
<Button className="w-full">Full Width</Button>
```

**CVA 的优势**：
1. 类型安全：TypeScript 自动推断 variant 和 size 的可选值
2. 组合灵活：variant × size 的所有组合自动可用
3. 默认值：不传参数时使用 defaultVariants
4. 可扩展：通过 className 添加额外样式

### Radix UI 原语封装

```tsx
// components/ui/progress.tsx
"use client"  // 🔑 需要客户端交互，必须标记

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    // Radix 提供功能，我们添加样式
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className  // 允许用户覆盖样式
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        // 通过 transform 实现进度动画
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
```

**Radix UI 原语的特点**：
- 无样式：只提供功能和结构，样式完全自定义
- 可访问性：内置 ARIA 属性、键盘导航
- 组合式：Root + 子组件的组合模式

### asChild 模式

```tsx
// Button 组件支持 asChild
function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props} />
}

// 使用：将 Button 样式应用到 Link
<Button asChild>
  <Link href="/about">About</Link>
</Button>
// 渲染结果：<a href="/about" class="...button样式...">About</a>
```

`Slot` 组件来自 Radix UI，它会将 Button 的所有 props 和样式"转移"给子元素。

---

## 组件架构图

```
┌─────────────────────────────────────────────────┐
│           你的业务组件                           │
│     (ImageUploader, ImageProcessor 等)          │
├─────────────────────────────────────────────────┤
│           shadcn/ui 组件                        │
│  (Button, Progress, Card, Alert, Separator)     │
│  • 预设样式，可自定义                            │
│  • 使用 CVA 管理变体                            │
├─────────────────────────────────────────────────┤
│           Radix UI 原语                         │
│  (@radix-ui/react-progress, react-slot 等)      │
│  • 无样式，纯功能                               │
│  • 内置可访问性 (a11y)                          │
│  • 键盘导航支持                                 │
├─────────────────────────────────────────────────┤
│           样式工具链                            │
│  CVA (变体管理) + cn() (类名合并)               │
│  Tailwind CSS 4 + CSS 变量主题系统              │
└─────────────────────────────────────────────────┘
```

---

## 理解检查点

完成本阶段学习后，你应该能回答：

1. **`next/font/google` 相比传统字体加载有什么优势？**
   > 构建时下载字体并内联，避免运行时网络请求，消除字体闪烁和布局偏移。

2. **Tailwind CSS 4 的 `@theme inline` 是做什么的？**
   > 将 CSS 变量映射到 Tailwind 类名，使 `--primary` 可以通过 `bg-primary` 等类使用。

3. **为什么项目使用 OKLCH 而不是 HSL？**
   > OKLCH 是感知均匀的色彩空间，相同数值变化产生相同视觉变化，且支持更广色域。

4. **`cn()` 函数解决什么问题？**
   > 合并条件类名 (clsx) 并智能处理 Tailwind 类冲突 (tailwind-merge)，如 `cn("px-2", "px-4")` → `"px-4"`。

5. **CVA (class-variance-authority) 的作用是什么？**
   > 管理组件的样式变体，提供类型安全的 variant/size 等 props，自动生成对应的 Tailwind 类。

6. **为什么 Progress 组件需要 `"use client"` 但 Button 不需要？**
   > Progress 使用了 Radix UI 原语，内部有状态和 DOM 操作需要客户端运行；Button 只是静态样式映射，可以在服务端渲染。

---

## 下一步

继续 [第三阶段：核心业务逻辑](./03-core-logic.md) 学习主页面实现、图像处理工具函数和自定义 Hook 状态管理。
