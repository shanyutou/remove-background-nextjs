'use client'

/**
 * Progress indicator component for model loading and image processing
 * Shows progress bar with status message
 */

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { type ProcessingStatus } from '@/hooks/useBackgroundRemoval'

export interface ProgressIndicatorProps {
  /** Current processing status */
  status: ProcessingStatus
  /** Model loading progress (0-100) */
  modelProgress: number
  /** Processing progress (0-100) */
  processingProgress: number
  /** Current stage message */
  message?: string
  /** Custom class name */
  className?: string
}

/** Status to display text mapping */
const statusLabels: Record<ProcessingStatus, string> = {
  idle: 'Ready',
  validating: 'Validating file...',
  'loading-model': 'Loading AI model...',
  preprocessing: 'Preparing image...',
  processing: 'Removing background...',
  complete: 'Complete!',
  error: 'Error occurred',
}

/** Get overall progress based on status */
function getOverallProgress(
  status: ProcessingStatus,
  modelProgress: number,
  processingProgress: number
): number {
  switch (status) {
    case 'idle':
      return 0
    case 'validating':
      return 5
    case 'loading-model':
      // Model loading is 0-50% of overall progress
      return Math.round(modelProgress * 0.5)
    case 'preprocessing':
      return 55
    case 'processing':
      // Processing is 60-95% of overall progress
      return 60 + Math.round(processingProgress * 0.35)
    case 'complete':
      return 100
    case 'error':
      return 0
    default:
      return 0
  }
}

export function ProgressIndicator({
  status,
  modelProgress,
  processingProgress,
  message,
  className,
}: ProgressIndicatorProps) {
  const overallProgress = getOverallProgress(status, modelProgress, processingProgress)
  const displayMessage = message || statusLabels[status]
  const isActive = status !== 'idle' && status !== 'complete' && status !== 'error'

  return (
    <Card className={className}>
      <CardContent className="py-6">
        <div className="space-y-4">
          {/* Status header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isActive && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <span className="text-sm font-medium">{displayMessage}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {overallProgress}%
            </span>
          </div>

          {/* Progress bar */}
          <Progress value={overallProgress} className="h-2" />

          {/* Detailed progress info */}
          {status === 'loading-model' && (
            <p className="text-xs text-muted-foreground">
              First-time setup: downloading AI model (~176MB). This will be cached for future use.
            </p>
          )}

          {status === 'processing' && (
            <p className="text-xs text-muted-foreground">
              AI is analyzing and removing the background...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgressIndicator
