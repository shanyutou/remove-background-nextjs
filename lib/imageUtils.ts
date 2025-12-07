/**
 * Image processing utilities for background removal
 * All processing happens client-side for privacy
 */

/** Default size for model input */
export const MODEL_INPUT_SIZE = 1024

/** Supported image MIME types */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Maximum file size in bytes (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface ImageLoadResult {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  originalWidth: number
  originalHeight: number
}

/**
 * Validates an image file for format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_FORMATS.includes(file.type as typeof SUPPORTED_FORMATS[number])) {
    return {
      valid: false,
      error: `Unsupported format. Please use JPG, PNG, or WebP.`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 10MB.`,
    }
  }

  return { valid: true }
}

/**
 * Loads an image file into an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Loads an image file to a Canvas element, resizing to target dimensions
 * Maintains aspect ratio by fitting the image and centering it
 */
export async function loadImageToCanvas(
  file: File,
  targetSize: number = MODEL_INPUT_SIZE
): Promise<ImageLoadResult> {
  const img = await loadImage(file)

  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Calculate scaling to fit image within target size while maintaining aspect ratio
  const scale = Math.min(targetSize / img.width, targetSize / img.height)
  const scaledWidth = img.width * scale
  const scaledHeight = img.height * scale

  // Center the image on the canvas
  const offsetX = (targetSize - scaledWidth) / 2
  const offsetY = (targetSize - scaledHeight) / 2

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, targetSize, targetSize)

  // Draw the resized image
  ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

  return {
    canvas,
    ctx,
    originalWidth: img.width,
    originalHeight: img.height,
  }
}

/**
 * Resizes an image to target dimensions
 * Returns a new canvas with the resized image
 */
export function resizeImage(
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number = targetWidth
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

  return canvas
}

/**
 * Gets ImageData from a canvas
 */
export function getImageData(
  canvas: HTMLCanvasElement,
  x: number = 0,
  y: number = 0,
  width?: number,
  height?: number
): ImageData {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  return ctx.getImageData(x, y, width ?? canvas.width, height ?? canvas.height)
}

/**
 * Puts ImageData back to a canvas
 */
export function putImageData(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  x: number = 0,
  y: number = 0
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.putImageData(imageData, x, y)
}

/**
 * Converts ImageData to a Blob (PNG format)
 */
export function imageDataToBlob(
  imageData: ImageData,
  type: string = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    ctx.putImageData(imageData, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      type,
      quality
    )
  })
}

/**
 * Converts a canvas to a Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      type,
      quality
    )
  })
}

/**
 * Converts a canvas to a data URL
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality?: number
): string {
  return canvas.toDataURL(type, quality)
}

/**
 * Downloads an image blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Downloads a canvas as a PNG file
 */
export async function downloadImage(
  canvas: HTMLCanvasElement,
  filename: string = 'removed-background.png'
): Promise<void> {
  const blob = await canvasToBlob(canvas, 'image/png')
  downloadBlob(blob, filename)
}

/**
 * Creates a checkered background pattern for transparency preview
 */
export function createCheckerboardPattern(
  size: number = 10,
  color1: string = '#ffffff',
  color2: string = '#e0e0e0'
): HTMLCanvasElement {
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = size * 2
  patternCanvas.height = size * 2

  const ctx = patternCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Draw checkerboard pattern
  ctx.fillStyle = color1
  ctx.fillRect(0, 0, size * 2, size * 2)

  ctx.fillStyle = color2
  ctx.fillRect(0, 0, size, size)
  ctx.fillRect(size, size, size, size)

  return patternCanvas
}

/**
 * Draws an image with a checkered background for transparency preview
 */
export function drawWithCheckerboard(
  canvas: HTMLCanvasElement,
  image: HTMLCanvasElement | HTMLImageElement,
  checkerSize: number = 10
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Create and apply checkerboard pattern
  const patternCanvas = createCheckerboardPattern(checkerSize)
  const pattern = ctx.createPattern(patternCanvas, 'repeat')

  if (pattern) {
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Draw the image on top
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
}
