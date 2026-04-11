import { useState, useMemo, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

const MENTION_RE = /@([\wáéíóúüñÁÉÍÓÚÜÑ']*(?:\s[\wáéíóúüñÁÉÍÓÚÜÑ']+)*)$/

const TYPE_BADGE = {
  saga:      { label: "Saga",      cls: "bg-violet-100 text-violet-700"     },
  book:      { label: "Book",      cls: "bg-orange-100 text-orange-700"     },
  character: { label: "Character", cls: "bg-purple-100 text-purple-700"     },
  place:     { label: "Place",     cls: "bg-amber-100 text-amber-700"       },
  thing:     { label: "Object",    cls: "bg-emerald-100 text-emerald-700"   },
  word:      { label: "Word",      cls: "bg-sky-100 text-sky-700"           },
}

export default function MentionTextarea({
  value, onChange, state,
  scope,
  placeholder, rows = 5,
  className, autoFocus,
}) {
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState("")
  const [mentionStart, setMStart] = useState(-1)
  const [activeIdx, setActiveIdx] = useState(0)
  const [pos, setPos]             = useState(null)
  const taRef   = useRef(null)
  const listRef = useRef(null)

  const allElements = useMemo(() => {
    if (!state?.sagas && !state?.books) return []
    const out = []
    state.sagas?.forEach(s => {
      out.push({ type: "saga", id: s.id, label: s.name, bookId: null, bookTitle: null })
    })
    state.books?.forEach(b => {
      out.push({ type: "book", id: b.id, label: b.title, bookId: b.id, bookTitle: b.title })
      b.characters?.forEach(e => out.push({ type: "character", id: e.id, label: e.name, bookId: b.id, bookTitle: b.title }))
      b.places    ?.forEach(e => out.push({ type: "place",     id: e.id, label: e.name, bookId: b.id, bookTitle: b.title }))
      b.things    ?.forEach(e => out.push({ type: "thing",     id: e.id, label: e.name, bookId: b.id, bookTitle: b.title }))
      b.words     ?.forEach(e => out.push({ type: "word",      id: e.id, label: e.word, bookId: b.id, bookTitle: b.title }))
    })
    return out
  }, [state])

  const suggestions = useMemo(() => {
    if (!open) return []
    const q = query.toLowerCase()
    const filtered = q
      ? allElements.filter(e => e.label.toLowerCase().includes(q))
      : allElements
    if (!scope?.bookId) return filtered.slice(0, 100)
    return [...filtered]
      .sort((a, b) => {
        const ra = a.bookId === scope.bookId ? 0 : 1
        const rb = b.bookId === scope.bookId ? 0 : 1
        return ra - rb
      })
      .slice(0, 100)
  }, [allElements, query, open, scope])

  useEffect(() => { setActiveIdx(0) }, [suggestions])

  useEffect(() => {
    if (!listRef.current || suggestions.length === 0) return
    listRef.current.children[activeIdx]?.scrollIntoView({ block: "nearest" })
  }, [activeIdx, suggestions])

  function getPos() {
    const rect = taRef.current?.getBoundingClientRect()
    if (!rect) return null
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= 216 ? rect.bottom + 4 : rect.top - 220
    return { top, left: rect.left, width: rect.width }
  }

  function handleChange(e) {
    const val    = e.target.value
    const cursor = e.target.selectionStart
    onChange(e)
    const before = val.slice(0, cursor)
    const match  = before.match(MENTION_RE)
    if (match) {
      setQuery(match[1])
      setMStart(cursor - match[0].length)
      setPos(getPos())
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (open) { e.preventDefault(); select(suggestions[activeIdx]) }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  function select(entity) {
    if (!entity) return
    const ta     = taRef.current
    const cursor = ta.selectionStart
    const before = value.slice(0, mentionStart)
    const after  = value.slice(cursor)
    const hasDuplicate = allElements.some(
      e => e.id !== entity.id && e.label.toLowerCase() === entity.label.toLowerCase()
    )
    let insertLabel = entity.label
    if (hasDuplicate && entity.bookTitle && entity.type !== "book") {
      insertLabel = `${entity.label} (${entity.bookTitle})`
    }
    const newVal = before + "@" + insertLabel + " " + after
    onChange({ target: { value: newVal } })
    setOpen(false)
    requestAnimationFrame(() => {
      const p = mentionStart + insertLabel.length + 2
      ta.setSelectionRange(p, p)
      ta.focus()
    })
  }

  const showDropdown = open && pos && suggestions.length > 0

  return (
    <div>
      <textarea
        ref={taRef}
        className={className ?? "textarea"}
        rows={rows}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {showDropdown && createPortal(
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-cream border border-cream-border rounded-2xl shadow-card overflow-hidden"
        >
          <div ref={listRef} className="overflow-y-auto max-h-56 py-1">
            {suggestions.map((entity, idx) => (
              <button
                key={entity.id + entity.type}
                type="button"
                onMouseDown={e => { e.preventDefault(); select(entity) }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  idx === activeIdx ? "bg-teal-pale" : "hover:bg-teal-pale/50"
                }`}
              >
                <span className={`text-xs px-1.5 py-0.5 rounded-lg font-sans font-medium shrink-0 ${TYPE_BADGE[entity.type]?.cls}`}>
                  {TYPE_BADGE[entity.type]?.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm text-ink truncate">{entity.label}</div>
                  {entity.bookTitle && (
                    <div className="font-sans text-xs text-ink-muted truncate">{entity.bookTitle}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
