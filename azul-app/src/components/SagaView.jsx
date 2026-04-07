import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import Modal from './ui/Modal'
import ConfirmModal from './ui/ConfirmModal'
import DescriptionText from './ui/DescriptionText'
import MentionTextarea from './ui/MentionTextarea'
import { BookmarkIcon, CalendarIcon } from './ui/Icons'

export default function SagaView({ sagaId, authorId, navigate }) {
  const { state, dispatch } = useApp()

  const [saga, setSaga]         = useState(null)
  const [revision, setRevision] = useState(0)

  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState({})
  const [formError, setFormError] = useState('')
  const [appendModal, setAppend]  = useState(false)
  const [appendText, setAppendTx] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    setSaga(null)
    api.getSaga(sagaId).then(setSaga).catch(console.error)
  }, [sagaId, revision])

  if (!saga) return <div className="text-cream/60 font-body text-center py-12">Loading…</div>

  function refresh() { setRevision(r => r + 1) }

  function openAddBook() { setForm({ title: '', description: '', startDate: '', endDate: '' }); setFormError(''); setModal('add-book') }
  function openEditBook(book) { setForm({ title: book.title, description: book.description, startDate: book.startDate || '', endDate: book.endDate || '' }); setFormError(''); setModal({ type: 'edit-book', book }) }

  async function submitBook(e) {
    e.preventDefault()
    if (!form.title?.trim()) return
    const trimmed = form.title.trim()
    const duplicate = (saga.books || []).some(
      b => b.title.toLowerCase() === trimmed.toLowerCase() &&
           (modal === 'add-book' || b.id !== modal.book.id)
    )
    if (duplicate) { setFormError('A book with that title already exists'); return }
    if (modal === 'add-book') {
      await dispatch({ type: 'ADD_BOOK', authorId, sagaId, title: trimmed, description: form.description.trim(), startDate: form.startDate || null, endDate: form.endDate || null })
    } else {
      await dispatch({ type: 'UPDATE_BOOK', authorId, bookId: modal.book.id, updates: { title: trimmed, description: form.description.trim(), startDate: form.startDate || null, endDate: form.endDate || null } })
    }
    setModal(null); refresh()
  }

  function deleteBook(bookId) {
    setConfirmDialog({ message: 'Delete this book?', onConfirm: async () => { await dispatch({ type: 'DELETE_BOOK', authorId, bookId }); refresh() } })
  }

  async function submitAppend(e) {
    e.preventDefault()
    if (!appendText.trim()) return
    await dispatch({ type: 'APPEND_TO_DESCRIPTION', target: 'saga', authorId, sagaId, text: appendText.trim() })
    setAppendTx(''); setAppend(false); refresh()
  }

  const mentionNav = entity => {
    if (entity.type === 'author') navigate({ view: 'author', authorId: entity.authorId ?? entity.id })
    else if (entity.type === 'saga') navigate({ view: 'saga', sagaId: entity.id, authorId: entity.authorId })
    else if (entity.type === 'book') navigate({ view: 'book', bookId: entity.id, authorId: entity.authorId })
    else if (entity.bookId) navigate({ view: 'book', bookId: entity.bookId, authorId: entity.authorId, tab: entity.type + 's' })
  }

  const books = saga.books || []

  return (
    <div className="fade-in space-y-5">
      {/* Saga hero */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-sans text-ink-muted uppercase tracking-wider mb-0.5">{saga.authorName}</p>
            <h2 className="font-display text-ink font-bold text-2xl">{saga.name}</h2>
          </div>
          <div className="flex gap-1 shrink-0">
            <IconBtn onClick={() => { setForm({ name: saga.name, description: saga.description }); setModal('edit-saga') }} title="Edit saga"><EditIcon /></IconBtn>
            <IconBtn onClick={() => setAppend(true)} title="Add notes"><PlusNoteIcon /></IconBtn>
          </div>
        </div>
        {saga.description
          ? <DescriptionText text={saga.description} state={state} onMentionClick={mentionNav} />
          : <p className="font-body text-ink-muted text-sm italic">No description</p>
        }
        <p className="mt-3 text-xs font-sans text-ink-muted">{books.length} {books.length === 1 ? 'book' : 'books'} in this saga</p>
      </div>

      {/* Books */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-cream text-xl font-semibold drop-shadow-sm">Books</h3>
          <button onClick={openAddBook} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs">
            <PlusIcon /> New book
          </button>
        </div>
        <div className="space-y-3">
          {books.length === 0
            ? (
              <div className="card p-6 text-center">
                <BookmarkIcon size={32} className="text-ink-muted mx-auto mb-2" />
                <p className="font-body text-ink-muted">No books in this saga yet</p>
              </div>
            )
            : books.map(book => {
                const total = book.elementCount ?? 0
                return (
                  <div key={book.id} className="card p-4 cursor-pointer" onClick={() => navigate({ view: 'book', bookId: book.id, authorId, sagaId })}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-ink font-semibold text-base truncate">{book.title}</h4>
                        {book.description && <p className="font-body text-ink-muted text-sm mt-0.5 line-clamp-2">{book.description}</p>}
                        <DateRange startDate={book.startDate} endDate={book.endDate} />
                        {total > 0 && <p className="text-xs font-sans text-ink-muted mt-1">{total} {total === 1 ? 'element' : 'elements'}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <IconBtn onClick={() => openEditBook(book)} title="Edit"><EditIcon /></IconBtn>
                        <IconBtn onClick={() => deleteBook(book.id)} title="Delete" danger><TrashIcon /></IconBtn>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Edit saga */}
      <Modal isOpen={modal === 'edit-saga'} onClose={() => setModal(null)} title="Edit saga">
        <form onSubmit={async e => { e.preventDefault(); await dispatch({ type: 'UPDATE_SAGA', authorId, sagaId, updates: { name: form.name, description: form.description } }); setModal(null); refresh() }} className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">Description</label><MentionTextarea rows={4} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} state={state} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save</button>
          </div>
        </form>
      </Modal>

      {/* Append */}
      <Modal isOpen={appendModal} onClose={() => setAppend(false)} title="Add notes">
        <form onSubmit={submitAppend} className="space-y-4">
          <MentionTextarea rows={5} autoFocus value={appendText} onChange={e => setAppendTx(e.target.value)} placeholder="Additional notes…" state={state} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAppend(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Add</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit book */}
      <Modal isOpen={modal === 'add-book' || modal?.type === 'edit-book'} onClose={() => setModal(null)} title={modal === 'add-book' ? 'New book' : 'Edit book'}>
        <form onSubmit={submitBook} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" autoFocus value={form.title || ''} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError('') }} placeholder="Book title" />{formError && <p className="text-red-500 text-xs mt-1 font-sans">{formError}</p>}</div>
          <div><label className="label">Description</label><MentionTextarea rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Synopsis or notes…" state={state} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start date</label><input type="date" className="input text-sm" value={form.startDate || ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div><label className="label">End date</label><input type="date" className="input text-sm" value={form.endDate || ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!form.title?.trim()}>{modal === 'add-book' ? 'Create' : 'Save'}</button>
          </div>
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

function IconBtn({ onClick, children, title, danger }) {
  return <button onClick={onClick} title={title} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${danger ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-teal-pale text-ink-muted hover:text-teal-deeper'}`}>{children}</button>
}
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> }
function PlusNoteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> }
function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg> }
function DateRange({ startDate, endDate }) {
  if (!startDate && !endDate) return null
  const fmt = d => { if (!d) return null; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` }
  return (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
      {startDate && <span className="inline-flex items-center gap-1 text-xs font-sans text-teal-deeper bg-teal-pale px-2 py-0.5 rounded-full"><CalendarIcon />Start: {fmt(startDate)}</span>}
      {endDate   && <span className="inline-flex items-center gap-1 text-xs font-sans text-teal-deeper bg-teal-pale px-2 py-0.5 rounded-full"><CalendarIcon />End: {fmt(endDate)}</span>}
    </div>
  )
}
