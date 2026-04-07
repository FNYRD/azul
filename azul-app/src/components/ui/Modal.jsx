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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-cream rounded-t-3xl shadow-modal max-h-[92dvh] flex flex-col slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-cream-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-border shrink-0">
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
