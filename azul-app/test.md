# Test Plan — Azul App

> De más general a más específico.
> Estado: ✅ pasado | ❌ fallido | 🔄 en progreso | ⬜ pendiente
>
> ⚠️ **Actualización:** la capa "Autores" fue eliminada (author es ahora texto libre en Saga/Book),
> así que la **sección 2 (Autores) está obsoleta**. La navegación usa una **pila de historial**
> (`App.jsx`): `goBack()` vuelve al punto EXACTO anterior, no a un padre fijo.
>
> 🛠 **2026-07-28:** detectado y corregido un **crash 500 al añadir personajes** (`Character.created_at` faltaba en el modelo; ver `CLAUDE.md` → Fixes). Re-testeado end-to-end vía Chrome DevTools MCP (crear saga/libro/personaje/lugar/palabra, búsqueda, @mentions + autocomplete, Related, navegación con highlight). Además corregidos: validación de duplicados en biblioteca, resaltado por `highlightId`, y el chip de menciones con qualifier.

## Nota de diseño

Cuando un flujo de test requiera confirmación del usuario antes de una acción destructiva (eliminar saga, libro o elemento), **no usar el `confirm()` nativo del navegador**. La app debe mostrar su propio modal de confirmación (`ConfirmModal`) con el estilo de diseño de Azul (bottom sheet, fondo `cream`, botón rojo para confirmar). El `confirm()` del navegador bloquea la página, impide snapshots del MCP y rompe el flujo de test.

## Proceso de ejecución

1. Tomar el primer test con estado ⬜ (de arriba hacia abajo).
2. Marcarlo 🔄 mientras se ejecuta en el navegador con Chrome DevTools MCP.
3. **Si pasa** → marcarlo ✅ y pasar al siguiente test.
4. **Si falla** → marcarlo ❌, corregir el código, hacer build (`npm run build`), recargar el navegador, volver a testarlo. Cuando pase, marcarlo ✅ y continuar.
5. Trabajar corrido sin parar hasta que el usuario diga la palabra **"termitas"**. Al recibirla: terminar el test en curso con su flujo completo (incluyendo fix + re-test si aplica), marcar el estado final en este archivo, actualizar `CLAUDE.md` con el último test completado y cualquier hallazgo relevante, y reportar "Paramos en test N.N".

---

## 1. App general

| # | Test | Estado |
|---|------|--------|
| 1.1 | La app carga sin errores de consola, muestra la pantalla de inicio con el botón "Abrir notas" y no hay pantalla en blanco | ✅ |
| 1.2 | Desde la biblioteca puedes entrar a una saga o libro (y a otro libro/saga vía @mention o búsqueda), y el botón atrás te devuelve al **punto exacto anterior** en cada paso (pila de historial) | ✅ |
| 1.3 | Al pulsar la lupa desde **cualquier vista** se navega a la pantalla de búsqueda con el input enfocado | ✅ |
| 1.4 | Al volver atrás desde búsqueda se regresa a la **vista desde la que se abrió la búsqueda** (historial), no siempre a la biblioteca; y desde un resultado, atrás vuelve a la búsqueda | ✅ |
| 1.5 | La app es usable en pantalla móvil (375px): modales no se cortan, dropdown de @mention no se sale de pantalla, botones accesibles | ✅ |
| 1.6 | En iPhone, al abrir un modal con campo enfocado (teclado) y cerrarlo, la página **no queda scrolleada hacia abajo** (scroll-lock de `Modal.jsx`) | ✅ |
| 1.7 | En el **PWA standalone** (pantalla de inicio iOS), la barra superior fija **no tapa** el contenido de la biblioteca (padding safe-area del notch en `<main>`) | ✅ |
| 1.8 | Al entrar en el **detalle de un elemento** (personaje/lugar/etc.) o en **Related**, hay un botón **✕** que cierra el modal y vuelve; nunca se queda atrapado | ✅ |
| 1.9 | Si el backup diario lleva **>2 días sin subir** (o falló), la app muestra el banner rojo "Avisar a Jesús…" con ✕, y al detectarlo obsoleto dispara `POST /api/backup/run/` | ✅ |

---

## 2. Autores  ⚠️ OBSOLETO (capa author eliminada — author es texto libre)

