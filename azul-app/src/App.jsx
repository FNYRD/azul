import { useState } from "react"
import { AppProvider } from "./context/AppContext"
import LandingPage from "./components/LandingPage"
import LibraryView from "./components/LibraryView"
import SagaView    from "./components/SagaView"
import BookView    from "./components/BookView"
import SearchView  from "./components/SearchView"
import AppHeader   from "./components/ui/AppHeader"

function AppContent() {
  const [nav, setNav] = useState({ view: "landing" })
  const [searchKey, setSearchKey] = useState(0)

  function navigate(newNav) {
    setNav(newNav)
    window.scrollTo(0, 0)
  }

  function goBack() {
    switch (nav.view) {
      case "library": navigate({ view: "landing" }); break
      case "saga":    navigate({ view: "library" }); break
      case "book":
        if (nav.sagaId) navigate({ view: "saga", sagaId: nav.sagaId })
        else            navigate({ view: "library" })
        break
      case "search":  navigate({ view: "library" }); break
      default:        navigate({ view: "library" })
    }
  }

  if (nav.view === "landing") {
    return <LandingPage onEnter={() => navigate({ view: "library" })} />
  }

  return (
    <div className="min-h-screen min-h-dvh w-full overflow-x-hidden" style={{ background: "linear-gradient(180deg, #5DA8B5 0%, #4A8E99 100%)" }}>
      <AppHeader nav={nav} onBack={goBack} onSearch={() => { setSearchKey(k => k + 1); navigate({ view: "search" }) }} />
      <main className="pt-16 pb-12 w-full max-w-lg mx-auto px-4" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))", paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}>
        {nav.view === "library" && <LibraryView navigate={navigate} />}
        {nav.view === "saga"    && <SagaView    sagaId={nav.sagaId} navigate={navigate} />}
        {nav.view === "book"    && <BookView    bookId={nav.bookId} sagaId={nav.sagaId} initialTab={nav.tab} navigate={navigate} />}
        {nav.view === "search"  && <SearchView  key={searchKey} navigate={navigate} />}
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
