# CLAUDE.md

## ⚠️ Persistence / Deploy
`/home/github/FNYRD/main_azul` is a **deploy checkout (GitHub Actions)**. A deploy `git reset`s to GitHub `main`, **reverting any tracked file hand-edited on the server** (source, `dist/`, docs). To make a change stick it must be **committed and pushed to `main`** (via the SSH deploy key). See `context.md` → "Persistencia / Deploy".

## What this app is

**Azul** is a personal reading-journal app, **mobile-first (used on iPhone)**. Users register sagas and books, then annotate each book with characters, places, objects, and vocabulary. Everything is cross-referenced via `@mentions`.

**Backend:** data lives in a **Django + DRF + Gunicorn** API (SQLite), served under `/api/` (see `context.md` for endpoints and deploy). The frontend talks to it via `src/api.js` + `dispatch()` in `AppContext.jsx`. (There is no localStorage store anymore.)

```bash
npm run dev    # dev server (usually :5174 if :5173 is taken)
npm run build  # verify no compile errors before finishing; regenerates dist/ served by Nginx
```

No linter or test suite.

## Navigation

Pure state — no React Router. `App.jsx` holds a **history stack**:

```js
const [history, setHistory] = useState([{ view: 'landing' }])
const nav = history[history.length - 1]          // current view = top of stack
```

- `nav` shape: `{ view: 'landing'|'library'|'saga'|'book'|'search', sagaId, bookId, tab, query }`
  (there is **no** `author` view/layer — library shows sagas + standalone books directly).
- `navigate(newNav)` → **push** onto the stack. Always pass explicit `sagaId`/`bookId`.
- `goBack()` → **pop** → returns to the EXACT previous point (its `sagaId`/`bookId`/`tab`), not a fixed parent.
- Every pushable view (library, saga, book, search) renders `AppHeader`, which owns the **Back** button (`canGoBack` prop). `landing` is the base of the stack (no header).
- On back the previous view renders from the top; scroll position is **not** restored (by design).
- `<main>` top padding is `calc(env(safe-area-inset-top) + 4rem)` so the fixed `AppHeader` never overlaps content in the iOS standalone PWA (the notch/status-bar area). Left/right/bottom safe-areas are padded too.

## Data model

```
Saga  (author: free-text CharField, name, description)
  └── Book (saga FK | null, author: free-text, title, description, startDate, endDate)
        ├── characters[]  { id, name, age?, description }
        ├── places[]      { id, name, description }
        ├── things[]      { id, name, description }
        └── words[]       { id, word, description }
```

- `author` is **free text** on Saga/Book, not a separate entity.
- `Character` also has `created_at` (`auto_now_add`). Models `Creature` and `Fact` exist in the DB/migrations (each FK to `Book`) but have **no frontend UI** yet — see `Fixes (2026-07-28)`.
- Book with `saga = null` = standalone book.
- `AppContext.state` shape for @mention autocomplete: `{ sagas: [], books: [] }`.
- All mutations via `dispatch()` in `AppContext.jsx` (calls the API, then refreshes mention-entities). Actions: `ADD/UPDATE/DELETE_SAGA`, `ADD/UPDATE/DELETE_BOOK`, `ADD/UPDATE/DELETE_ELEMENT`, `APPEND_TO_DESCRIPTION`.

## Key components

### MentionTextarea (`src/components/ui/MentionTextarea.jsx`)
Replaces every `<textarea>` for description fields across the entire app. Shows a `@mention` autocomplete dropdown (rendered via `createPortal` into `document.body` with `position:fixed` to avoid modal clipping). Props:
- `state` — full app state, used to build the global entity list (sagas, books, characters, places, things, words)
- `scope` — `{ bookId }` — sorts suggestions: same book first, then others

### DescriptionText (`src/components/ui/DescriptionText.jsx`)
Renders description text with `@mentions` as clickable colored chips. Accepts `state` (global lookup) or `book` (local lookup). Entity objects returned to `onMentionClick` include `{ type, id, label, bookId? }` for navigation.

### ElementList (`src/components/ElementList.jsx`)
Single generic component for all four element types. `elementType: 'character'|'place'|'thing'|'word'`. Config driven by `CONFIGS` map. Includes:
- **RelatedModal** — shows bidirectional `@mention` relationships in two tabs ("Mentions" / "Mentioned in")
- **entityNav(entity, fallbackBookId)** — helper that builds the correct `navigate()` payload for any entity type (saga → saga view, book → book view, element → book view with tab + highlight)

### Modal (`src/components/ui/Modal.jsx`)
Top-sheet via `createPortal` to `document.body`, `position:fixed`, follows `window.visualViewport` to survive the iOS keyboard.
- **iOS scroll-lock:** on open it freezes the body with `position:fixed; top:-scrollY` (plain `overflow:hidden` is NOT enough on iOS Safari — the keyboard scrolls the background and it stays down); on close it restores the exact scroll position without animation. This fixes the "screen stays scrolled down" bug on iPhone.
- **Always-present ✕ close button** (top-right of the sheet) so no modal can trap the user — the full-height sheet covers the backdrop, so tapping outside doesn't close it. The element-detail (`view`) and `RelatedModal` had no close button before and trapped users.
- The MentionTextarea dropdown uses `z-9999` via portal to appear above it.

