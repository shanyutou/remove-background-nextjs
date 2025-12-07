'use client'

import { Sparkles, Shield, Zap } from 'lucide-react'
import { ImageProcessor } from '@/components/ImageProcessor'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            AI Background Remover
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Remove image backgrounds instantly with AI.
            100% free, runs locally in your browser - your images never leave your device.
          </p>
        </header>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 md:mb-12 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">100% Private</p>
              <p className="text-xs text-muted-foreground">Processed locally</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Fast Processing</p>
              <p className="text-xs text-muted-foreground">Results in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">AI Powered</p>
              <p className="text-xs text-muted-foreground">RMBG-1.4 model</p>
            </div>
          </div>
        </div>

        {/* Main processor */}
        <div className="max-w-2xl mx-auto">
          <ImageProcessor />
        </div>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://huggingface.co/briaai/RMBG-1.4"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              RMBG-1.4
            </a>
            {' '}and{' '}
            <a
              href="https://github.com/xenova/transformers.js"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Transformers.js
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
