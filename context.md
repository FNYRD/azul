# Azul App — Context

## Server
- VPS: `jesus@62.171.185.86 -p 15132`
- OS: Ubuntu 22.04
- Files owned by root → usar `sudo cp` desde /tmp

## Stack
- **Frontend:** React + Vite + Tailwind → `azul-app/`
- **Backend:** Django + DRF + Gunicorn → `azul-backend/`
- **DB:** SQLite (`azul-backend/db.sqlite3`)
- **Proxy:** Nginx en puerto 4430, dominio `azul.arducloud.com`
- **Servicio gunicorn:** `systemctl restart azul-backend`
- **Deploy frontend:** `npm run build` en `azul-app/` → genera `dist/` que sirve Nginx directamente

## Arquitectura de datos
```
Saga  (author: CharField, name, description)
  └── Book (saga FK, author: CharField, title, description, start_date, end_date)
        ├── Character (name, age, description)
        ├── Place     (name, description)
        ├── Thing     (name, description)
        └── Word      (word, description)
```
- `author` es texto libre en Saga y Book (no entidad separada)
- Books sin saga = standalone books

## API endpoints clave
- `GET  /api/library/`              → `{ sagas, standaloneBooks }`
- `POST /api/sagas/`                → crear saga
- `POST /api/books/`                → crear standalone book
- `POST /api/sagas/{id}/books/`     → crear book en saga
- `GET/PATCH/DELETE /api/sagas/{id}/`
- `GET/PATCH/DELETE /api/books/{id}/`
- `POST /api/*/append/`             → añade texto a description con separador `---`
- `GET  /api/mention-entities/`     → `{ sagas: [{id,name}], books: [{id,title,characters,...}] }`
- `GET  /api/search/?q=`

## Navegación frontend (sin React Router)
- Estado `nav` en `App.jsx`: `landing → library → saga → book`
- Sin capa "author": library muestra sagas + standalone books directamente
- Back: `book → saga` (si tiene sagaId) o `library`; `saga → library`

## AppContext
- `state` shape: `{ sagas: [], books: [] }` (para mention autocomplete)
- `dispatch(action)` → llama API y refresca mention-entities
- Actions: `ADD_SAGA`, `UPDATE_SAGA`, `DELETE_SAGA`, `ADD_BOOK`, `UPDATE_BOOK`, `DELETE_BOOK`, `ADD_ELEMENT`, `UPDATE_ELEMENT`, `DELETE_ELEMENT`, `APPEND_TO_DESCRIPTION`

## Notas importantes
- DRF usa camelCase renderer/parser → frontend envía `sagaId`, `startDate`, etc.
- `saga_id` en serializers NO debe llevar `source='saga_id'` (DRF lo rechaza con AssertionError)
- Archivos del proyecto son de root → workflow: escribir a `/tmp`, luego `sudo cp`
- `AuthorView.jsx` existe en disco pero ya no se usa (no está en el router)
