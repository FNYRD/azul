import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, children }) {
  // Seguir el visual viewport para sobrevivir al teclado en iOS Safari
  const [vv, setVv] = useState(() => ({
    top: 0, left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    if (!isOpen) return

    // --- Bloqueo de scroll robusto (iOS Safari) ---
    // overflow:hidden NO alcanza en iOS: al enfocar un input el teclado
    // desplaza el documento de fondo y queda scrolleado hacia abajo al cerrar.
    // Técnica position:fixed → congela el body y preserva/restaura la posición.
    const scrollY = window.scrollY
    const de = document.documentElement
    const body = document.body

    de.style.overscrollBehavior = 'none'
    body.style.position = 'fixed'
    body.style.top      = `-${scrollY}px`
    body.style.left     = '0'
    body.style.right    = '0'
    body.style.width    = '100%'
    body.style.overflow = 'hidden'

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
      de.style.overscrollBehavior = ''
      body.style.position = ''
      body.style.top      = ''
      body.style.left     = ''
      body.style.right    = ''
      body.style.width    = ''
      body.style.overflow = ''
      window.visualViewport?.removeEventListener('resize', update)
      // Restaurar la posición exacta SIN animación (html tiene scroll-behavior:smooth)
      const prevBehavior = de.style.scrollBehavior
      de.style.scrollBehavior = 'auto'
      window.scrollTo(0, scrollY)
      de.style.scrollBehavior = prevBehavior
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
        {/* Barra de cierre — SIEMPRE presente para que ningún modal atrape al usuario */}
        <div className="flex justify-end px-3 pt-1 shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink-muted hover:bg-black/5 active:scale-95 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Contenido — ocupa el espacio restante */}
        <div
          className="px-5 pb-5 pt-1"
          style={{ overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