| # | Test | Estado |
|---|------|--------|
| 2.1 | Se puede crear un autor con nombre y aparece en la lista de la biblioteca | ⬜ obsoleto |
| 2.2 | Se puede editar nombre y descripción de un autor y los cambios se reflejan | ⬜ obsoleto |
| 2.3 | Al eliminar un autor desaparece de la biblioteca junto con todos sus libros y sagas | ⬜ obsoleto |
| 2.4 | No se puede crear un segundo autor con el mismo nombre que uno existente | ⬜ obsoleto |
| 2.5 | El campo de búsqueda dentro de la biblioteca filtra la lista de autores en tiempo real por nombre o descripción | ⬜ obsoleto |

---

## 3. Sagas y libros

| # | Test | Estado |
|---|------|--------|
| 3.1 | Se puede crear una saga y aparece en la biblioteca | ✅ |
| 3.2 | No se pueden crear dos sagas con el mismo nombre | ✅ |
| 3.3 | Se puede crear un libro suelto o dentro de una saga y aparece en la vista correspondiente | ✅ |
| 3.4 | Se puede editar título, descripción y fechas de un libro y los cambios se reflejan | ✅ |
| 3.5 | Se pueden añadir y editar fecha de inicio y fin de lectura de un libro | ✅ |
| 3.6 | Al eliminar un libro desaparece de la vista de la saga/biblioteca | ✅ |
| 3.7 | No se pueden crear dos libros con el mismo nombre | ✅ |
| 3.8 | La vista de una saga lista solo los libros que pertenecen a ella | ✅ |

---

## 4. Elementos (personajes, lugares, objetos, palabras)

| # | Test | Estado |
|---|------|--------|
| 4.1 | Se puede crear un personaje con nombre, edad y descripción dentro de un libro | ✅ |
| 4.2 | Se pueden crear lugar, objeto y palabra dentro de un libro | ✅ |
| 4.3 | Se puede editar y eliminar cualquier elemento y los cambios se reflejan | ✅ |
| 4.4 | No se pueden crear dos elementos del mismo tipo con el mismo nombre dentro del mismo libro | ✅ |
| 4.5 | Los contadores en las pestañas reflejan con exactitud cuántos elementos hay en cada categoría | ✅ |
| 4.6 | El botón "Filtrar" filtra los elementos de la pestaña activa por nombre en tiempo real | ✅ |
| 4.7 | Al pulsar "Relacionados" en un elemento se muestran correctamente las entidades que menciona y las que lo mencionan | ✅ |

---

## 5. Sistema de @mentions

| # | Test | Estado |
|---|------|--------|
| 5.1 | Al escribir `@` en cualquier campo de descripción aparece el dropdown con sugerencias filtradas | ✅ |
| 5.2 | Las sugerencias del mismo libro aparecen primero, luego el resto | ✅ |
| 5.3 | Se puede navegar el dropdown con ↑ ↓, seleccionar con Enter y cerrar con Escape | ✅ |
| 5.4 | Seleccionar una entidad de nombre simple (ej. `@Jesus`) inserta el chip correctamente y es clickable | ✅ |
| 5.5 | Seleccionar una entidad con espacios (ej. `@Harry Potter`) el chip cubre el nombre completo y es clickable en su totalidad | ✅ |
| 5.6 | Cuando dos entidades tienen el mismo nombre, el dropdown muestra ambas con sub-etiqueta diferenciadora | ✅ |
| 5.7 | Al seleccionar un nombre duplicado se inserta con qualifier (`@Jesus (Libro B)`) y el chip lo muestra completo para doble confirmación | ✅ |
| 5.8 | Al hacer clic en un chip navega a la vista exacta del elemento referenciado | ✅ |
| 5.9 | Una mención a entidad eliminada (o cuyo libro fue eliminado) se muestra como texto plano sin romper la app — aplica a todos los tipos | ✅ |
| 5.10 | Nombres con tildes, ñ, apóstrofes (ej. `José María`, `O'Brien`) se crean y etiquetan correctamente | ✅ |
| 5.11 | El botón "Añadir notas" concatena el nuevo texto con un salto de línea y una línea separadora (`---`) respecto al contenido previo | ✅ |

---

## 6. Búsqueda global ⚠️ crítico

| # | Test | Estado |
|---|------|--------|
| 6.1 | La lupa funciona desde cualquier vista: saga, libro, detalle de elemento | ✅ |
| 6.2 | Un término que coincide con saga, libro y personaje devuelve resultados de los tipos correspondientes | ✅ |
| 6.3 | Al hacer clic en cualquier resultado navega a la vista exacta del elemento — igual que los links directos | ✅ |
| 6.4 | Si el término buscado no coincide con nada se muestra un mensaje "Sin resultados" claro | ✅ |
| 6.5 | Los estados vacíos (sin sagas, sin libros, sin elementos) muestran mensaje explicativo en lugar de lista vacía | ✅ |
