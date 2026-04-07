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
    // Solo resize (teclado abre/cierra) — NO scroll, para que el header no se mueva
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overflow = ''
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: vv.top, left: vv.left,
        width: vv.width, height: vv.height,
        zIndex: 9999,
        display: 'flex', alignItems: 'stretch', justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(42,75,82,0.5)', backdropFilter: 'blur(4px)', borderRadius: '0 0 24px 24px' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-cream flex flex-col slide-down"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', borderRadius: '0 0 24px 24px' }}
      >
        {/* Contenido — ocupa el espacio restante */}
        <div
          className="p-5"
          style={{ overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
