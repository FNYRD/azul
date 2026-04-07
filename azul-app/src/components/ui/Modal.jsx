import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return
    // iOS Safari ignores overflow:hidden on body — fix with position:fixed
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
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
        style={{ maxHeight: '85dvh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-cream-border shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <h2 className="font-display text-xl text-ink font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-warm transition-colors text-ink-light font-sans text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {/* Content — overscroll:none evita rubber-band en iOS */}
        <div className="overflow-y-auto p-5 flex-1" style={{ overscrollBehavior: 'none' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
