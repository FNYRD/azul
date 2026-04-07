# CLAUDE.md

## What this app is

**Azul** is a personal reading-journal app. Users register authors, sagas, and books, then annotate each book with characters, places, objects, and vocabulary. Everything is cross-referenced via `@mentions`. No backend — all data lives in `localStorage` under `azul-app-v1`.

```bash
npm run dev    # dev server (usually :5174 if :5173 is taken)
npm run build  # verify no compile errors before finishing
```

No linter or test suite.

## Navigation

Pure state — no React Router. `App.jsx` holds a single `nav` object:

```js
{ view: 'landing' | 'library' | 'author' | 'saga' | 'book' | 'search',
  authorId, sagaId, bookId, query }
```

`navigate(newNav)` replaces it. Always pass explicit `authorId`/`bookId` — there is no wrapping navigate that fills them in automatically (it was removed to allow cross-book navigation).

## Data model

```
state.authors[]
  ├── id, name, description
  ├── sagas[]   { id, name, description }
  └── books[]   { id, sagaId|null, title, description, startDate, endDate,
                  characters[], places[], things[], words[] }
                  └── elements: { id, name|word, age?, description }
```

All mutations via `dispatch()` in `AppContext.jsx`. Actions: `ADD/UPDATE/DELETE_AUTHOR`, `ADD/UPDATE/DELETE_SAGA`, `ADD/UPDATE/DELETE_BOOK`, `ADD/UPDATE/DELETE_ELEMENT`, `APPEND_TO_DESCRIPTION`.

## Key components

### MentionTextarea (`src/components/ui/MentionTextarea.jsx`)
Replaces every `<textarea>` for description fields across the entire app. Shows a `@mention` autocomplete dropdown (rendered via `createPortal` into `document.body` with `position:fixed` to avoid modal clipping). Props:
- `state` — full app state, used to build the global entity list (authors, sagas, books, characters, places, things, words)
- `scope` — `{ bookId, authorId }` — sorts suggestions: same book first, then same author, then others

### DescriptionText (`src/components/ui/DescriptionText.jsx`)
Renders description text with `@mentions` as clickable colored chips. Accepts `state` (global lookup) or `book` (local lookup). Entity objects returned to `onMentionClick` include `{ type, id, label, authorId, bookId? }` for navigation.

### ElementList (`src/components/ElementList.jsx`)
Single generic component for all four element types. `elementType: 'character'|'place'|'thing'|'word'`. Config driven by `CONFIGS` map. Includes:
- **RelatedModal** — shows bidirectional `@mention` relationships in two tabs ("Menciona" / "Mencionado en")
- **entityNav(entity, fallbackBookId, fallbackAuthorId)** — helper that builds the correct `navigate()` payload for any entity type (author → author view, saga → saga view, book → book view, element → book view with tab + highlight)

### Modal (`src/components/ui/Modal.jsx`)
Bottom-sheet, `z-50`. Locks `document.body.overflow`. The MentionTextarea dropdown uses `z-9999` via portal to appear above it.

## @mention system

- **Autocomplete**: `MentionTextarea` detects `@` while typing, filters all entities globally, inserts `@Name ` on selection. MENTION_RE supports multi-word names with spaces.
- **Duplicate names**: If two entities share the same name, both appear in the dropdown with a sub-label `bookTitle · authorName`. On selection, the qualifier `@Name (BookTitle)` is inserted so the reference is unambiguous.
- **Display**: `DescriptionText` resolves `@Name` or `@Name (BookTitle)` against the global entity map using a greedy longest-first parser (sorted by name length descending). Renders clickable chips with type-color coding.
- **Colors**: author=rose, saga=violet, book=orange, character=purple, place=amber, thing=emerald, word=sky.
- **Chip click navigation**: All views that show `DescriptionText` must pass `onMentionClick` — if omitted, chips render but are not clickable.

## Uniqueness validation

Every create/edit modal validates uniqueness before dispatching:
- **Authors** (`LibraryView`): case-insensitive name match across all authors
- **Sagas** (`AuthorView`): case-insensitive name match within same author
- **Books** (`AuthorView`, `SagaView`): case-insensitive title match within same author
- **Elements** (`ElementList`): case-insensitive name/word match within same book + same element type

On conflict a red error message appears below the input field; the modal stays open and nothing is dispatched.

## Test plan

Tests live in `test.md` at the project root. Format: 6 sections (App general, Autores, Sagas y libros, Elementos, @mentions, Búsqueda global). Status per row: ✅ pasado | ❌ fallido | 🔄 en progreso | ⬜ pendiente.

**Last completed test: 6.5**. All sections complete ✅.

Known pending fixes before reaching those tests:
- Test 5.1: `MENTION_RE` regression — `*` was changed to `+`, so typing bare `@` no longer opens the dropdown. Fix before running section 5.
- Test 5.11: "Añadir notas" must append with a blank line + `---` separator. Not yet implemented.

## "Añadir notas" separator requirement

`APPEND_TO_DESCRIPTION` action (and the submit handlers in AuthorView/SagaView/BookView) must concatenate the new text after a blank line and a `---` divider:
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
