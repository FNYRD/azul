import { useState, useEffect } from "react"
import { useApp } from "../context/AppContext"
import { api } from "../api"
import Modal from "./ui/Modal"
import ConfirmModal from "./ui/ConfirmModal"
import MentionTextarea from "./ui/MentionTextarea"
import { BookOpenIcon, BookmarkIcon, CalendarIcon } from "./ui/Icons"

export default function LibraryView({ navigate }) {
  const { state, dispatch, ensureMentions } = useApp()

  const [library, setLibrary]   = useState(null)
  const [revision, setRevision] = useState(0)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState({})
  const [formError, setFormError] = useState("")
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    ensureMentions()
    api.getLibrary().then(setLibrary).catch(console.error)
  }, [revision]) // eslint-disable-line

  if (library === null) return <div className="text-cream/60 font-body text-center py-12">Loading…</div>

  function refresh() { setRevision(r => r + 1) }

  function openAddSaga() { setForm({ name: "", author: "", description: "" }); setFormError(""); setModal("add-saga") }
  function openEditSaga(saga) { setForm({ name: saga.name, author: saga.author || "", description: saga.description }); setFormError(""); setModal({ type: "edit-saga", saga }) }

  async function submitSaga(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (modal === "add-saga") {
      await dispatch({ type: "ADD_SAGA", name: form.name.trim(), author: form.author.trim(), description: form.description.trim() })
    } else {
      await dispatch({ type: "UPDATE_SAGA", sagaId: modal.saga.id, updates: { name: form.name.trim(), author: form.author.trim(), description: form.description.trim() } })
    }
    setModal(null); refresh()
  }

  function openAddBook(sagaId = null) { setForm({ title: "", author: "", description: "", startDate: "", endDate: "", sagaId }); setFormError(""); setModal("add-book") }
  function openEditBook(book) { setForm({ title: book.title, author: book.author || "", description: book.description, startDate: book.startDate || "", endDate: book.endDate || "", sagaId: book.sagaId }); setFormError(""); setModal({ type: "edit-book", book }) }

  async function submitBook(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (modal === "add-book") {
      await dispatch({ type: "ADD_BOOK", sagaId: form.sagaId || null, title: form.title.trim(), author: form.author.trim(), description: form.description.trim(), startDate: form.startDate || null, endDate: form.endDate || null })
    } else {
      await dispatch({ type: "UPDATE_BOOK", bookId: modal.book.id, updates: { title: form.title.trim(), author: form.author.trim(), description: form.description.trim(), startDate: form.startDate || null, endDate: form.endDate || null } })
    }
    setModal(null); refresh()
  }

  function deleteBook(bookId) {
    setConfirmDialog({ message: "Delete this book?", onConfirm: async () => { await dispatch({ type: "DELETE_BOOK", bookId }); refresh() } })
  }
  function deleteSaga(sagaId) {
    setConfirmDialog({ message: "Delete this saga? Books will become standalone.", onConfirm: async () => { await dispatch({ type: "DELETE_SAGA", sagaId }); refresh() } })
  }

  const sagas = library.sagas || []
  const standaloneBooks = library.standaloneBooks || []

  return (
    <div className="fade-in space-y-5">
      {sagas.length === 0 && standaloneBooks.length === 0 && (
        <div className="card p-8 text-center mt-6">
          <BookOpenIcon size={40} className="text-ink-muted mx-auto mb-4" />
          <p className="font-display text-ink text-lg font-medium">Your library is empty</p>
          <p className="font-body text-ink-muted mt-1">Add a saga or standalone book to get started</p>
        </div>
      )}

      <Section title="Sagas" onAdd={openAddSaga} addLabel="New saga">
        {sagas.length === 0
          ? <EmptyCard Icon={BookOpenIcon} text="No sagas yet" />
          : sagas.map(saga => {
              const sagaBooks = saga.books || []
              return (
                <div key={saga.id} className="card overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-teal-pale/30 transition-colors" onClick={() => navigate({ view: "saga", sagaId: saga.id })}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {saga.author && <p className="text-xs font-sans text-ink-muted uppercase tracking-wider mb-0.5">{saga.author}</p>}
                        <h4 className="font-display text-ink font-semibold text-base truncate">{saga.name}</h4>
                        {saga.description && <p className="text-ink-muted font-body text-sm mt-0.5 line-clamp-1">{saga.description}</p>}
                        <span className="text-xs font-sans text-ink-muted mt-1 inline-block">{sagaBooks.length} {sagaBooks.length === 1 ? "book" : "books"}</span>
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <IconBtn onClick={() => openAddBook(saga.id)} title="Add book"><PlusIcon /></IconBtn>
                        <IconBtn onClick={() => openEditSaga(saga)} title="Edit"><EditIcon /></IconBtn>
                        <IconBtn onClick={() => deleteSaga(saga.id)} title="Delete" danger><TrashIcon /></IconBtn>
                      </div>
                    </div>
                  </div>
                  {sagaBooks.length > 0 && (
                    <div className="border-t border-cream-border">
                      {sagaBooks.map(book => (
                        <BookRow key={book.id} book={book}
                          onClick={() => navigate({ view: "book", bookId: book.id, sagaId: saga.id })}
                          onEdit={() => openEditBook(book)}
                          onDelete={() => deleteBook(book.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
        }
      </Section>

      <Section title="Standalone books" onAdd={() => openAddBook(null)} addLabel="New book">
        {standaloneBooks.length === 0
          ? <EmptyCard Icon={BookmarkIcon} text="No standalone books" />
          : standaloneBooks.map(book => (
              <BookCard key={book.id} book={book}
                onClick={() => navigate({ view: "book", bookId: book.id, sagaId: null })}
                onEdit={() => openEditBook(book)}
                onDelete={() => deleteBook(book.id)}
              />
            ))
        }
      </Section>

      <Modal isOpen={modal === "add-saga" || modal?.type === "edit-saga"} onClose={() => setModal(null)}>
        <form onSubmit={submitSaga} className="space-y-4">
          <div>
            <label className="label">Saga name *</label>
            <input className="input" autoFocus value={form.name || ""} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError("") }} placeholder="Saga name" />
            {formError && <p className="text-red-500 text-xs mt-1 font-sans">{formError}</p>}
          </div>
          <div>
            <label className="label">Author</label>
            <input className="input" value={form.author || ""} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
          </div>
          <div>
            <label className="label">Description</label>
            <MentionTextarea rows={3} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Saga description…" state={state} />
          </div>
          <FormActions onCancel={() => setModal(null)} submitLabel={modal === "add-saga" ? "Create" : "Save"} disabled={!form.name?.trim()} />
        </form>
      </Modal>

      <Modal isOpen={modal === "add-book" || modal?.type === "edit-book"} onClose={() => setModal(null)}>
        <form onSubmit={submitBook} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" autoFocus value={form.title || ""} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError("") }} placeholder="Book title" />
            {formError && <p className="text-red-500 text-xs mt-1 font-sans">{formError}</p>}
          </div>
          <div>
            <label className="label">Author</label>
            <input className="input" value={form.author || ""} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
          </div>
          <div>
            <label className="label">Description / Synopsis</label>
            <MentionTextarea rows={3} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Synopsis or notes…" state={state} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start date</label><input type="date" className="input text-sm" value={form.startDate || ""} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div><label className="label">End date</label><input type="date" className="input text-sm" value={form.endDate || ""} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          </div>
          {modal === "add-book" && sagas.length > 0 && (
            <div>
              <label className="label">Saga</label>
              <select className="input" value={form.sagaId || ""} onChange={e => setForm(f => ({ ...f, sagaId: e.target.value || null }))}>
                <option value="">No saga</option>
                {sagas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <FormActions onCancel={() => setModal(null)} submitLabel={modal === "add-book" ? "Create" : "Save"} disabled={!form.title?.trim()} />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDialog}
        message={confirmDialog?.message}
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  )
}

function Section({ title, onAdd, addLabel, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-cream text-xl font-semibold drop-shadow-sm">{title}</h3>
        <button onClick={onAdd} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"><PlusIcon />{addLabel}</button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function BookCard({ book, onClick, onEdit, onDelete }) {
  const total = book.elementCount ?? 0
  return (
    <div className="card p-4 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {book.author && <p className="text-xs font-sans text-ink-muted uppercase tracking-wider mb-0.5">{book.author}</p>}
          <h4 className="font-display text-ink font-semibold text-base truncate">{book.title}</h4>
          {book.description && <p className="font-body text-ink-muted text-sm mt-0.5 line-clamp-2">{book.description}</p>}
          <DateRange startDate={book.startDate} endDate={book.endDate} />
          {total > 0 && <p className="text-xs font-sans text-ink-muted mt-1">{total} {total === 1 ? "element" : "elements"}</p>}
        </div>
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <IconBtn onClick={onEdit} title="Edit"><EditIcon /></IconBtn>
          <IconBtn onClick={onDelete} title="Delete" danger><TrashIcon /></IconBtn>
        </div>
      </div>
    </div>
  )
}

function BookRow({ book, onClick, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 hover:bg-teal-pale/20 transition-colors cursor-pointer border-b border-cream-border/50 last:border-b-0" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <span className="font-body text-ink text-sm truncate block">{book.title}</span>
        <DateRange startDate={book.startDate} endDate={book.endDate} />
      </div>
      <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <IconBtn onClick={onEdit} title="Edit"><EditIcon /></IconBtn>
        <IconBtn onClick={onDelete} title="Delete" danger><TrashIcon /></IconBtn>
      </div>
    </div>
  )
}

function FormActions({ onCancel, submitLabel, disabled }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" className="btn-primary flex-1" disabled={disabled}>{submitLabel}</button>
    </div>
  )
}

function EmptyCard({ Icon, text }) {
  return (
    <div className="card p-5 text-center">
      <Icon size={32} className="text-ink-muted mx-auto mb-2" />
      <p className="font-body text-ink-muted">{text}</p>
    </div>
  )
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button onClick={onClick} title={title} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${danger ? "hover:bg-red-50 text-red-400 hover:text-red-600" : "hover:bg-teal-pale text-ink-muted hover:text-teal-deeper"}`}>
      {children}
    </button>
  )
}

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> }
function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg> }
function DateRange({ startDate, endDate }) {
  if (!startDate && !endDate) return null
  const fmt = d => { if (!d) return null; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}` }
  return (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
      {startDate && <span className="inline-flex items-center gap-1 text-xs font-sans text-teal-deeper bg-teal-pale px-2 py-0.5 rounded-full"><CalendarIcon />Start: {fmt(startDate)}</span>}
      {endDate   && <span className="inline-flex items-center gap-1 text-xs font-sans text-teal-deeper bg-teal-pale px-2 py-0.5 rounded-full"><CalendarIcon />End: {fmt(endDate)}</span>}
    </div>
  )
}
