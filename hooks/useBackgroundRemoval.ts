'use client'

/**
 * Custom hook for managing background removal state and operations
 * Provides a complete interface for image processing workflow
 */

import { useState, useCallback, useRef } from 'react'
import {
  removeBackground,
  type RemoveBackgroundResult,
  type ProcessingStage,
} from '@/lib/removeBackground'
import { type ProgressInfo } from '@/lib/modelLoader'
import {
  validateImageFile,
  downloadImage,
  canvasToDataURL,
} from '@/lib/imageUtils'

/** Processing status states */
export type ProcessingStatus =
  | 'idle'
  | 'validating'
  | 'loading-model'
  | 'preprocessing'
  | 'processing'
  | 'complete'
  | 'error'

/** State interface for the hook */
export interface BackgroundRemovalState {
  /** Current processing status */
  status: ProcessingStatus
  /** Error message if status is 'error' */
  error: string | null
  /** Model loading progress (0-100) */
  modelProgress: number
  /** Image processing progress (0-100) */
  processingProgress: number
  /** Current stage message */
  stageMessage: string
  /** Original image file */
  originalFile: File | null
  /** Original image as data URL for preview */
  originalPreview: string | null
  /** Processing result */
  result: RemoveBackgroundResult | null
  /** Result as data URL for preview */
  resultPreview: string | null
  /** Processing time in milliseconds */
  processingTime: number | null
}

/** Return type of the hook */
export interface UseBackgroundRemovalReturn extends BackgroundRemovalState {
  /** Process an image file */
  processImage: (file: File) => Promise<void>
  /** Reset to initial state */
  reset: () => void
  /** Download the result as PNG */
  downloadResult: (filename?: string) => Promise<void>
  /** Check if currently processing */
  isProcessing: boolean
  /** Check if model is loading */
  isModelLoading: boolean
  /** Check if result is ready */
  isComplete: boolean
}

/** Initial state */
const initialState: BackgroundRemovalState = {
  status: 'idle',
  error: null,
  modelProgress: 0,
  processingProgress: 0,
  stageMessage: '',
  originalFile: null,
  originalPreview: null,
  result: null,
  resultPreview: null,
  processingTime: null,
}

/**
 * Custom hook for background removal functionality
 * Manages the complete workflow: validation → model loading → processing → result
 */
export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [state, setState] = useState<BackgroundRemovalState>(initialState)

  // Track if processing is in progress to prevent concurrent operations
  const isProcessingRef = useRef(false)

  /**
   * Updates state partially
   */
  const updateState = useCallback((updates: Partial<BackgroundRemovalState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Resets state to initial values
   */
  const reset = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    if (state.originalPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(state.originalPreview)
    }
    isProcessingRef.current = false
    setState(initialState)
  }, [state.originalPreview])

  /**
   * Handles model loading progress updates
   */
  const handleModelProgress = useCallback(
    (progress: ProgressInfo) => {
      updateState({
        modelProgress: progress.progress ?? 0,
        stageMessage:
          progress.status === 'download'
            ? `Downloading model: ${progress.file ?? 'model files'}...`
            : progress.status === 'ready'
              ? 'Model ready'
              : 'Loading model...',
      })
    },
    [updateState]
  )

  /**
   * Handles processing stage updates
   */
  const handleProcessingProgress = useCallback(
    (stage: ProcessingStage, progress: number, message?: string) => {
      const statusMap: Record<ProcessingStage, ProcessingStatus> = {
        'loading-model': 'loading-model',
        preprocessing: 'preprocessing',
        inference: 'processing',
        postprocessing: 'processing',
        complete: 'complete',
      }

      updateState({
        status: statusMap[stage],
        processingProgress: progress,
        stageMessage: message ?? stage,
      })
    },
    [updateState]
  )

  /**
   * Process an image file to remove its background
   */
  const processImage = useCallback(
    async (file: File): Promise<void> => {
      // Prevent concurrent processing
      if (isProcessingRef.current) {
        console.warn('Processing already in progress')
        return
      }

      isProcessingRef.current = true

      try {
        // Stage 1: Validate file
        updateState({
          status: 'validating',
          error: null,
          processingProgress: 0,
          modelProgress: 0,
          stageMessage: 'Validating file...',
          originalFile: file,
          result: null,
          resultPreview: null,
          processingTime: null,
        })

        const validation = validateImageFile(file)
        if (!validation.valid) {
          throw new Error(validation.error ?? 'Invalid file')
        }

        // Create preview of original image
        const originalPreview = URL.createObjectURL(file)
        updateState({ originalPreview })

        // Stage 2-5: Process image (model loading, preprocessing, inference, postprocessing)
        updateState({
          status: 'loading-model',
          stageMessage: 'Loading AI model...',
        })

        const result = await removeBackground(
          file,
          handleProcessingProgress,
          handleModelProgress
        )

        // Generate result preview
        const resultPreview = canvasToDataURL(result.canvas)

        // Update final state
        updateState({
          status: 'complete',
          result,
          resultPreview,
          processingTime: result.processingTime,
          processingProgress: 100,
          stageMessage: 'Complete',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred'

        updateState({
          status: 'error',
          error: errorMessage,
          stageMessage: 'Error',
        })

        console.error('Background removal failed:', error)
      } finally {
        isProcessingRef.current = false
      }
    },
    [updateState, handleProcessingProgress, handleModelProgress]
  )

  /**
   * Download the processed result as PNG
   */
  const downloadResult = useCallback(
    async (filename?: string): Promise<void> => {
      if (!state.result?.canvas) {
        console.warn('No result to download')
        return
      }

      const defaultFilename = state.originalFile
        ? `${state.originalFile.name.replace(/\.[^/.]+$/, '')}-no-bg.png`
        : 'removed-background.png'

      await downloadImage(state.result.canvas, filename ?? defaultFilename)
    },
    [state.result, state.originalFile]
  )

  // Computed properties
  const isProcessing =
    state.status === 'validating' ||
    state.status === 'loading-model' ||
    state.status === 'preprocessing' ||
    state.status === 'processing'

  const isModelLoading = state.status === 'loading-model'
  const isComplete = state.status === 'complete'

  return {
    ...state,
    processImage,
    reset,
    downloadResult,
    isProcessing,
    isModelLoading,
    isComplete,
  }
}

export default useBackgroundRemoval
