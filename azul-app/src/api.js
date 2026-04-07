const BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error('API error'), { data, status: res.status })
  return data
}

const get  = (path)        => req('GET',    path)
const post = (path, body)  => req('POST',   path, body)
const patch = (path, body) => req('PATCH',  path, body)
const del  = (path)        => req('DELETE', path)

export const api = {
  // ── Library ────────────────────────────────────────────────────────────────
  getAuthors:  () => get('/authors/'),

  // ── Author view ────────────────────────────────────────────────────────────
  getAuthor:   (id) => get(`/authors/${id}/`),

  // ── Saga view ──────────────────────────────────────────────────────────────
  getSaga:     (id) => get(`/sagas/${id}/`),

  // ── Book view ──────────────────────────────────────────────────────────────
  getBook:     (id) => get(`/books/${id}/`),

  // ── Mention entities (names-only, for autocomplete) ────────────────────────
  getMentionEntities: () => get('/mention-entities/'),

  // ── Search ─────────────────────────────────────────────────────────────────
  search: (q) => get(`/search/?q=${encodeURIComponent(q)}`),

  // ── Authors CRUD ───────────────────────────────────────────────────────────
  createAuthor:          (data)     => post('/authors/', data),
  updateAuthor:          (id, data) => patch(`/authors/${id}/`, data),
  deleteAuthor:          (id)       => del(`/authors/${id}/`),
  appendAuthor:          (id, text) => post(`/authors/${id}/append/`, { text }),

  // ── Sagas CRUD ─────────────────────────────────────────────────────────────
  createSaga:            (authorId, data)     => post(`/authors/${authorId}/sagas/`, data),
  updateSaga:            (id, data)           => patch(`/sagas/${id}/`, data),
  deleteSaga:            (id)                 => del(`/sagas/${id}/`),
  appendSaga:            (id, text)           => post(`/sagas/${id}/append/`, { text }),
  createBookInSaga:      (sagaId, data)       => post(`/sagas/${sagaId}/books/`, data),

  // ── Books CRUD ─────────────────────────────────────────────────────────────
  createBook:            (authorId, data)     => post(`/authors/${authorId}/books/`, data),
  updateBook:            (id, data)           => patch(`/books/${id}/`, data),
  deleteBook:            (id)                 => del(`/books/${id}/`),
  appendBook:            (id, text)           => post(`/books/${id}/append/`, { text }),

  // ── Elements CRUD ──────────────────────────────────────────────────────────
  createElement:         (bookId, type, data) => post(`/books/${bookId}/${type}s/`, data),
  updateElement:         (type, id, data)     => patch(`/${type}s/${id}/`, data),
  deleteElement:         (type, id)           => del(`/${type}s/${id}/`),
  appendElement:         (type, id, text)     => post(`/${type}s/${id}/append/`, { text }),
}
