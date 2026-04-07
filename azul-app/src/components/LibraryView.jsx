import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import Modal from './ui/Modal'
import ConfirmModal from './ui/ConfirmModal'
import MentionTextarea from './ui/MentionTextarea'
import { BooksIcon } from './ui/Icons'

export default function LibraryView({ navigate }) {
  const { state, dispatch, ensureMentions } = useApp()

  const [authors, setAuthors]         = useState(null) // null = loading
  const [revision, setRevision]       = useState(0)
  const [modal, setModal]             = useState(null) // null | 'add' | author-obj
  const [form, setForm]               = useState({ name: '', description: '' })
  const [formError, setFormError]     = useState('')
  const [search, setSearch]           = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Load library list + ensure mention entities are ready
  useEffect(() => {
    ensureMentions()
    api.getAuthors().then(setAuthors).catch(console.error)
  }, [revision]) // eslint-disable-line

  function openAdd() {
    setForm({ name: '', description: '' })
    setFormError('')
    setModal('add')
  }

  function openEdit(author) {
    setForm({ name: author.name, description: author.description })
    setFormError('')
    setModal(author)
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const trimmed = form.name.trim()
    const duplicate = (authors || []).some(
      a => a.name.toLowerCase() === trimmed.toLowerCase() &&
           (modal === 'add' || a.id !== modal.id)
    )
    if (duplicate) { setFormError('An author with that name already exists'); return }
    if (modal === 'add') {
      await dispatch({ type: 'ADD_AUTHOR', name: trimmed, description: form.description.trim() })
    } else {
      await dispatch({ type: 'UPDATE_AUTHOR', id: modal.id, updates: { name: trimmed, description: form.description.trim() } })
    }
    setModal(null)
    setRevision(r => r + 1)
  }

  function deleteAuthor(id) {
    setConfirmDialog({
      message: 'Delete this author and all their books?',
      onConfirm: async () => {
        await dispatch({ type: 'DELETE_AUTHOR', id })
        setRevision(r => r + 1)
      },
    })
  }

  const filtered = useMemo(() => {
    if (!authors) return []
    if (!search.trim()) return authors
    const q = search.toLowerCase()
    return authors.filter(a =>
      a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
    )
  }, [authors, search])

  if (authors === null) {
    return <div className="text-cream/60 font-body text-center py-12">Loading…</div>
  }

  return (
    <div className="fade-in space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h2 className="font-display text-cream text-2xl font-semibold drop-shadow-sm truncate">Authors</h2>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 shrink-0 py-2.5 px-4">
          <PlusIcon />
          <span>Add</span>
        </button>
      </div>

      {/* Search */}
      {authors.length > 2 && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter authors…"
            className="input pl-9 text-sm"
          />
        </div>
      )}

      {/* Empty state */}
      {authors.length === 0 && (
        <div className="card p-8 text-center mt-6">
          <BooksIcon size={40} className="text-ink-muted mx-auto mb-4" />
          <p className="font-display text-ink text-lg font-medium">Your library is empty</p>
          <p className="font-body text-ink-muted mt-1">Add your first author to get started</p>
        </div>
      )}

      {/* Author cards */}
      <div className="space-y-3">
        {filtered.map(author => (
          <div
            key={author.id}
            className="card p-4 cursor-pointer"
            onClick={() => navigate({ view: 'author', authorId: author.id })}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-ink font-semibold text-lg leading-tight truncate">{author.name}</h3>
                {author.description && (
                  <p className="font-body text-ink-muted text-sm mt-1 line-clamp-2 leading-snug">{author.description}</p>
                )}
                <div className="flex gap-3 mt-2">
                  {author.sagaCount > 0 && <Chip label={`${author.sagaCount} ${author.sagaCount === 1 ? 'saga' : 'sagas'}`} color="teal" />}
                  {author.bookCount > 0 && <Chip label={`${author.bookCount} ${author.bookCount === 1 ? 'book' : 'books'}`} color="amber" />}
                </div>
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <IconBtn onClick={() => openEdit(author)} title="Edit"><EditIcon /></IconBtn>
                <IconBtn onClick={() => deleteAuthor(author.id)} title="Delete" danger><TrashIcon /></IconBtn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results */}
      {search && filtered.length === 0 && (
        <p className="text-center text-cream/70 font-body py-6">No results for "{search}"</p>
      )}

      {/* Confirm */}
      <ConfirmModal
        isOpen={!!confirmDialog}
        message={confirmDialog?.message}
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}
        onClose={() => setConfirmDialog(null)}
      />

      {/* Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError('') }}
              placeholder="Author name"
              autoFocus
            />
            {formError && <p className="text-red-500 text-xs mt-1 font-sans">{formError}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <MentionTextarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Notes about the author…"
              state={state}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!form.name.trim()}>
              {modal === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Chip({ label, color }) {
  const cls = color === 'teal' ? 'bg-teal-pale text-teal-deeper' : 'bg-amber-50 text-amber-700'
  return <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${danger ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-teal-pale text-ink-muted hover:text-teal-deeper'}`}
    >
      {children}
    </button>
  )
}

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function SearchIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
