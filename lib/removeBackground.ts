/**
 * Background removal core logic using RMBG-1.4 model
 * Handles image preprocessing, model inference, and mask application
 */

import { getSegmenter, type ProgressCallback } from './modelLoader'
import {
  loadImageToCanvas,
  getImageData,
  putImageData,
  canvasToBlob,
  MODEL_INPUT_SIZE,
} from './imageUtils'

/** Result from background removal process */
export interface RemoveBackgroundResult {
  /** Canvas with transparent background */
  canvas: HTMLCanvasElement
  /** Original image dimensions */
  originalWidth: number
  originalHeight: number
  /** Processing time in milliseconds */
  processingTime: number
}

/** Progress stages for background removal */
export type ProcessingStage =
  | 'loading-model'
  | 'preprocessing'
  | 'inference'
  | 'postprocessing'
  | 'complete'

/** Progress callback for processing stages */
export type ProcessingProgressCallback = (
  stage: ProcessingStage,
  progress: number,
  message?: string
) => void

/**
 * Main function to remove background from an image
 * Handles the complete pipeline: load model → preprocess → inference → apply mask
 */
export async function removeBackground(
  file: File,
  onProgress?: ProcessingProgressCallback,
  onModelProgress?: ProgressCallback
): Promise<RemoveBackgroundResult> {
  const startTime = performance.now()

  // Stage 1: Load model (if not already loaded)
  onProgress?.('loading-model', 0, 'Loading AI model...')
  const segmenter = await getSegmenter(onModelProgress)
  onProgress?.('loading-model', 100, 'Model ready')

  // Stage 2: Preprocess image
  onProgress?.('preprocessing', 0, 'Loading image...')
  const { canvas, ctx, originalWidth, originalHeight } = await loadImageToCanvas(
    file,
    MODEL_INPUT_SIZE
  )
  onProgress?.('preprocessing', 100, 'Image loaded')

  // Stage 3: Run model inference
  onProgress?.('inference', 0, 'Processing image...')

  // Get image data URL for the segmenter
  const imageDataUrl = canvas.toDataURL('image/png')

  // Run the segmentation model
  // The Transformers.js pipeline expects an image URL or ImageData
  // Cast segmenter to callable type since TypeScript types are incomplete
  const segmenterFn = segmenter as unknown as (
    input: string,
    options?: { threshold?: number }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any[]>
  const result = await segmenterFn(imageDataUrl)

  onProgress?.('inference', 100, 'Segmentation complete')

  // Stage 4: Apply mask to create transparent background
  onProgress?.('postprocessing', 0, 'Applying transparency...')

  const outputCanvas = await applySegmentationMask(canvas, ctx, result)

  onProgress?.('postprocessing', 100, 'Processing complete')
  onProgress?.('complete', 100, 'Done')

  const processingTime = performance.now() - startTime

  return {
    canvas: outputCanvas,
    originalWidth,
    originalHeight,
    processingTime,
  }
}

/**
 * Applies the segmentation mask to create transparent background
 * The segmenter returns an array of objects with mask data
 */
async function applySegmentationMask(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  segmentationResult: any
): Promise<HTMLCanvasElement> {
  // Create output canvas
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = canvas.width
  outputCanvas.height = canvas.height
  const outputCtx = outputCanvas.getContext('2d')

  if (!outputCtx) {
    throw new Error('Failed to get output canvas context')
  }

  // Get original image data
  const imageData = getImageData(canvas)
  const pixels = imageData.data

  // The segmentation result contains mask data
  // RMBG-1.4 returns the foreground mask
  const maskData = await extractMaskData(segmentationResult, canvas.width, canvas.height)

  // Apply mask to alpha channel
  for (let i = 0; i < maskData.length; i++) {
    // Set alpha channel (every 4th value starting at index 3)
    pixels[i * 4 + 3] = maskData[i]
  }

  // Put the modified image data to output canvas
  putImageData(outputCanvas, imageData)

  return outputCanvas
}

/**
 * Extracts and normalizes mask data from segmentation result
 * Handles various output formats from Transformers.js
 */
async function extractMaskData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any,
  width: number,
  height: number
): Promise<Uint8Array> {
  const totalPixels = width * height
  const maskData = new Uint8Array(totalPixels)

  // Safety check for null/undefined result
  if (!result) {
    console.warn('No segmentation result, using opaque fallback')
    maskData.fill(255)
    return maskData
  }

  // Handle array of segmentation results (typical Transformers.js output)
  if (Array.isArray(result) && result.length > 0) {
    const segment = result[0]

    // Safety check for segment
    if (!segment) {
      console.warn('Empty segment in result, using opaque fallback')
      maskData.fill(255)
      return maskData
    }

    // Check if result has a mask property with image data
    if (segment.mask) {
      // The mask might be a RawImage object or similar
      const mask = segment.mask

      // Handle RawImage with toCanvas method (common in Transformers.js)
      if (typeof mask.toCanvas === 'function') {
        try {
          const maskCanvas = mask.toCanvas()
          const maskCtx = maskCanvas.getContext('2d')
          if (maskCtx) {
            const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
            const maskPixels = maskImageData.data

            // Resize if needed
            if (maskCanvas.width !== width || maskCanvas.height !== height) {
              return resizeMaskFromImageData(maskPixels, maskCanvas.width, maskCanvas.height, width, height)
            }

            // Extract mask values (use red channel or first channel)
            for (let i = 0; i < totalPixels; i++) {
              maskData[i] = maskPixels[i * 4] // Red channel
            }
            return maskData
          }
        } catch (e) {
          console.warn('Failed to extract mask via toCanvas:', e)
        }
      }

      if (mask.data) {
        // Direct data access
        const data = mask.data
        const maskWidth = mask.width || width
        const maskHeight = mask.height || height

        // Resize mask if dimensions don't match
        if (maskWidth !== width || maskHeight !== height) {
          return resizeMask(data, maskWidth, maskHeight, width, height)
        }

        // Convert mask data to Uint8Array (0-255)
        for (let i = 0; i < totalPixels; i++) {
          // Mask values are typically 0-255 or 0-1
          const value = data[i] ?? 0
          maskData[i] = value <= 1 ? Math.round(value * 255) : Math.round(value)
        }
        return maskData
      }

      // If mask is a Blob or has toDataURL method, extract pixel data
      if (typeof mask.toDataURL === 'function') {
        try {
          return extractMaskFromImage(await mask.toDataURL(), width, height)
        } catch (e) {
          console.warn('Failed to extract mask via toDataURL:', e)
        }
      }
    }

    // Handle score-based segmentation (fallback)
    if (typeof segment.score === 'number') {
      // Binary mask based on confidence threshold
      const threshold = 0.5
      maskData.fill(segment.score > threshold ? 255 : 0)
      return maskData
    }
  }

  // Handle direct tensor/array output
  if (result && result.data) {
    const data = result.data
    for (let i = 0; i < Math.min(data.length, totalPixels); i++) {
      const value = data[i] ?? 0
      maskData[i] = value <= 1 ? Math.round(value * 255) : Math.round(value)
    }
    return maskData
  }

  // Fallback: return fully opaque mask (no background removal)
  console.warn('Could not extract mask data, using opaque fallback')
  maskData.fill(255)
  return maskData
}