## Backup + warning

- Daily root cron (07:00 UTC) → `/usr/local/bin/azul-backup.sh` commits `db.sqlite3` and pushes over the **explicit SSH deploy-key URL** (`git@github-azul:FNYRD/azul.git`), never `origin` (deploys reset `origin` to a dead-token HTTPS URL). Writes `/var/lib/azul/backup-status.json`, served by Nginx at `/backup-status.json`.
- `BackupWarning` (in `App.jsx`) fetches that status on load; if the last success is >2 days old / missing / `ok:false` it shows a dismissible red banner ("Avisar a Jesús…") and, when stale, POSTs `/api/backup/run/` (`BackupTriggerView`) to re-fire the backup.

## @mention system

- **Autocomplete**: `MentionTextarea` detects `@` while typing, filters all entities globally, inserts `@Name ` on selection. Supports multi-word names with spaces.
- **Duplicate names**: If two entities share the same name, both appear in the dropdown with a differentiating sub-label. On selection, the qualifier `@Name (BookTitle)` is inserted so the reference is unambiguous.
- **Display**: `DescriptionText` resolves `@Name` or `@Name (BookTitle)` against the global entity map using a greedy longest-first parser (sorted by name length descending). Renders clickable chips with type-color coding.
- **Colors**: saga=violet, book=orange, character=purple, place=amber, thing=emerald, word=sky.
- **Chip click navigation**: All views that show `DescriptionText` must pass `onMentionClick` — if omitted, chips render but are not clickable.

## Uniqueness validation

Every create/edit modal validates uniqueness before dispatching:
- **Sagas** (`LibraryView`): case-insensitive name match across all sagas
- **Books** (`LibraryView`, `SagaView`): case-insensitive title match
- **Elements** (`ElementList`): case-insensitive name/word match within same book + same element type

On conflict a red error message appears below the input field; the modal stays open and nothing is dispatched.

## Test plan

Tests live in `test.md` at `azul-app/`. Format sections: App general, Sagas y libros, Elementos, @mentions, Búsqueda global. Status per row: ✅ pasado | ❌ fallido | 🔄 en progreso | ⬜ pendiente. (Note: the old "Autores" section is obsolete — the author layer was removed; author is now free text.)

## "Añadir notas" separator requirement

`APPEND_TO_DESCRIPTION` action must concatenate the new text after a blank line and a `---` divider:
```
<existing text>

---

<new text>
```

## Design tokens (`tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `teal-app` | `#5DA8B5` | Page background |
| `teal-dark` | `#4A8E99` | Buttons, active tabs |
| `cream` | `#EAE5D9` | Card backgrounds |
| `ink` | `#2A4B52` | Primary text |
| `ink-muted` | `#7A9EA5` | Secondary text |

Cards use `.card` (defined in `index.css`) with `shadow-card`. Clickable cards auto-get `hover:-translate-y-3px + shadow-card-hover` via CSS.

## Icons

All hand-written SVGs in `src/components/ui/Icons.jsx`. No icon library. Monochromatic, inherit `currentColor`.

## Fonts (loaded in `index.html`)

`Pinyon Script` (landing title — uses inline `style`, not Tailwind class, to avoid purge issues), `Playfair Display` (headings), `Crimson Text` (body), `Inter` (UI sans).


## Fixes (2026-07-28)

- **Bug crítico (crash 500 al añadir personajes).** `api/models.py` estaba desactualizado respecto a las migraciones: le faltaban `Character.created_at` (añadido en `0003` como columna `NOT NULL` sin default) y los modelos `Creature`/`Fact` (`0004`/`0005`, ambos FK a `Book`, con datos en la BD). Al insertar un `Character` el ORM no seteaba `created_at` → `IntegrityError: NOT NULL constraint failed: api_character.created_at`. **Fix:** restaurados en `models.py` el campo + los dos modelos para que coincidan con la BD. Sin migración destructiva, cero pérdida de datos.
- **`LibraryView`**: create de saga/libro no validaba duplicados ni capturaba errores → el `400` del backend quedaba como promesa rechazada sin feedback y con el modal atascado. Añadido check case-insensitive + `try/catch` que muestra el error (helper `apiError`, parsea `nonFieldErrors`).
- **`ElementList`**: `try/catch` en submit/append (mismo `apiError`) para no fallar en silencio.
- **`highlightId`**: ahora se pasa `App.jsx → BookView → ElementList`. El elemento destino de una navegación (Related / búsqueda / mención cross-book) se resalta (`ring-2 ring-teal-dark`) y hace `scrollIntoView`. Antes la plomería `highlightId` era código muerto.
- **`DescriptionText`**: una mención con qualifier (`@Nombre (Libro)`) ahora resuelve a `entityMap[qualifiedKey]` (la entidad homónima correcta) y el chip muestra el texto completo, en vez de enlazar a la primera homónima y dejar `(Libro)` como texto suelto.

**Drift restante (cosmético, no rompe runtime):** `makemigrations` aún pide `AlterModelOptions` de `ordering` en character/book/saga + `AlterField` de `fact.created_at`. Generar y commitear ese `0006` (no destructivo) **desde un clon del repo**, nunca creando el archivo de migración directo en el checkout del server (se borraría en el deploy y dejaría la BD referenciando una migración inexistente → rompería `migrate`).
