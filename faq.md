---
description: Fix missing pages, unrecognized language folders, inaccurate panel detection, exports without images, lost source files and desktop data-directory problems.
---

# FAQ & Troubleshooting

## The library is empty

**Symptom:** the sidebar says no volumes were found.

Check the folder shape under `raw/`:

```text
raw/<volume>/<language-dir>/<chapter>/001.jpg
```

Common causes:

- The volume folder exists but the language folder is not recognized. Use volume settings to map it, or rename it to `ja`, `zh` or `en` (aliases are listed in [Library](/guide/gallery)).
- The chapter folder is directly under the volume (`raw/<volume>/001.jpg`). A language directory is required.
- The data directory in the desktop app points somewhere else. Press `Ctrl+Shift+D` to choose the correct folder, or set `MANGA_DATA_DIR`.

## A language is missing on one page

**Symptom:** a page shows only `JA` and `ZH`; `EN` is disabled.

Pages are paired by sorted index. If English has one fewer file in that chapter, the last page has no English image. The page warning names the missing language and page number. Add the file or remove the stray page.

If the counts match but the pairing is wrong, check filenames: a leading number that disagrees with sorted position triggers a warning. Rename files so natural sort matches the intended order.

## Filenames look fine but pages are out of order

Sorting is **natural**: digit runs compare numerically, so `2.jpg` comes before `10.jpg`. It is not byte-wise lexicographic. If a file has no leading number, it may sort before numbered files. Prefix pages consistently, e.g. `001.jpg`, `002.jpg`.

## Panel detection is inaccurate

- **The left/right vertical strip is ignored.** This is intentional: the narrow edge strip (typically *あらすじ* or an author note) is filtered so it does not become a false panel. Draw a legitimate edge panel manually.
- **Splash pages** often produce one big panel plus fragments. Select the fragments and **Merge**.
- **Very small or very thin boxes** are filtered as noise. Add them manually if they are real.
- **WebP pages are not decoded** for detection. Convert to JPEG/PNG if you need automatic detection.
- **Fixed magazine layouts** are better served by a [layout template](/extending) than by detection.

After correcting panels, avoid re-running auto detection unless you accept losing the manual boxes.

## Exported HTML shows no images

**Folder mode (default):** the HTML references a sibling `<name>.files/` directory. Copy **both** the `.html` file and the `.files` folder, keeping their relative positions. Opening the HTML alone, or moving it away from the folder, breaks the images.

**Single-file mode:** images are embedded, so only the HTML file is needed. The trade-off is size — a whole chapter may be tens of megabytes.

## The original image cannot be found

**Symptom:** a `.mnproj` import reports missing images, or a page shows a 404 placeholder.

- **Reference-mode projects** store paths, not images. If the images moved, import again and set a **relink directory**. The importer matches by SHA-1 first, then by filename, preferring folders that contain the volume and chapter names.
- **Packaged-mode projects** carry images in `assets/`. A missing asset means the package is incomplete; re-export it.
- If images still exist but were renamed, put them in a folder with the expected structure and use relink.

## My edits disappeared

Check the save mode in the toolbar:

- **Auto** saves with a debounce.
- **Confirm** requires clicking the save check. Leaving with unsaved changes shows a browser warning, but a crash or forced close can still lose the last edits.

Also check that you are looking at the same page: the URL hash includes volume, chapter, page and view. Opening the app on another data directory shows a different library.

## Panel notes vanished after applying a template

When a panel template (or a re-detect) changes the panel count, panel-scoped notes cannot be mapped reliably, so they are dropped. Page-scoped notes are always kept. If the count is unchanged, notes are remapped by reading order.

To avoid this, export a backup before applying a template to a whole chapter.

## Port 5173 is already in use

Vite is configured with `strictPort: false`, so it moves to the next free port. Read the terminal output for the actual URL. The docs site uses `5174`.

## How do I back up everything?

- **Backup ZIP** — all of `data/` (JSON, templates, presets), excluding the thumbnail cache.
- **`.mnproj`** — project package, with or without images.
- **Copying folders** — `raw/` is your images; `data/` is your work; `exports/` is regenerable.

See [Remote Storage & Backup](/remote-backup).

## Thumbnails look stale or broken

Delete `data/cache/thumbs/`. It is a cache and is rebuilt on demand. The backup and project packages already exclude it.

## Searching notes returns nothing

- The search covers note text, tags and sources. Check the active volume/chapter/tag/source filters.
- A note must be **saved** to be indexed. In confirm mode, unsaved edits are not yet on disk.
- The overview indexes page JSON; a page that failed to save has no searchable notes.

## The desktop app starts but shows an old page set

The desktop window may be using a different data directory than the repository. Check the window title (it includes the data path) and press `Ctrl+Shift+D` to switch. `MANGA_DATA_DIR` overrides the stored setting.

## Why can't I export PDF or Word?

Only HTML and PNG are implemented. PDF, `.docx` and vocabulary lists are <Badge type="warning" text="Planned" />. As a workaround, open the exported HTML in a browser and use **Print → Save as PDF**; the HTML has print styles that break pages and avoid splitting panels or notes.

## Why can't I create panel groups?

The page JSON supports `group` objects and they are preserved by imports and exports, but there is no group-editing UI yet (<Badge type="warning" text="Planned" />). You can hand-edit the JSON; it is normalized and validated on read. Vector **annotations** are implemented: the panel workbench has arrow, rectangle, ellipse, highlight, pen, text, badge and mosaic tools.

## Does it send my data anywhere?

By default, no. The server listens on `127.0.0.1`, and nothing is uploaded unless you configure a remote target. Two features make outbound requests: the optional "fetch page title" action for a note source (requests the URL you typed, 5-second timeout), and any WebDAV / network storage target you add (image fetches and backup uploads). With no storage target configured, all data stays local.

## Old page JSON is not opening

Hand-edited or older JSON is normalized on read: missing ids are generated, rectangles are clamped, invalid enum values fall back to defaults, and dangling group references are dropped. If the file is not valid JSON at all, the app treats the page as having no data and will detect it again — which overwrites the file on save. Restore from a backup if that happens.

## Something else is wrong

Collect this before asking for help:

1. The terminal output where `npm run dev` or `npm run desktop` was started.
2. The exact page path (`data/pages/<volume>/<chapter>/<index>.json`).
3. Whether the problem reproduces after deleting `data/cache/thumbs/`.
4. The output of `node scripts/manga-cli.ts report` if the issue is detection-related.
