/**
 * Model loader for background removal using Transformers.js
 * Handles model initialization, caching, and progress tracking
 * Uses dynamic imports to ensure client-side only execution
 */

/** Model configuration */
export const MODEL_CONFIG = {
  task: 'image-segmentation',
  model: 'briaai/RMBG-1.4',
  device: 'wasm',
} as const

/** Progress callback type */
export type ProgressCallback = (progress: ProgressInfo) => void

/** Progress information structure */
export interface ProgressInfo {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready'
  name?: string
  file?: string
  progress?: number
  loaded?: number
  total?: number
}

/** Model loading state */
export interface ModelState {
  isLoading: boolean
  isReady: boolean
  error: Error | null
  progress: number
}

// Singleton instance for the segmentation pipeline
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let segmenterInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any> | null = null

/**
 * Dynamically imports and configures Transformers.js
 * Only runs in browser environment
 */
async function getTransformers() {
  const transformers = await import('@huggingface/transformers')

  // Configure environment for browser
  transformers.env.allowLocalModels = false
  transformers.env.useBrowserCache = true

  return transformers
}

/**
 * Gets the singleton segmenter instance, initializing if necessary
 * Uses lazy loading to avoid blocking initial page load
 */
export async function getSegmenter(
  onProgress?: ProgressCallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // Return existing instance if ready
  if (segmenterInstance) {
    onProgress?.({ status: 'ready', progress: 100 })
    return segmenterInstance
  }

  // Return existing loading promise if in progress
  if (loadingPromise) {
    return loadingPromise
  }

  // Start new loading process
  loadingPromise = initializeModel(onProgress)

  try {
    segmenterInstance = await loadingPromise
    return segmenterInstance
  } catch (error) {
    // Reset on failure to allow retry
    loadingPromise = null
    throw error
  }
}

/**
 * Initializes the segmentation model
 */
async function initializeModel(
  onProgress?: ProgressCallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  onProgress?.({ status: 'initiate', progress: 0 })

  try {
    // Dynamic import of Transformers.js
    const { pipeline } = await getTransformers()

    const segmenter = await pipeline(
      MODEL_CONFIG.task,
      MODEL_CONFIG.model,
      {
        // @ts-expect-error - device option is valid for ONNX runtime but not in type definitions
        device: MODEL_CONFIG.device,
        progress_callback: (progressData: ProgressInfo) => {
          // Normalize progress data
          const normalizedProgress = normalizeProgress(progressData)
          onProgress?.(normalizedProgress)
        },
      }
    )

    onProgress?.({ status: 'ready', progress: 100 })
    return segmenter
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to load model')
    throw err
  }
}

/**
 * Normalizes progress data from Transformers.js
 */
function normalizeProgress(data: ProgressInfo): ProgressInfo {
  // Calculate overall progress percentage
  let progress = 0

  if (data.status === 'progress' && data.loaded && data.total) {
    progress = Math.round((data.loaded / data.total) * 100)
  } else if (data.status === 'done') {
    progress = 100
  } else if (data.status === 'ready') {
    progress = 100
  }

  return {
    ...data,
    progress,
  }
}

/**
 * Checks if the model is currently loaded and ready
 */
export function isModelReady(): boolean {
  return segmenterInstance !== null
}

/**
 * Checks if the model is currently loading
 */
export function isModelLoading(): boolean {
  return loadingPromise !== null && segmenterInstance === null
}

/**
 * Preloads the model without waiting for completion
 * Useful for starting model download on page load
 */
export function preloadModel(onProgress?: ProgressCallback): void {
  if (!segmenterInstance && !loadingPromise) {
    getSegmenter(onProgress).catch((error) => {
      console.error('Model preload failed:', error)
    })
  }
}

/**
 * Disposes the current model instance
 * Frees up memory - use when model is no longer needed
 */
export async function disposeModel(): Promise<void> {
  if (segmenterInstance) {
    try {
      if (typeof segmenterInstance.dispose === 'function') {
        await segmenterInstance.dispose()
      }
    } catch (error) {
      console.warn('Error disposing model:', error)
    }
    segmenterInstance = null
  }
  loadingPromise = null
}

/**
 * Checks WebAssembly support in the browser
 */
export function checkWasmSupport(): { supported: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Not in browser environment' }
  }

  try {
    if (typeof WebAssembly !== 'object') {
      return {
        supported: false,
        error: 'WebAssembly is not supported in this browser',
      }
    }

    // Check for required WebAssembly features
    if (typeof WebAssembly.instantiate !== 'function') {
      return {
        supported: false,
        error: 'WebAssembly.instantiate is not available',
      }
    }

    return { supported: true }
  } catch {
    return {
      supported: false,
      error: 'Failed to check WebAssembly support',
    }
  }
}

/**
 * Gets estimated model size for user information
 */
export function getModelInfo(): {
  name: string
  size: string
  parameters: string
} {
  return {
    name: 'RMBG-1.4',
    size: '~176MB',
    parameters: '44.1M',
  }
}
