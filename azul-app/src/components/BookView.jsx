import { useState, useEffect } from "react"
import { useApp } from "../context/AppContext"
import { api } from "../api"
import Modal from "./ui/Modal"
import DescriptionText from "./ui/DescriptionText"
import MentionTextarea from "./ui/MentionTextarea"
import ElementList from "./ElementList"
import { PersonIcon, MapPinIcon, DiamondIcon, PenIcon, CalendarIcon } from "./ui/Icons"

const TABS = [
  { key: "characters", label: "Characters", Icon: PersonIcon },
  { key: "places",     label: "Places",     Icon: MapPinIcon },
  { key: "things",     label: "Objects",    Icon: DiamondIcon },
  { key: "words",      label: "Vocabulary", Icon: PenIcon },
]

const TAB_ELEMENT_TYPE = {
  characters: "character",
  places:     "place",
  things:     "thing",
  words:      "word",
}

export default function BookView({ bookId, sagaId, initialTab, navigate }) {
  const { state, dispatch } = useApp()

  const [book, setBook]         = useState(null)
  const [revision, setRevision] = useState(0)
  const [tab, setTab]           = useState(initialTab ?? "characters")

  useEffect(() => { if (initialTab) setTab(initialTab) }, [initialTab])

  useEffect(() => {
    setBook(null)
    api.getBook(bookId).then(setBook).catch(console.error)
  }, [bookId, revision])

  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState({})
  const [appendModal, setAppend]  = useState(false)
  const [appendText, setAppendTx] = useState("")

  if (!book) return <div className="text-cream/60 font-body text-center py-12">Loading…</div>

  function refresh() { setRevision(r => r + 1) }

  async function submitAppend(e) {
    e.preventDefault()
    if (!appendText.trim()) return
    await dispatch({ type: "APPEND_TO_DESCRIPTION", target: "book", bookId, text: appendText.trim() })
    setAppendTx(""); setAppend(false); refresh()
  }

  const mentionNav = entity => {
    if (entity.type === "saga") navigate({ view: "saga", sagaId: entity.id })
    else if (entity.type === "book") navigate({ view: "book", bookId: entity.id, sagaId: null })
    else if (entity.bookId && entity.bookId !== bookId) navigate({ view: "book", bookId: entity.bookId, sagaId: null, tab: entity.type + "s", highlightId: entity.id })
    else setTab(entity.type + "s")
  }

  const counts = {
    characters: book.characters?.length || 0,
    places:     book.places?.length     || 0,
    things:     book.things?.length     || 0,
    words:      book.words?.length      || 0,
  }

  return (
    <div className="fade-in space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            {book.author && <p className="text-xs font-sans text-ink-muted uppercase tracking-wider mb-0.5">{book.author}</p>}
            <h2 className="font-display text-ink font-bold text-2xl leading-tight">{book.title}</h2>
          </div>
          <div className="flex gap-1 shrink-0">
            <IconBtn onClick={() => { setForm({ title: book.title, author: book.author || "", description: book.description, startDate: book.startDate || "", endDate: book.endDate || "" }); setModal("edit") }}><EditIcon /></IconBtn>
            <IconBtn onClick={() => setAppend(true)} title="Add notes"><PlusNoteIcon /></IconBtn>
          </div>
        </div>

        {book.description
          ? <DescriptionText text={book.description} state={state} onMentionClick={mentionNav} />
          : <p className="font-body text-ink-muted text-sm italic">No description</p>
        }

        {(book.startDate || book.endDate) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-border flex-wrap">
            {book.startDate && (
              <span className="inline-flex items-center gap-1.5 text-xs font-sans text-teal-deeper bg-teal-pale px-2.5 py-1 rounded-full">
                <CalendarIcon /> Started: {fmtDate(book.startDate)}
              </span>
            )}
            {book.endDate && (
              <span className="inline-flex items-center gap-1.5 text-xs font-sans text-teal-deeper bg-teal-pale px-2.5 py-1 rounded-full">
                <CalendarIcon /> Finished: {fmtDate(book.endDate)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card p-1.5">
        <div className="grid grid-cols-4 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`tab-btn flex flex-col items-center gap-1 py-2.5 ${tab === t.key ? "tab-active" : "tab-inactive"}`}>
              <t.Icon size={16} />
              <span className="text-xs">{counts[t.key] > 0 ? counts[t.key] : ""}</span>
            </button>
          ))}
        </div>
        <p className="text-center font-sans text-xs text-ink-muted mt-1 mb-0.5">
          {TABS.find(t => t.key === tab)?.label}
        </p>
      </div>

      <ElementList
        key={tab}
        elementType={TAB_ELEMENT_TYPE[tab]}
        book={book}
        navigate={navigate}
        onRefresh={refresh}
      />

      <Modal isOpen={modal === "edit"} onClose={() => setModal(null)}>
        <form onSubmit={async e => {
          e.preventDefault()
          await dispatch({ type: "UPDATE_BOOK", bookId, updates: { title: form.title, author: form.author, description: form.description, startDate: form.startDate || null, endDate: form.endDate || null } })
          setModal(null); refresh()
        }} className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div><label className="label">Author</label><input className="input" value={form.author || ""} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" /></div>
          <div><label className="label">Description / Synopsis</label><MentionTextarea rows={4} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} state={state} scope={{ bookId }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start date</label><input type="date" className="input text-sm" value={form.startDate || ""} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div><label className="label">End date</label><input type="date" className="input text-sm" value={form.endDate || ""} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={appendModal} onClose={() => setAppend(false)}>
        <form onSubmit={submitAppend} className="space-y-4">
          <MentionTextarea rows={5} autoFocus value={appendText} onChange={e => setAppendTx(e.target.value)} placeholder="Additional notes…" state={state} scope={{ bookId }} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAppend(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!appendText.trim()}>Add</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function IconBtn({ onClick, children, title }) {
  return <button onClick={onClick} title={title} className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-teal-pale text-ink-muted hover:text-teal-deeper">{children}</button>
}
function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> }
function PlusNoteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> }
function fmtDate(d) { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}` }
