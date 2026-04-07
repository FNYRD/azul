import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { SearchEmptyIcon } from './ui/Icons'

export default function SearchView({ query: initialQuery, navigate }) {
  const [query, setQuery]     = useState(initialQuery || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      setLoading(true)
      api.search(q)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(debounce.current)
  }, [query])

  const typeColors = {
    author:    'bg-teal-pale    text-teal-deeper',
    saga:      'bg-purple-100  text-purple-700',
    book:      'bg-amber-50    text-amber-700',
    character: 'bg-purple-100  text-purple-700',
    place:     'bg-amber-50    text-amber-700',
    thing:     'bg-emerald-100 text-emerald-700',
    word:      'bg-sky-100     text-sky-700',
  }

  return (
    <div className="fade-in space-y-4">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4 pointer-events-none" />
        <input
          className="input pl-9"
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your entire library…"
        />
      </div>

      {/* Results count */}
      {query.trim() && !loading && (
        <p className="text-cream/80 font-sans text-sm">
          {results.length === 0 ? 'No results' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* No query state */}
      {!query.trim() && (
        <div className="card p-8 text-center">
          <SearchEmptyIcon size={36} className="text-ink-muted mx-auto mb-3" />
          <p className="font-body text-ink-muted">Type to search your entire library</p>
          <p className="font-sans text-ink-muted text-xs mt-1">Search by names, descriptions, ages…</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="card p-4 cursor-pointer" onClick={() => navigate(r.nav)}>
            <div className="flex items-start gap-3">
              <span className={`shrink-0 text-xs font-sans font-medium px-2 py-1 rounded-full ${typeColors[r.type]}`}>
                {r.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-ink font-semibold text-base leading-tight">
                  {highlightText(r.name, query)}
                </p>
                {r.age && <p className="text-xs font-sans text-ink-muted mt-0.5">{r.age}</p>}
                {r.sub && <p className="text-xs font-sans text-ink-muted mt-0.5">{r.sub}</p>}
                {r.excerpt && <p className="font-body text-ink-muted text-sm mt-1 leading-snug">{r.excerpt}</p>}
              </div>
              <ChevronIcon />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function highlightText(text, q) {
  if (!q.trim()) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

function SearchIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function ChevronIcon() {
  return <svg className="text-ink-muted shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
