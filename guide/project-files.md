# Project Files & Formats

Everything KomaYomi stores is plain files: images in `raw/`, annotations in `data/`, generated output in `exports/`. This page explains the three ways to move that work somewhere else, and the versioning rules that keep old files readable.

## The problem it solves

Annotations are the expensive part — hours of panel correction, alignment and notes. They must survive a machine change, a disk failure, sharing with a study partner, and future app versions. A database backup would be opaque; these formats are plain ZIP and JSON, inspectable with ordinary tools.

## Three portability layers

| Layer | File | Contains | Use when |
| --- | --- | --- | --- |
| **Project package** | `.mnproj` | Images (packaged mode), page JSON, templates, presets, language mapping | Moving to another machine or archiving a finished volume. |
| **Exchange files** | `.mntpl`, `.mnexp`, `.mnpage.json` | One layout, one export style, or one page | Sharing a reusable layout or a single annotated page. |
| **Backup ZIP** | `.zip` | The whole `data/` folder | Restoring after a mistake, or keeping a periodic safety copy. |

## Project packages (`.mnproj`)

A `.mnproj` is a ZIP with a text manifest:

```text
manifest.json
pages/<volume>/<chapter>/<index>.json
templates/...
presets/...
config/library.json          (optional)
assets/<sha1>.<ext>          (packaged mode only)
```

### Reference vs packaged mode

| Mode | Images | Size | Portability |
| --- | --- | --- | --- |
| **Reference** | Only paths and SHA-1 hashes in the manifest. | Small. | Needs the original image folder. Supports relinking by hash or filename. |
| **Packaged** | Deduplicated into `assets/<sha1>.<ext>`. | Large. | Self-contained; importing writes images into `raw/`. |

### Exporting

1. Open **Project file…** in the sidebar, or **File → Save as project…**.
2. Choose the mode, a project name and an optional note.
3. Click **Create and download .mnproj**.

The manifest records the app version, creation time, language mapping, an inventory of volumes / chapters / pages and image hashes, and note and annotation counts.

### Importing

1. **Choose a project file…**. The dialog summarises volumes, chapters, pages, notes, annotations, images and templates before writing anything.
2. Pick a conflict policy: **Overwrite**, **Merge** or **Skip**.
   - **Merge** keeps existing panels and annotations when the incoming page lacks them, and unions notes by id without deleting existing notes.
3. For a reference-mode project with missing images, optionally choose a **Relink folder** that holds the originals.
4. Click **Import**.

Safety behaviour:

- The current `data/` is snapshotted to `exports/` before the import.
- The original project file is backed up under `data/backups/projects/`.
- Missing images are reported after the import; put them in the relink folder and import again with **Merge** to recover them.

## Exchange files

**Exchange files…** handles three small formats without touching the whole library.

### `.mntpl` — layout template

Exports strip the volume / chapter / page binding, so the template can be imported into another manga and rebound to the current volume, chapter or page. The import dialog lets you bind it and optionally apply it immediately; existing pages are saved first.

### `.mnexp` — export template

Stores the layout and style settings for HTML and PNG export. Export it now, import it later. Template storage lives in `data/templates/export.json`.

### `.mnpage.json` — one page

A readable page document with panels, notes, tags, groups, annotations and alignment offsets. Older page JSON without the schema envelope can be imported too and is migrated.

- **Export current page** writes the current page.
- **Choose a page JSON…** then **Overwrite current page** replaces panels, notes and annotations of the selected page.
- Validation failures report the exact field path and never write half-finished data.
- Original files are backed up under `data/backups/exchange/`.

::: warning Unsaved changes
If the page has unsaved edits, exchange exports will not include them and a page import may overwrite them. Save first — the dialog warns, but it is easy to click past.
:::

## Format versions

Every exchange format carries a schema envelope:

```json
{
  "$schema": "https://manga-memo.dev/schemas/page.schema.json",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "kind": "page"
}
```

| Kind | File | Current version |
| --- | --- | --- |
| `mnproj` | `.mnproj` manifest | **1** |
| `mntpl` | layout template | **1** |
| `mnexp` | export template | **1** |
| `page` | page document | **1** |
| `mntp` | panel template (stored) | **1** |
| `mnalign` | alignment preset (stored) | **1** |
| `mnlayout` | declarative layout (stored) | **1** |
| `mnconfig` | library config (stored) | **1** |
| `mnstorage` | storage config (stored) | **1** |

Version rules:

- A file declaring a **higher** version than the app supports is rejected with a clear message: upgrade the app first. The app never guesses at a future format.
- A missing version is treated as **v0** and migrated on import. Early experimental manifests (top-level `images`, a flat `langDirs` map) are converted to the current shape.
- Missing optional fields are filled with defaults; invalid images are dropped rather than aborting the whole import.
- On read, page JSON is **normalized**: rectangles are clamped, dangling group references removed, missing ids generated, unknown fields dropped.
- A page JSON that cannot be parsed is treated as absent; the app re-detects and recreates it.

## Backup ZIP

A backup is a ZIP whose entries are prefixed with `data/`:

```text
data/pages/...
data/templates/...
data/presets/...
data/layouts/...
data/library.json
data/.backup-meta.json
```

Excluded: `data/cache/` (thumbnails and remote cache), `.tmp` files and logs. Restoring overwrites same-named files, keeps pages absent from the backup, and writes a snapshot first.

## What is not implemented

- **PDF and Word (`.docx`) export**, and vocabulary-list export. Use the HTML export and the browser's print-to-PDF.
- **In-app panel group editing.** `groups` is part of the page JSON and is preserved everywhere, but there is no editor yet.
- **Scheduled backups.** Backups and uploads to a backup target are started manually.

## Common pitfalls

- **A reference-mode project shows missing images.** The manifest only stores hashes and paths. Use the relink folder, or export in packaged mode next time.
- **“Schema version too new.”** The file came from a newer build. Update the app; do not hand-edit `schemaVersion`.
- **Import overwrote newer notes.** **Overwrite** is destructive by design. Use **Merge** when in doubt; a snapshot was written, but restoring it replaces current data.
- **A layout template does not appear.** It is bound to the current chapter/volume filter; check the binding in the import dialog.
- **A `.mnpage.json` import has no images.** Page data never contains images; those come from `raw/` or a packaged project.

<figure class="shot">
  <div class="shot-missing">
    <strong>Screenshot pending: project import summary</strong>
    A screenshot of the import dialog with inventory counts, conflict policy and relink field will be added here.
  </div>
  <figcaption>Planned screenshot: project import summary.</figcaption>
</figure>

## Missing screenshots

| Figure | Needed for |
| --- | --- |
| project export form | Mode, name and note |
| project import summary | Counts, conflicts, relink |
| exchange files dialog | Three file types |

## Related

- [Data Formats](/data-format) — full JSON field reference.
- [Export](/guide/export) — HTML and PNG output.
- [Remote Storage & Backup](/guide/remote) — backup targets.
