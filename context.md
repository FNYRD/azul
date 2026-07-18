# Azul App — Context

## ⚠️ Persistencia / Deploy (LEER PRIMERO)
`/home/github/FNYRD/main_azul` es un **checkout de deploy (GitHub Actions)**. Cada deploy hace `git reset/checkout` al `main` de GitHub, lo que **REVIERTE cualquier archivo rastreado editado a mano en el servidor** (código, `dist/`, docs). También **resetea `origin`** a una URL HTTPS con token efímero que caduca.
- Para que un cambio **persista**, hay que **commitearlo y hacer push a `main`** (por SSH con el deploy key, ver Backup).
- Editar en el servidor sin commitear = se pierde en el siguiente deploy.

## Server
- VPS: `ssh jesus@jeroup1.arducloud.com -p 55174` (usuario `jesus`, **no** root). `sudo` con contraseña vía `sudo -S`.
- OS: Ubuntu 22.04.
- Archivos del repo son de **root** → workflow de edición manual: escribir a `/tmp`, `sudo cp` al destino, `sudo chown root:root`.

## Stack
- **Frontend:** React + Vite + Tailwind → `azul-app/`
- **Backend:** Django + DRF + Gunicorn (corre como **root**, 127.0.0.1:8000) → `azul-backend/`
- **DB:** SQLite (`azul-backend/db.sqlite3`)
- **Proxy:** Nginx puerto 4430, `server_name azul.arducloud.com`. Delante hay **Cloudflare** (HTTPS público `https://azul.arducloud.com/`).
- **Reiniciar backend:** `sudo systemctl restart azul-backend` · **Nginx:** `sudo systemctl reload nginx`
- **Deploy frontend manual:** `cd azul-app && sudo npm run build` → genera `dist/` que sirve Nginx.
- **Uso real: iPhone como PWA en pantalla de inicio** (standalone). Probar iOS Safari standalone (teclado, scroll, safe-area, caché del webview).

## Caché / PWA
- `index.html` y `manifest.json` se sirven con `Cache-Control: no-cache` (config Nginx) para que el PWA de iOS actualice al bundle nuevo. Los assets con hash van `immutable`.
- Cloudflare no cachea `index.html` (`cf-cache-status: DYNAMIC`). Tras un deploy, para ver cambios usar `?nocache=...`. En el iPhone, cerrar y reabrir el PWA (a veces re-añadirlo a pantalla de inicio).

## Arquitectura de datos
```
Saga  (author: CharField texto libre, name, description)
  └── Book (saga FK|null, author: CharField, title, description, start_date, end_date)
        ├── Character (name, age, description)
        ├── Place / Thing (name, description)
        └── Word (word, description)
```
- `author` es texto libre (no entidad). Book sin saga = standalone.

## API endpoints
- `GET  /api/library/` → `{ sagas, standaloneBooks }`
- `POST /api/sagas/` · `GET/PATCH/DELETE /api/sagas/{id}/` · `POST /api/sagas/{id}/books/`
- `POST /api/books/` · `GET/PATCH/DELETE /api/books/{id}/`
- `POST /api/*/append/` → añade texto con separador `---`
- `GET  /api/mention-entities/` · `GET /api/search/?q=`
- `POST /api/backup/run/` → dispara el backup on-demand (ver Backup). Cooldown 10 min.

## Navegación frontend (sin React Router)
- **Pila de historial** en `App.jsx`: `const [history,setHistory]`; `nav = history.at(-1)`.
- `navigate(x)` = **push**; `goBack()` = **pop** → vuelve al punto EXACTO anterior (no a un padre fijo).
- Vistas: `landing → library → saga → book → search`. Sin capa "author".
- Toda vista pusheable rendea `AppHeader` (botón Back, prop `canGoBack`). `landing` es la base (sin header). Al volver NO se restaura el scroll (a propósito).
- `<main>` usa `paddingTop: calc(env(safe-area-inset-top) + 4rem)` para que la barra fija no tape el contenido en standalone (el notch). Los safe-area de lados/abajo también se compensan.

## AppContext
- `state`: `{ sagas: [], books: [] }` (mention autocomplete). `dispatch(action)` llama API y refresca mention-entities.
- Actions: `ADD/UPDATE/DELETE_SAGA`, `ADD/UPDATE/DELETE_BOOK`, `ADD/UPDATE/DELETE_ELEMENT`, `APPEND_TO_DESCRIPTION`.

## Modal (`azul-app/src/components/ui/Modal.jsx`)
- Top-sheet vía `createPortal` a `document.body`, `position:fixed`, sigue `window.visualViewport` (teclado iOS).
- **Scroll-lock iOS:** al abrir congela el body con `position:fixed; top:-scrollY` (no basta `overflow:hidden` en iOS); al cerrar restaura la posición exacta sin animación. Evita "pantalla scrolleada hacia abajo".
- **Botón ✕ (cerrar) SIEMPRE presente** arriba a la derecha del sheet → ningún modal (detalle de elemento, Related, etc.) puede atrapar al usuario (el sheet tapa el backdrop).

## Backup diario de la BD a GitHub
- Cron de **root 07:00 UTC** → `/usr/local/bin/azul-backup.sh`: commitea `db.sqlite3`, **push por URL SSH explícita** `git push git@github-azul:FNYRD/azul.git HEAD:main` (NO por `origin`, porque los deploys lo resetean a HTTPS con token muerto).
- Deploy key SSH: `/root/.ssh/azul_deploy` (+ alias `github-azul` en `/root/.ssh/config`). Añadido como Deploy Key con write en el repo.
- El script escribe `/var/lib/azul/backup-status.json` (`{ok,lastAttempt,lastSuccess}`); Nginx lo sirve en `/backup-status.json` (`no-cache`).
- **Aviso en la app** (`BackupWarning` en `App.jsx`): al abrir consulta el estado; si el último éxito es de **>2 días**, o falta, o `ok:false`, muestra un **popup rojo con ✕** ("Avisar a Jesús: no se están haciendo backups"). Si está obsoleto, además hace `POST /api/backup/run/` para **relanzar el backup** (endpoint `BackupTriggerView` en `api/views.py`; gunicorn root puede lanzar el script).
- Forzar backup manual: `sudo /usr/local/bin/azul-backup.sh`.

## Notas
- DRF usa camelCase → frontend envía `sagaId`, `startDate`, etc. `saga_id` en serializers NO lleva `source='saga_id'`.
- `AuthorView.jsx` existe pero NO se usa (fuera del router).
