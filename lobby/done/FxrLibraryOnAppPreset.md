# FxrLibraryOnAppPreset — Library and Home onto the DS `app` card

**Staged:** 2026-10-23 · from a kol-ds-ui session
**Change:** bump kol-component 0.291.0 · kol-shell 0.75.0; Library on `CatalogPage preset="app"`, Home file cards `variant: "app"`; FileCard.jsx parts retire

---

## What shipped

kol-component **0.291.0** · kol-shell **0.75.0** (CatalogAppVariant, filed by kol-fxr, closed 2026-10-23):

- `ContentCard` / `ContentRow` **`variant="app"`** — the `file` card and row with an app library's parts slotted: download on the cover, a cog over a trash in the plate, Rename · Duplicate · Delete on the cog and on right-click. Rename prompts and Delete confirms through `useModal` (the shell's `ModalProvider`). A verb you do not pass is not drawn.
- **`CatalogPage preset="app"`** — `app` card + row, 3 list columns, and the page's ONE menu mounted for you (`AppItemMenuProvider`). No `useContextMenu`, no menu element in the page.
- `toCard` returns, besides `key` · `title` · `onClick`:

| key | type | what it does |
|---|---|---|
| `verbs` | `{ rename?(name), duplicate?(), remove?() }` | raw writes — the DS asks the dialog first |
| `download` | `() => void` | the cover's download control |
| `menuItems` | node | extra menu rows after the three (`MenuDropdownItem`s) |
| `date` | ms or string | ms → ISO day `YYYY-MM-DD` |
| `size` | bytes or string | bytes → `formatSize` |
| `media` | src or node | src → a cover image; none → the image placeholder |
| `tone` | string | default `secondary` |

Reference: kol-ds-ui `apps/catalog` (Variants → Preset **App**) and the showcase CatalogPage `app` variant.

## The change here

1. Bump `@kolkrabbi/kol-component` → 0.291.0 and `@kolkrabbi/kol-shell` → 0.75.0.
2. **`/library`** (`src/pages/LibraryPage.jsx`): `preset="app"` in place of `cardVariant="file"` / `rowVariant="file"`. `toCard` returns `verbs: verbsFor(item)`, `download: () => downloadFile(item)`, `date: item.updatedAt ?? item.savedAt` (ms), `size: bytesOf(item)` (bytes) — or keep your strings — `media: item.thumb`, `onClick: open`. Drop `tone`, `control`, `actions`, `onContextMenu` and the `<FileMenu>` element.
3. **Home** (`src/AppLayout.jsx` `toCard`, ~L350): a file card returns `variant: 'app'` with the same keys. AppHub's Home is a CatalogPage, which mounts the menu now — drop `<FileMenu menu={fileMenu} …>` and `fileMenu`.
4. Retire to `_tmp/`: `FilePlate`, `FileMenu`, `FileThumb`, `FILE_TONE`, `fileDate` (pass ms), `bytesOf` if nothing else reads it. `storedVerbs` · `chromeOf` · `downloadFile` stay — they are app storage and routing.

## Definition of done
- [ ] Library and Home draw the `app` card and row; cog, right-click, trash, rename, duplicate, download all act
- [ ] FileCard.jsx parts moved to `_tmp/`; nothing in `src/` imports them

## ✅ RESOLVED — 2026-10-23

kol-component 0.291.0 · kol-shell 0.75.0 pinned. `/library` (`src/pages/LibraryPage.jsx`) is `CatalogPage preset="app"`; Home's file cards (`src/AppLayout.jsx`) return `variant: 'app'`; both pass `verbs` · `download` · `date` ms · `size` bytes · `media` src, no menu element, no `useContextMenu`. `FileThumb` · `FilePlate` · `FileMenu` · `FILE_TONE` · `fileDate` retired to `_tmp/2026-10-23-filecard-app-variant/`; `bytesOf` stays (both pages read it). Doc: `11-persistence/03-saved-library.md`.
Walked `/library` on `vite preview` with a seeded palette: the card draws download, ISO date, size, cog over trash; right-click Duplicate wrote a copy; the cog opens Rename · Duplicate · Delete; trash asks `Delete “Walk palette”?` before anything goes; 0 console messages. Build green. Home walked signed in (throwaway build, fake session): the `app` card draws, right-click Duplicate shows the copy on Home.

- [x] Library and Home draw the `app` card and row
- [x] FileCard.jsx parts moved to `_tmp/`; nothing in `src/` imports them
