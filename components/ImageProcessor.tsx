'use client'

/**
 * Main image processor component
 * Integrates upload, progress, and preview components into a complete workflow
 */

import { useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ImageUploader } from '@/components/ImageUploader'
import { ProgressIndicator } from '@/components/ProgressIndicator'
import { ImagePreview } from '@/components/ImagePreview'
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval'

export interface ImageProcessorProps {
  /** Custom class name */
  className?: string
}

export function ImageProcessor({ className }: ImageProcessorProps) {
  const {
    status,
    error,
    modelProgress,
    processingProgress,
    stageMessage,
    originalPreview,
    resultPreview,
    processingTime,
    processImage,
    reset,
    downloadResult,
    isProcessing,
    isComplete,
  } = useBackgroundRemoval()

  /**
   * Handle file selection from uploader
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      processImage(file)
    },
    [processImage]
  )

  /**
   * Handle download button click
   */
  const handleDownload = useCallback(() => {
    downloadResult()
  }, [downloadResult])

  /**
   * Handle reset button click
   */
  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  // Show uploader when idle or after error
  const showUploader = status === 'idle'

  // Show progress when processing
  const showProgress = isProcessing

  // Show preview when complete or has result
  const showPreview = isComplete || resultPreview

  // Show error alert
  const showError = status === 'error' && error

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Error alert */}
        {showError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <button
                onClick={handleReset}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload section */}
        {showUploader && (
          <ImageUploader
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
          />
        )}

        {/* Progress section */}
        {showProgress && (
          <ProgressIndicator
            status={status}
            modelProgress={modelProgress}
            processingProgress={processingProgress}
            message={stageMessage}
          />
        )}

        {/* Preview section */}
        {showPreview && (
          <ImagePreview
            originalPreview={originalPreview}
            resultPreview={resultPreview}
            processingTime={processingTime}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

export default ImageProcessor
