export default function AppHeader({ nav, onBack, onSearch }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-teal-surface/95 backdrop-blur-sm border-b border-white/10 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full max-w-lg mx-auto flex items-center gap-2 px-4 h-14" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        {/* Back button — siempre visible */}
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors shrink-0 text-cream"
          aria-label="Back"
        >
          {nav.view === 'library' ? (
            /* Ícono casa para volver al inicio */
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
              <polyline points="9 21 9 12 15 12 15 21" />
            </svg>
          ) : (
            /* Flecha atrás */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <NavTitle nav={nav} />
        </div>

        {/* Search button — hidden on search view */}
        {nav.view !== 'search' && (
          <button
            onClick={onSearch}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors shrink-0 text-cream"
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}

function NavTitle({ nav }) {
  const labels = {
    library: 'Library',
    saga:    'Saga',
    book:    'Book',
    search:  'Search',
  }
  return (
    <h1 className="font-display font-semibold text-cream text-base truncate">
      {labels[nav.view] || 'Azul'}
    </h1>
  )
}
