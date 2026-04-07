import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return
    // Bloquear scroll sin position:fixed en body (que rompe la posición del modal)
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', touchAction: 'none' }}
    >
      {/* Backdrop — touch-action:none heredado, bloquea scroll en zona oscura */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(42,75,82,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-cream rounded-b-3xl shadow-modal flex flex-col slide-down"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
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
        {/* Contenido — pan-y sobreescribe touch-action:none del padre para permitir scroll interno */}
        <div className="p-5" style={{ overflowY: 'auto', maxHeight: 'calc(85dvh - 65px)', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
