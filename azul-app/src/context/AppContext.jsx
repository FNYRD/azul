import { createContext, useContext, useState, useCallback, useRef } from "react"
import { api } from "../api"

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState({ sagas: [], books: [] })
  const mentionLoaded = useRef(false)

  const refreshMentions = useCallback(async () => {
    try {
      const data = await api.getMentionEntities()
      setState(data)
      mentionLoaded.current = true
    } catch (e) {
      console.error("mention-entities fetch failed", e)
    }
  }, [])

  const ensureMentions = useCallback(() => {
    if (!mentionLoaded.current) refreshMentions()
  }, [refreshMentions])

  const dispatch = useCallback(async (action) => {
    let result = null
    switch (action.type) {

      case "ADD_SAGA":
        result = await api.createSaga({ name: action.name, author: action.author || "", description: action.description || "" })
        break
      case "UPDATE_SAGA":
        result = await api.updateSaga(action.sagaId, action.updates)
        break
      case "DELETE_SAGA":
        await api.deleteSaga(action.sagaId)
        break

      case "ADD_BOOK":
        if (action.sagaId) {
          result = await api.createBookInSaga(action.sagaId, {
            title: action.title, author: action.author || "", description: action.description || "",
            startDate: action.startDate || null, endDate: action.endDate || null,
          })
        } else {
          result = await api.createBook({
            title: action.title, author: action.author || "", description: action.description || "",
            startDate: action.startDate || null, endDate: action.endDate || null, sagaId: null,
          })
        }
        break
      case "UPDATE_BOOK":
        result = await api.updateBook(action.bookId, action.updates)
        break
      case "DELETE_BOOK":
        await api.deleteBook(action.bookId)
        break

      case "ADD_ELEMENT":
        result = await api.createElement(action.bookId, action.elementType, action.data)
        break
      case "UPDATE_ELEMENT":
        result = await api.updateElement(action.elementType, action.elementId, action.updates)
        break
      case "DELETE_ELEMENT":
        await api.deleteElement(action.elementType, action.elementId)
        break

      case "APPEND_TO_DESCRIPTION": {
        if (action.target === "saga")    result = await api.appendSaga(action.sagaId, action.text)
        if (action.target === "book")    result = await api.appendBook(action.bookId, action.text)
        if (action.target === "element") result = await api.appendElement(action.elementType, action.elementId, action.text)
        break
      }

      default:
        console.warn("Unknown action", action.type)
    }

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
