# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered background removal web application built with Next.js 16. It runs deep learning models (RMBG-1.4) entirely in the browser using Transformers.js and ONNX Runtime Web, ensuring complete privacy by processing images locally without server uploads.

**Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, @xenova/transformers

## Development Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Build & Production
npm run build        # Build for production
npm start            # Run production build

# Linting
npm run lint         # Run ESLint
```

## Project Architecture

### Directory Structure

```
app/                 # Next.js App Router pages
├── page.tsx         # Main application page (currently default template)
├── layout.tsx       # Root layout with Geist fonts
└── globals.css      # Global styles

components/
├── ui/              # shadcn/ui components (button, card, progress, alert, separator)
└── [future]         # ImageUploader, ImageProcessor, ImagePreview, ProgressIndicator

lib/
├── utils.ts         # shadcn/ui utilities (cn helper)
└── [future]         # removeBackground.ts, imageUtils.ts, modelLoader.ts

hooks/               # [to be created] Custom React hooks
└── [future]         # useBackgroundRemoval.ts
```

### Key Architecture Concepts

**Client-Side AI Processing**: All AI inference must run in the browser using `'use client'` directive. The RMBG-1.4 model is loaded from HuggingFace CDN and cached in IndexedDB for subsequent uses.

**Image Processing Pipeline**:
1. User uploads image (file input or drag-and-drop)
2. Image loaded to Canvas and resized to 1024×1024
3. Convert to Tensor format (Float32Array)
4. RMBG-1.4 model inference via ONNX Runtime Web (WASM)
5. Generate segmentation mask (0-255 values)
6. Apply mask to alpha channel for transparency
7. Render result with checkered background pattern
8. Export as PNG with transparent background

**Component Architecture**:
- `ImageUploader.tsx` - Handles file upload (click/drag-drop), validation (JPG/PNG/WebP, ≤10MB)
- `ImageProcessor.tsx` - Main orchestrator component integrating upload/process/preview flow
- `ProgressIndicator.tsx` - Shows model loading and processing progress
- `ImagePreview.tsx` - Displays result with checkered background and download button
- `useBackgroundRemoval.ts` - Custom hook managing state (upload, processing, complete, error)

## Critical Configuration

### Next.js Config for WASM Support

The `next.config.ts` MUST be configured to support WebAssembly and ONNX Runtime:

```typescript
const nextConfig: NextConfig = {
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

### Client-Side Components

All components using Transformers.js must start with `'use client'`:

```tsx
'use client'
import { pipeline } from '@xenova/transformers'
```

## Core Implementation Patterns

### Model Loading

```typescript
import { pipeline } from '@xenova/transformers'

// Load image segmentation pipeline
const segmenter = await pipeline(
  'image-segmentation',
  'briaai/RMBG-1.4',
  { device: 'wasm' }
)
```

### Image Processing Flow

```typescript
// 1. Load to Canvas
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
ctx.drawImage(image, 0, 0, 1024, 1024)

// 2. Get ImageData
const imageData = ctx.getImageData(0, 0, 1024, 1024)

// 3. Run inference
const result = await segmenter(imageData)

// 4. Apply mask to alpha channel
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i + 3] = mask[i / 4] // Set transparency
}

// 5. Export PNG
const blob = await canvas.toBlob('image/png')
```

## Development Guidelines

### State Management
- Use the custom `useBackgroundRemoval` hook for managing upload/processing/complete states
- Track model loading progress separately from image processing progress
- Handle errors gracefully with user-friendly messages

### Performance Targets
- First model load: ≤5 seconds (network dependent)
- Single image processing: ≤3 seconds (1024×1024)
- Memory usage: ≤500MB (including model)
- First contentful paint: ≤2 seconds (excluding model)

### File Validation
- Supported formats: JPG, PNG, WebP
- Max file size: 10MB
- Auto-resize to 1024×1024 for model input

### Browser Compatibility
- Requires WebAssembly support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Canvas API Level 2
- File API with FileReader

## Styling

This project uses **Tailwind CSS 4** with shadcn/ui components. The design should be minimal and focused on the core functionality. Use the existing shadcn/ui components from `components/ui/` for consistency.

## Privacy & Security

**Critical**: This is a privacy-focused application. All image processing MUST occur client-side:
- ✅ Images never uploaded to servers
- ✅ All computation in browser (WASM)
- ✅ No user data collection or tracking
- ✅ Models loaded from official HuggingFace CDN

## Reference Documentation

- **Project Requirements**: See `docs/REQUIREMENTS.md` for detailed functional requirements
- **MVP Plan**: See `docs/MVP_PLAN.md` for development checklist and implementation steps
- **Reference Architecture**: See `Remove Background Web-示例/ARCHITECTURE.md` for original implementation details
- **Transformers.js**: https://github.com/xenova/transformers.js
- **RMBG-1.4 Model**: https://huggingface.co/briaai/RMBG-1.4 (44.1M parameters, IS-Net architecture)
- **ONNX Runtime Web**: https://onnxruntime.ai/docs/get-started/with-javascript.html

## Current Status

The project is in initial setup phase:
- ✅ Next.js 16 initialized with TypeScript and Tailwind CSS 4
- ✅ shadcn/ui configured with base components (button, card, progress, alert, separator)
- ✅ @xenova/transformers and lucide-react installed
- ⬜ Core implementation (ImageUploader, ImageProcessor, etc.) not yet built
- ⬜ next.config.ts needs WASM configuration
- ⬜ Background removal logic not implemented

The `app/page.tsx` still contains the default Next.js template and needs to be replaced with the main application interface.
