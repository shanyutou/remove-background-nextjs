'use client'

/**
 * Image preview component with checkered background for transparency
 * Shows original and processed images with download functionality
 */

import { Download, RotateCcw, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface ImagePreviewProps {
  /** Original image preview URL */
  originalPreview?: string | null
  /** Processed result preview URL */
  resultPreview?: string | null
  /** Processing time in milliseconds */
  processingTime?: number | null
  /** Callback to download result */
  onDownload?: () => void
  /** Callback to reset/start over */
  onReset?: () => void
  /** Whether download is in progress */
  isDownloading?: boolean
  /** Custom class name */
  className?: string
}

export function ImagePreview({
  originalPreview,
  resultPreview,
  processingTime,
  onDownload,
  onReset,
  isDownloading = false,
  className,
}: ImagePreviewProps) {
  const hasResult = !!resultPreview

  return (
    <Card className={className}>
      <CardContent className="py-6">
        {/* Image comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original image */}
          {originalPreview && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Original
              </p>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalPreview}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Result image with checkered background */}
          {hasResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Result
                </p>
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div
                className="relative aspect-square rounded-lg overflow-hidden"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultPreview}
                  alt="Background removed"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Processing info */}
        {processingTime && (
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Processed in {(processingTime / 1000).toFixed(2)} seconds
          </p>
        )}

        {/* Actions */}
        {hasResult && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={onDownload}
                disabled={isDownloading}
                className="flex-1 sm:flex-none"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download PNG'}
              </Button>
              <Button
                variant="outline"
                onClick={onReset}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Process Another
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ImagePreview
