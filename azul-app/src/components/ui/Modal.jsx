import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children }) {
  // Seguir el visual viewport para sobrevivir al teclado en iOS Safari
  const [vv, setVv] = useState(() => ({
    top: 0, left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    if (!isOpen) return

    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'

    const update = () => {
      const v = window.visualViewport
      setVv({
        top:    v ? v.offsetTop  : 0,
        left:   v ? v.offsetLeft : 0,
        width:  v ? v.width      : window.innerWidth,
        height: v ? v.height     : window.innerHeight,
      })
    }

    update()
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overflow = ''
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [isOpen])

  if (!isOpen) return null

  const contentMaxH = Math.floor(vv.height * 0.85) - 57  // 57 ≈ header

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: vv.top, left: vv.left,
        width: vv.width, height: vv.height,
        zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      {/* Backdrop */}
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
        {/* Contenido */}
        <div
          className="p-5"
          style={{ overflowY: 'auto', maxHeight: contentMaxH, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
