import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './ui/Modal'
import ConfirmModal from './ui/ConfirmModal'
import DescriptionText from './ui/DescriptionText'
import MentionTextarea from './ui/MentionTextarea'
import { PersonIcon, MapPinIcon, DiamondIcon, PenIcon } from './ui/Icons'

const CONFIGS = {
  character: {
    label: 'Character', plural: 'Characters', Icon: PersonIcon,
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',     required: true,  placeholder: 'Character name' },
      { key: 'age',         label: 'Age',          type: 'text',     required: false, placeholder: 'E.g. 24 years old, young, elderly…' },
      { key: 'description', label: 'Description',  type: 'textarea', required: false, placeholder: 'Description, traits, backstory… Use @name to reference other elements' },
    ],
    nameKey: 'name',
    filterFields: [
      { key: 'name',        label: 'Name',        type: 'text' },
      { key: 'age',         label: 'Age/Era',     type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  place: {
    label: 'Place', plural: 'Places', Icon: MapPinIcon,
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',     required: true,  placeholder: 'Place name' },
      { key: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Place description… Use @name for references' },
    ],
    nameKey: 'name',
    filterFields: [
      { key: 'name',        label: 'Name',        type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  thing: {
    label: 'Object', plural: 'Objects', Icon: DiamondIcon,
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',     required: true,  placeholder: 'Object name' },
      { key: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Object description…' },
    ],
    nameKey: 'name',
    filterFields: [
      { key: 'name',        label: 'Name',        type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  word: {
    label: 'Word', plural: 'Vocabulary', Icon: PenIcon,
    fields: [
      { key: 'word',        label: 'Word/Term',   type: 'text',     required: true,  placeholder: 'Term or word' },
      { key: 'description', label: 'Definition',  type: 'textarea', required: false, placeholder: 'Definition or explanation…' },
    ],
    nameKey: 'word',
    filterFields: [
      { key: 'word',        label: 'Word',        type: 'text' },
      { key: 'description', label: 'Definition',  type: 'text' },
    ],
  },
}

function apiError(err) {
  const d = err && err.data
  if (!d) return ''
  if (typeof d === 'string') return d
  const nf = d.nonFieldErrors || d.non_field_errors || d.detail
  if (Array.isArray(nf)) return nf[0]
  if (typeof nf === 'string') return nf
  const first = Object.values(d)[0]
  if (Array.isArray(first)) return first[0]
  return typeof first === 'string' ? first : ''
}

export default function ElementList({ elementType, book, navigate, onRefresh, highlightId }) {
  const { dispatch, state } = useApp()
  const config = CONFIGS[elementType]
  const elements = book[elementType === 'character' ? 'characters' : elementType === 'place' ? 'places' : elementType === 'thing' ? 'things' : 'words'] || []

  const [modal, setModal]          = useState(null) // null | 'add' | { type:'edit', el } | { type:'view', el }
  const [form, setForm]            = useState({})
  const [formError, setFormError]  = useState('')
  const [appendModal, setAppend]   = useState(null) // element id
  const [appendText, setAppendTx]  = useState('')
  const [appendError, setAppendError] = useState('')
  const [filter, setFilter]        = useState({})
  const [showFilter, setShowFilter] = useState(false)
  const [relatedModal, setRelatedModal] = useState(null) // element
  const [confirmDialog, setConfirmDialog] = useState(null)

  const filtered = useMemo(() => {
    if (Object.values(filter).every(v => !v)) return elements
    return elements.filter(el =>
      config.filterFields.every(f => {
        const fv = filter[f.key]?.toLowerCase()
        if (!fv) return true
        return (el[f.key] || '').toLowerCase().includes(fv)
      })
    )
  }, [elements, filter, config.filterFields])

  const hasFilter = Object.values(filter).some(Boolean)

  function openAdd() { setForm({}); setFormError(''); setModal('add') }
  function openEdit(el) { setForm({ ...el }); setFormError(''); setModal({ type: 'edit', el }) }
  function openView(el) { setModal({ type: 'view', el }) }

  async function submit(e) {
    e.preventDefault()
    const nameKey = config.nameKey
    if (!form[nameKey]?.trim()) return
    const trimmedName = form[nameKey].trim()
    const elementList = book[{ character: 'characters', place: 'places', thing: 'things', word: 'words' }[elementType]] || []
    const duplicate = elementList.some(
      el => (el[nameKey] || '').toLowerCase() === trimmedName.toLowerCase() &&
            (modal === 'add' || el.id !== modal.el.id)
    )
    if (duplicate) { setFormError(`A ${config.label.toLowerCase()} with that name already exists`); return }
    const data = {}
    config.fields.forEach(f => { data[f.key] = (form[f.key] || '').trim() })
    try {
      if (modal === 'add') {
        await dispatch({ type: 'ADD_ELEMENT', bookId: book.id, elementType, data })
      } else {
        await dispatch({ type: 'UPDATE_ELEMENT', bookId: book.id, elementType, elementId: modal.el.id, updates: data })
      }
      setModal(null)
      onRefresh?.()
    } catch (err) {
      setFormError(apiError(err) || 'Could not save. Please try again.')
    }
  }

  function deleteEl(id) {
    setConfirmDialog({
      message: `Delete this ${config.label.toLowerCase()}?`,
      onConfirm: async () => {
        await dispatch({ type: 'DELETE_ELEMENT', bookId: book.id, elementType, elementId: id })
        if (modal?.el?.id === id) setModal(null)
        onRefresh?.()
      },
    })
  }

  async function submitAppend(e) {
    e.preventDefault()
    if (!appendText.trim()) return
    try {
      await dispatch({ type: 'APPEND_TO_DESCRIPTION', target: 'element', bookId: book.id, elementType, elementId: appendModal, text: appendText.trim() })
      setAppendTx('')
      setAppend(null)
      setModal(null)
      onRefresh?.()
    } catch (err) {
      setAppendError(apiError(err) || 'Could not add text. Please try again.')
    }
  }

  const typeColors = {
    character: 'border-l-purple-400',
    place:     'border-l-amber-400',
    thing:     'border-l-emerald-400',
    word:      'border-l-sky-400',
  }
  const borderColor = typeColors[elementType]
  const highlightRef = useRef(null)
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [highlightId, filtered])

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-sans text-ink-muted text-sm shrink-0">{filtered.length} de {elements.length}</span>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-sans font-medium transition-colors select-none ${showFilter || hasFilter ? 'bg-teal-dark text-cream' : 'bg-cream text-ink-light hover:bg-teal-pale'}`}
          >
            <FilterIcon />
            <span>Filter</span>
            {hasFilter && <span className="w-1.5 h-1.5 rounded-full bg-cream shrink-0" />}
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-sm">
            <PlusIcon /> <span>{config.label}</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="card p-4 space-y-3 fade-in">
          <div className="flex items-center justify-between">
            <span className="font-sans text-ink-light text-sm font-medium">Filters</span>
            {hasFilter && (
              <button onClick={() => setFilter({})} className="text-xs text-red-500 font-sans hover:text-red-700">
                Clear
              </button>
            )}
          </div>
          {config.filterFields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                className="input text-sm py-2"
                value={filter[f.key] || ''}
                onChange={e => setFilter(flt => ({ ...flt, [f.key]: e.target.value }))}
                placeholder={`Filter by ${f.label.toLowerCase()}…`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {elements.length === 0 && (
        <div className="card p-6 text-center">
          <config.Icon size={32} className="text-ink-muted mx-auto mb-3" />
          <p className="font-body text-ink-muted">No {config.plural.toLowerCase()} yet</p>
          <button onClick={openAdd} className="btn-primary mt-3 mx-auto">
            Add {config.label}
          </button>
        </div>
      )}

      {/* No filter results */}
      {elements.length > 0 && filtered.length === 0 && (
        <div className="card p-5 text-center">
          <p className="font-body text-ink-muted">No results with the current filters</p>
        </div>
      )}

      {/* Element cards */}
      {filtered.map(el => {
        const displayName = el[config.nameKey]
        const isHi = highlightId && el.id === highlightId
        return (
          <div
            key={el.id}
            ref={isHi ? highlightRef : null}
            className={`card border-l-4 ${borderColor} cursor-pointer ${isHi ? 'ring-2 ring-teal-dark' : ''}`}
            onClick={() => openView(el)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-ink font-semibold text-base leading-tight">{displayName}</h4>
                  {elementType === 'character' && el.age && (
                    <span className="inline-block text-xs font-sans text-ink-muted bg-cream-warm px-2 py-0.5 rounded-full mt-1">{el.age}</span>
                  )}
                  {el.description && (
                    <p className="font-body text-ink-muted text-sm mt-1.5 line-clamp-2 leading-snug">{el.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <IconBtn onClick={() => setRelatedModal(el)} title="Related"><RelatedIcon /></IconBtn>
                  <IconBtn onClick={() => openEdit(el)} title="Edit"><EditIcon /></IconBtn>
                  <IconBtn onClick={() => deleteEl(el.id)} title="Delete" danger><TrashIcon /></IconBtn>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* View modal */}
      {modal?.type === 'view' && (() => {
        // Get fresh element from book
        const key = elementType === 'character' ? 'characters' : elementType === 'place' ? 'places' : elementType === 'thing' ? 'things' : 'words'
        const freshEl = book[key]?.find(e => e.id === modal.el.id) || modal.el
        return (
          <Modal isOpen onClose={() => setModal(null)}>
            <div className="space-y-4">
              {elementType === 'character' && freshEl.age && (
                <div>
                  <span className="label">Age</span>
                  <p className="font-body text-ink text-base">{freshEl.age}</p>
                </div>
              )}
              <div>
                <span className="label">Description</span>
                <div className="mt-1">
                  <DescriptionText
                    text={freshEl.description}
                    state={state}
                    onMentionClick={entity => {
                      setModal(null)
                      navigate(entityNav(entity, book.id))
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-cream-border">
                <button onClick={() => { setModal(null); setRelatedModal(freshEl) }} className="btn-secondary w-full text-sm py-2.5">
                  Related
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setModal(null); setAppend(freshEl.id); setAppendTx(''); setAppendError('') }} className="btn-secondary flex-1 text-sm py-2.5">
                    + Add text
                  </button>
                  <button onClick={() => { setModal(null); openEdit(freshEl) }} className="btn-primary flex-1 text-sm py-2.5">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* Add/Edit modal */}
      <Modal
        isOpen={modal === 'add' || modal?.type === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'add' ? `New ${config.label}` : `Edit ${config.label}`}
      >
        <form onSubmit={submit} className="space-y-4">
          {config.fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}{f.required && ' *'}</label>
              {f.type === 'textarea' ? (
                <MentionTextarea
                  rows={5}
                  value={form[f.key] || ''}
                  onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  state={state}
                  scope={{ bookId: book.id }}
                />
              ) : (
                <input
                  className="input"
                  value={form[f.key] || ''}
                  onChange={e => { setForm(fv => ({ ...fv, [f.key]: e.target.value })); if (f.key === config.nameKey) setFormError('') }}
                  placeholder={f.placeholder}
                  autoFocus={f.key === config.nameKey}
                />
              )}
              {f.key === config.nameKey && formError && <p className="text-red-500 text-xs mt-1 font-sans">{formError}</p>}
            </div>
          ))}
          <p className="text-xs font-sans text-ink-muted">
            Use <code className="bg-teal-pale text-teal-deeper px-1 rounded">@name</code> in the description to reference other elements in the book
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!form[config.nameKey]?.trim()}>
              {modal === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Related modal */}
      {relatedModal && (
        <RelatedModal
          el={relatedModal}
          elementType={elementType}
          book={book}
          navigate={navigate}
          onClose={() => setRelatedModal(null)}
        />
      )}

      {/* Append text modal */}
      <Modal isOpen={!!appendModal} onClose={() => setAppend(null)}>
        <form onSubmit={submitAppend} className="space-y-4">
          <MentionTextarea
            rows={6}
            autoFocus
            value={appendText}
            onChange={e => setAppendTx(e.target.value)}
            placeholder="Additional text… Use @name to reference other elements"
            state={state}
            scope={{ bookId: book.id }}
          />
          {appendError && <p className="text-red-500 text-xs font-sans">{appendError}</p>}
          <p className="text-xs font-sans text-ink-muted">The text will be appended to the existing description.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAppend(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!appendText.trim()}>Add</button>
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

/** Build navigate payload for any entity type, with fallback to current book context */
function entityNav(entity, fallbackBookId) {
  switch (entity.type) {
    case 'saga': return { view: 'saga', sagaId: entity.id }
    case 'book': return { view: 'book', bookId: entity.id }
    default:     return {
      view: 'book',
      bookId:      entity.bookId ?? fallbackBookId,
      tab:         entity.type + 's',
      highlightId: entity.id,
    }
  }
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${danger ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-teal-pale text-ink-muted hover:text-teal-deeper'}`}>
      {children}
    </button>
  )
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function FilterIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function RelatedIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
}

/** Greedy longest-first @mention scanner — mirrors DescriptionText parsing */
function scanMentions(text, entityMap) {
  const sortedNames = Object.keys(entityMap).sort((a, b) => b.length - a.length)
  const found = new Set()
  const results = []
  let i = 0
  while (i < text.length) {
    if (text[i] !== '@') { i++; continue }
    const afterAt = text.slice(i + 1)
    const afterAtLower = afterAt.toLowerCase()
    let matchedName = null
    for (const name of sortedNames) {
      if (afterAtLower.startsWith(name)) {
        const next = afterAt[name.length]
        if (!next || /[\s,.:;!?()[\]'"@\n]/.test(next)) {
          matchedName = name; break
        }
      }
    }
    if (matchedName) {
      if (!found.has(matchedName)) {
        found.add(matchedName)
        results.push(entityMap[matchedName])
      }
      i += 1 + matchedName.length
    } else {
      i++
    }
  }
  return results
}

function RelatedModal({ el, elementType, book, navigate, onClose }) {
  const [tab, setTab] = useState('outgoing')
  const config = CONFIGS[elementType]
  const myName = (el[config.nameKey] || '').toLowerCase()

  const allElements = useMemo(() => {
    const all = []
    ;[
      { list: book.characters, type: 'character', nameKey: 'name' },
      { list: book.places,     type: 'place',     nameKey: 'name' },
      { list: book.things,     type: 'thing',     nameKey: 'name' },
      { list: book.words,      type: 'word',      nameKey: 'word' },
    ].forEach(({ list, type, nameKey }) => {
      list?.forEach(item => all.push({ ...item, _type: type, _nameKey: nameKey }))
    })
    return all
  }, [book])

  const entityMap = useMemo(() => {
    const map = {}
    allElements.forEach(item => {
      map[(item[item._nameKey] || '').toLowerCase()] = { type: item._type, id: item.id, label: item[item._nameKey] }
    })
    return map
  }, [allElements])

  // Outgoing: entities this element @mentions
  const outgoing = useMemo(() => {
    const desc = el.description || ''
    return scanMentions(desc, entityMap).filter(e => e && (e.label || '').toLowerCase() !== myName)
  }, [el, entityMap, myName])

  // Incoming: entities that @mention this element
  const incoming = useMemo(() => {
    const results = []
    allElements.forEach(other => {
      if (other.id === el.id && other._type === elementType) return
      const desc = other.description || ''
      const mentioned = scanMentions(desc, entityMap).some(e => (e.label || '').toLowerCase() === myName)
      if (mentioned) results.push({ type: other._type, id: other.id, label: other[other._nameKey] })
    })
    return results
  }, [allElements, el, elementType, entityMap, myName])

  const typeColors = {
    character: 'bg-purple-100 text-purple-700 border border-purple-200',
    place:     'bg-amber-100 text-amber-700 border border-amber-200',
    thing:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
    word:      'bg-sky-100 text-sky-700 border border-sky-200',
  }

  const list = tab === 'outgoing' ? outgoing : incoming

  return (
    <Modal isOpen onClose={onClose}>
      <div className="flex border-b border-cream-border mb-4 -mt-1">
        <button
          onClick={() => setTab('outgoing')}
          className={`flex-1 py-2.5 text-sm font-sans font-medium transition-colors ${tab === 'outgoing' ? 'text-teal-dark border-b-2 border-teal-dark' : 'text-ink-muted hover:text-ink'}`}
        >
          Mentions ({outgoing.length})
        </button>
        <button
          onClick={() => setTab('incoming')}
          className={`flex-1 py-2.5 text-sm font-sans font-medium transition-colors ${tab === 'incoming' ? 'text-teal-dark border-b-2 border-teal-dark' : 'text-ink-muted hover:text-ink'}`}
        >
          Mentioned in ({incoming.length})
        </button>
      </div>
      {list.length === 0 ? (
        <p className="text-center font-body text-ink-muted py-8 text-sm italic">No relations</p>
      ) : (
        <div className="space-y-2">
          {list.map(entity => (
            <button
              key={entity.id}
              onClick={() => {
                onClose()
                navigate({ view: 'book', bookId: book.id, tab: entity.type + 's', highlightId: entity.id })
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 transition-opacity hover:opacity-75 ${typeColors[entity.type]}`}
            >
              <span className="font-sans font-medium text-sm">@{entity.label}</span>
              <span className="text-xs opacity-60 ml-auto">{CONFIGS[entity.type]?.label}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
