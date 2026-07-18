import { useState, useEffect } from "react"
import { AppProvider } from "./context/AppContext"
import LandingPage from "./components/LandingPage"
import LibraryView from "./components/LibraryView"
import SagaView    from "./components/SagaView"
import BookView    from "./components/BookView"
import SearchView  from "./components/SearchView"
import AppHeader   from "./components/ui/AppHeader"

// Aviso si el backup diario de la base de datos NO se está subiendo a GitHub.
// Lee /backup-status.json (lo escribe /usr/local/bin/azul-backup.sh tras cada push).
function BackupWarning() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let cancelled = false
    const STALE_MS = 2 * 24 * 60 * 60 * 1000 // 2 días sin backup exitoso = algo va mal
    fetch("/backup-status.json", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : { missing: true }))
      .then(d => {
        if (cancelled || !d) return
        const lastOk = d.lastSuccess ? Date.parse(d.lastSuccess) : null
        const stale = d.missing || !lastOk || (Date.now() - lastOk) > STALE_MS
        if (d.ok === false || stale) setShow(true)
        // Si el backup está obsoleto (p.ej. el cron dejó de correr), dispáralo.
        if (stale) fetch("/api/backup/run/", { method: "POST" }).catch(() => {})
      })
      .catch(() => {}) // error de red → no avisar (evita falsos positivos sin conexión)
    return () => { cancelled = true }
  }, [])
  if (!show) return null
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100001,
      paddingTop: "calc(env(safe-area-inset-top) + 8px)",
      background: "#B91C1C", color: "#fff", boxShadow: "0 2px 14px rgba(0,0,0,0.3)",
    }}>
      <div className="flex items-start gap-3 pb-3" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(0.75rem, env(safe-area-inset-right))" }}>
        <span style={{ fontSize: "18px", lineHeight: 1.4 }}>⚠️</span>
        <p className="flex-1 font-sans text-sm" style={{ lineHeight: 1.35, paddingTop: "1px" }}>
          <b>Avisar a Jesús:</b> no se están haciendo copias de seguridad (backups) de los datos.
        </p>
        <button
          onClick={() => setShow(false)}
          aria-label="Cerrar"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  // Pila de navegación: el tope es la vista actual. Cada navigate() hace push,
  // y goBack() hace pop → se vuelve EXACTAMENTE al punto anterior (incluyendo
  // sagaId, bookId, tab…), en lugar de saltar a un padre fijo.
  const [history, setHistory] = useState([{ view: "landing" }])
  const [searchKey, setSearchKey] = useState(0)

  const nav = history[history.length - 1]
  const canGoBack = history.length > 1

  function navigate(newNav) {
    setHistory(h => [...h, newNav])
    window.scrollTo(0, 0)
  }

  function goBack() {
    setHistory(h => (h.length > 1 ? h.slice(0, -1) : h))
    window.scrollTo(0, 0)
  }

  if (nav.view === "landing") {
    return <><BackupWarning /><LandingPage onEnter={() => navigate({ view: "library" })} /></>
  }

  return (
    <div className="min-h-screen min-h-dvh w-full overflow-x-hidden" style={{ background: "linear-gradient(180deg, #5DA8B5 0%, #4A8E99 100%)" }}>
      <BackupWarning />
      <AppHeader nav={nav} canGoBack={canGoBack} onBack={goBack} onSearch={() => { setSearchKey(k => k + 1); navigate({ view: "search" }) }} />
      {/* padding-top = altura real del header fijo = safe-area-inset-top (notch en standalone) + 4rem.
          En navegador el inset es 0, así que equivale al pt-16 anterior (sin regresión);
          en la PWA de pantalla de inicio evita que la barra tape el contenido. */}
      <main className="pb-12 w-full max-w-lg mx-auto px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 4rem)", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))", paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}>
        {nav.view === "library" && <LibraryView navigate={navigate} />}
        {nav.view === "saga"    && <SagaView    sagaId={nav.sagaId} navigate={navigate} />}
        {nav.view === "book"    && <BookView    bookId={nav.bookId} sagaId={nav.sagaId} initialTab={nav.tab} navigate={navigate} />}
        {nav.view === "search"  && <SearchView  key={searchKey} query={nav.query} navigate={navigate} />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
