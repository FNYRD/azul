import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-cream rounded-b-3xl shadow-modal flex flex-col slide-down"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          maxHeight: '85dvh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-border shrink-0">
          <h2 className="font-display text-xl text-ink font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-warm transition-colors text-ink-light font-sans text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
