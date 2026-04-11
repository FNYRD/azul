const BASE = import.meta.env.DEV ? "http://localhost:8000/api" : "/api"

async function req(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error("API error"), { data, status: res.status })
  return data
}

const get   = (path)        => req("GET",    path)
const post  = (path, body)  => req("POST",   path, body)
const patch = (path, body)  => req("PATCH",  path, body)
const del   = (path)        => req("DELETE", path)

export const api = {
  getLibrary:         ()          => get("/library/"),
  getSaga:            (id)        => get(`/sagas/${id}/`),
  getBook:            (id)        => get(`/books/${id}/`),
  getMentionEntities: ()          => get("/mention-entities/"),
  search:             (q)         => get(`/search/?q=${encodeURIComponent(q)}`),

  createSaga:         (data)      => post("/sagas/", data),
  updateSaga:         (id, data)  => patch(`/sagas/${id}/`, data),
  deleteSaga:         (id)        => del(`/sagas/${id}/`),
  appendSaga:         (id, text)  => post(`/sagas/${id}/append/`, { text }),
  createBookInSaga:   (sagaId, data) => post(`/sagas/${sagaId}/books/`, data),

  createBook:         (data)      => post("/books/", data),
  updateBook:         (id, data)  => patch(`/books/${id}/`, data),
  deleteBook:         (id)        => del(`/books/${id}/`),
  appendBook:         (id, text)  => post(`/books/${id}/append/`, { text }),

  createElement:      (bookId, type, data) => post(`/books/${bookId}/${type}s/`, data),
  updateElement:      (type, id, data)     => patch(`/${type}s/${id}/`, data),
  deleteElement:      (type, id)           => del(`/${type}s/${id}/`),
  appendElement:      (type, id, text)     => post(`/${type}s/${id}/append/`, { text }),
}
