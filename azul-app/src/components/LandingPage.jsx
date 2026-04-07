export default function LandingPage({ onEnter }) {
  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-8"
      style={{ background: 'linear-gradient(160deg, #5DA8B5 0%, #4A8E99 55%, #3A7580 100%)' }}
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-light/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-cream/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center w-full px-6 fade-in" style={{ gap: 'clamp(1.25rem, 4vw, 2rem)' }}>
        {/* Main title — tamaño fluido, overflow recortado */}
        <div className="text-center w-full">
          <h1
            className="text-cream drop-shadow-lg leading-none block"
            style={{
              fontFamily: '"Pinyon Script", cursive',
              fontSize: 'clamp(4.5rem, 22vw, 8rem)',
              /* paddingBottom absorbe los descendentes largos de Pinyon Script */
              paddingBottom: 'clamp(1.5rem, 6vw, 2.5rem)',
              textShadow: '0 4px 32px rgba(253,251,245,0.3), 0 2px 8px rgba(42,75,82,0.4)',
            }}
          >
            Azul
          </h1>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 text-cream/40">
          <div className="h-px w-16 bg-cream/30" />
          <span className="text-xl">✦</span>
          <div className="h-px w-16 bg-cream/30" />
        </div>

        {/* Enter button */}
        <button
          onClick={onEnter}
          className="bg-cream text-teal-deeper font-display font-semibold rounded-2xl shadow-xl
                     active:scale-95 transition-all duration-200 hover:shadow-2xl hover:bg-cream-warm"
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.125rem)',
            padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 8vw, 2.5rem)',
            boxShadow: '0 8px 32px rgba(42,75,82,0.35)',
          }}
        >
          Open notes
        </button>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <p className="font-body text-cream/30 text-sm italic">
          Authors, sagas, books, characters and more
        </p>
      </div>
    </div>
  )
}