/**
 * Extracts mask data from an image URL
 */
async function extractMaskFromImage(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Draw and resize the mask image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const pixels = imageData.data
      const totalPixels = targetWidth * targetHeight
      const maskData = new Uint8Array(totalPixels)

      // Extract grayscale values (assuming mask is grayscale)
      for (let i = 0; i < totalPixels; i++) {
        // Use red channel or average of RGB
        maskData[i] = pixels[i * 4]
      }

      resolve(maskData)
    }

    img.onerror = () => reject(new Error('Failed to load mask image'))
    img.src = imageUrl
  })
}

/**
 * Resizes mask data using bilinear interpolation
 */
function resizeMask(
  data: ArrayLike<number>,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Uint8Array {
  const result = new Uint8Array(dstWidth * dstHeight)

  const xRatio = srcWidth / dstWidth
  const yRatio = srcHeight / dstHeight

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * xRatio)
      const srcY = Math.floor(y * yRatio)
      const srcIndex = srcY * srcWidth + srcX
      const dstIndex = y * dstWidth + x

      const value = data[srcIndex] || 0
      result[dstIndex] = value <= 1 ? Math.round(value * 255) : Math.round(value)
    }
  }

  return result
}

/**
 * Resizes mask from RGBA ImageData format
 */
function resizeMaskFromImageData(
  data: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Uint8Array {
  const result = new Uint8Array(dstWidth * dstHeight)

  const xRatio = srcWidth / dstWidth
  const yRatio = srcHeight / dstHeight

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * xRatio)
      const srcY = Math.floor(y * yRatio)
      const srcIndex = (srcY * srcWidth + srcX) * 4 // RGBA format
      const dstIndex = y * dstWidth + x

      // Use red channel value
      result[dstIndex] = data[srcIndex] || 0
    }
  }

  return result
}

/**
 * Convenience function to remove background and get result as Blob
 */
export async function removeBackgroundToBlob(
  file: File,
  onProgress?: ProcessingProgressCallback,
  onModelProgress?: ProgressCallback
): Promise<Blob> {
  const result = await removeBackground(file, onProgress, onModelProgress)
  return canvasToBlob(result.canvas, 'image/png')
}

/**
 * Convenience function to remove background and get result as data URL
 */
export async function removeBackgroundToDataURL(
  file: File,
  onProgress?: ProcessingProgressCallback,
  onModelProgress?: ProgressCallback
): Promise<string> {
  const result = await removeBackground(file, onProgress, onModelProgress)
  return result.canvas.toDataURL('image/png')
}
