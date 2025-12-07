'use client'

/**
 * Image upload component with drag-and-drop support
 * Validates file type (JPG, PNG, WebP) and size (≤10MB)
 */

import { useCallback, useState, useRef } from 'react'
import { Upload, ImageIcon, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  validateImageFile,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
} from '@/lib/imageUtils'

export interface ImageUploaderProps {
  /** Callback when a valid file is selected */
  onFileSelect: (file: File) => void
  /** Whether the uploader is disabled */
  disabled?: boolean
  /** Custom class name */
  className?: string
}

export function ImageUploader({
  onFileSelect,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file selection from input or drop
   */
  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file')
        return
      }

      onFileSelect(file)
    },
    [onFileSelect]
  )

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      // Reset input so the same file can be selected again
      e.target.value = ''
    },
    [handleFile]
  )

  /**
   * Handle click on upload area
   */
  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  // Format supported formats for display
  const formatList = SUPPORTED_FORMATS.map((f) =>
    f.replace('image/', '').toUpperCase()
  ).join(', ')

  // Format max file size for display
  const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <Card
        className={`
          cursor-pointer transition-all duration-200
          ${isDragging ? 'border-primary border-2 bg-primary/5' : 'border-dashed border-2'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-muted/50'}
        `}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {/* Icon */}
          <div
            className={`
              mb-4 rounded-full p-4
              ${isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
            `}
          >
            {isDragging ? (
              <Upload className="h-8 w-8" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragging ? 'Drop image here' : 'Upload an image'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to browse
            </p>
          </div>

          {/* Upload button */}
          <Button
            variant="outline"
            className="mt-4"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Select Image
          </Button>

          {/* File requirements */}
          <p className="mt-4 text-xs text-muted-foreground">
            {formatList} up to {maxSizeMB}MB
          </p>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ImageUploader
