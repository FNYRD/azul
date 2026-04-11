import { useMemo } from "react"

export default function DescriptionText({ text, book, state, onMentionClick }) {
  const entityMap = useMemo(() => {
    const map = {}
    const put = (label, type, id, extra, qualifier = null) => {
      const k = (label || "").toLowerCase()
      if (!k) return
      if (!map[k]) map[k] = { type, id, label, ...extra }
      if (qualifier) {
        const qk = k + " (" + qualifier.toLowerCase() + ")"
        if (!map[qk]) map[qk] = { type, id, label, ...extra }
      }
    }

    if (state?.sagas || state?.books) {
      state.sagas?.forEach(s => put(s.name, "saga", s.id, {}, null))
      state.books?.forEach(b => {
        put(b.title, "book", b.id, { bookId: b.id }, null)
        b.characters?.forEach(e => put(e.name, "character", e.id, { bookId: b.id }, b.title))
        b.places    ?.forEach(e => put(e.name, "place",     e.id, { bookId: b.id }, b.title))
        b.things    ?.forEach(e => put(e.name, "thing",     e.id, { bookId: b.id }, b.title))
        b.words     ?.forEach(e => put(e.word, "word",      e.id, { bookId: b.id }, b.title))
      })
    } else if (book) {
      const add = (list, type, nameKey = "name") =>
        list?.forEach(item => {
          const k = (item[nameKey] || "").toLowerCase()
          if (k) map[k] = { type, id: item.id, label: item[nameKey] }
        })
      add(book.characters, "character")
      add(book.places,     "place")
      add(book.things,     "thing")
      add(book.words,      "word", "word")
    }
    return map
  }, [book, state])

  const segments = useMemo(() => {
    if (!text) return []
    const sortedNames = Object.keys(entityMap).sort((a, b) => b.length - a.length)
    const parts = []
    let i = 0
    while (i < text.length) {
      if (text[i] !== "@") {
        const start = i
        while (i < text.length && text[i] !== "@") i++
        parts.push({ type: "text", content: text.slice(start, i) })
        continue
      }
      const afterAt = text.slice(i + 1)
      const afterAtLower = afterAt.toLowerCase()
      let matchedName = null
      for (const name of sortedNames) {
        if (afterAtLower.startsWith(name)) {
          const next = afterAt[name.length]
          if (!next || /[\s,.:;!?()\[\]'"@\n]/.test(next)) {
            matchedName = name
            break
          }
        }
      }
      if (matchedName) {
        const afterMatch = afterAt.slice(matchedName.length)
        const qualifierMatch = afterMatch.match(/^ \(([^)]+)\)/)
        if (qualifierMatch) {
          const qualifiedKey = matchedName + " (" + qualifierMatch[1].toLowerCase() + ")"
          if (!entityMap[qualifiedKey]) {
            const fullLen = matchedName.length + qualifierMatch[0].length
            parts.push({ type: "text", content: "@" + afterAt.slice(0, fullLen) })
            i += 1 + fullLen
          } else {
            parts.push({ type: "mention", raw: "@" + afterAt.slice(0, matchedName.length), word: matchedName, entity: entityMap[matchedName] })
            i += 1 + matchedName.length
          }
        } else {
          parts.push({ type: "mention", raw: "@" + afterAt.slice(0, matchedName.length), word: matchedName, entity: entityMap[matchedName] })
          i += 1 + matchedName.length
        }
      } else {
        parts.push({ type: "text", content: "@" })
        i++
      }
    }
    return parts
  }, [text, entityMap])

  if (!text) return <p className="text-ink-muted font-body text-sm italic">No description</p>

  const typeColors = {
    saga:      "bg-violet-100 text-violet-700 border border-violet-200",
    book:      "bg-orange-100 text-orange-700 border border-orange-200",
    character: "bg-purple-100 text-purple-700 border border-purple-200",
    place:     "bg-amber-100  text-amber-700  border border-amber-200",
    thing:     "bg-emerald-100 text-emerald-700 border border-emerald-200",
    word:      "bg-sky-100    text-sky-700    border border-sky-200",
  }

  return (
    <p className="text-ink font-body text-base leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.content}</span>
        if (seg.entity && onMentionClick) {
          return (
            <button
              key={i}
              onClick={() => onMentionClick(seg.entity)}
              className={"inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded-lg text-sm font-sans font-medium cursor-pointer transition-opacity hover:opacity-75 " + (typeColors[seg.entity.type] || "bg-teal-pale text-teal-deeper border border-teal-pale")}
            >
              @{seg.raw.slice(1)}
            </button>
          )
        }
        return (
          <span key={i} className={seg.entity ? "text-teal-deeper font-medium" : "text-ink-muted"}>
            @{seg.raw.slice(1)}
          </span>
        )
      })}
    </p>
  )
}
