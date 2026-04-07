/**
 * AppContext — API-backed, lazy-loading state.
 *
 * `state`  — lightweight mention-entities for MentionTextarea / DescriptionText
 *             (populated via GET /api/mention-entities/, loaded once on app entry)
 *
 * `dispatch(action)` — async, calls the API, then refreshes mention-entities.
 *                       Returns the API response so views can react.
 *
 * Views load their own data directly from the API (see api.js) and use a
 * `revision` counter to re-fetch after mutations.
 */
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { api } from '../api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // mention-entities shape: { authors: [...] }  — matches what MentionTextarea / DescriptionText expect
  const [state, setState] = useState({ authors: [] })
  const mentionLoaded = useRef(false)

  const refreshMentions = useCallback(async () => {
    try {
      const authors = await api.getMentionEntities()
      setState({ authors })
      mentionLoaded.current = true
    } catch (e) {
      console.error('mention-entities fetch failed', e)
    }
  }, [])

  // Called by LibraryView on app entry — loads mention entities once
  const ensureMentions = useCallback(() => {
    if (!mentionLoaded.current) refreshMentions()
  }, [refreshMentions])

  // ── Dispatch ──────────────────────────────────────────────────────────────
  const dispatch = useCallback(async (action) => {
    let result = null
    switch (action.type) {

      /* ── AUTHORS ── */
      case 'ADD_AUTHOR':
        result = await api.createAuthor({ name: action.name, description: action.description || '' })
        break
      case 'UPDATE_AUTHOR':
        result = await api.updateAuthor(action.id, action.updates)
        break
      case 'DELETE_AUTHOR':
        await api.deleteAuthor(action.id)
        break

      /* ── SAGAS ── */
      case 'ADD_SAGA':
        result = await api.createSaga(action.authorId, { name: action.name, description: action.description || '' })
        break
      case 'UPDATE_SAGA':
        result = await api.updateSaga(action.sagaId, action.updates)
        break
      case 'DELETE_SAGA':
        await api.deleteSaga(action.sagaId)
        break

      /* ── BOOKS ── */
      case 'ADD_BOOK':
        if (action.sagaId) {
          // Created via saga endpoint so it's correctly linked
          result = await api.createBookInSaga(action.sagaId, {
            title: action.title, description: action.description || '',
            startDate: action.startDate || null, endDate: action.endDate || null,
          })
        } else {
          result = await api.createBook(action.authorId, {
            title: action.title, description: action.description || '',
            startDate: action.startDate || null, endDate: action.endDate || null,
            sagaId: null,
          })
        }
        break
      case 'UPDATE_BOOK':
        result = await api.updateBook(action.bookId, action.updates)
        break
      case 'DELETE_BOOK':
        await api.deleteBook(action.bookId)
        break

      /* ── ELEMENTS ── */
      case 'ADD_ELEMENT':
        result = await api.createElement(action.bookId, action.elementType, action.data)
        break
      case 'UPDATE_ELEMENT':
        result = await api.updateElement(action.elementType, action.elementId, action.updates)
        break
      case 'DELETE_ELEMENT':
        await api.deleteElement(action.elementType, action.elementId)
        break

      /* ── APPEND ── */
      case 'APPEND_TO_DESCRIPTION': {
        if (action.target === 'author')  result = await api.appendAuthor(action.authorId, action.text)
        if (action.target === 'saga')    result = await api.appendSaga(action.sagaId, action.text)
        if (action.target === 'book')    result = await api.appendBook(action.bookId, action.text)
        if (action.target === 'element') result = await api.appendElement(action.elementType, action.elementId, action.text)
        break
      }

      default:
        console.warn('Unknown action', action.type)
    }

    // Refresh mention entities in background after any mutation
    refreshMentions()
    return result
  }, [refreshMentions])

  return (
    <AppContext.Provider value={{ state, dispatch, ensureMentions }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
