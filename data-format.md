# Data Formats

Everything KomaYomi stores is plain JSON or plain image files. This page documents the on-disk contract so you can script against it, diff it, or repair it by hand.

## File map

| Path | Content |
| --- | --- |
| `raw/<volume>/<language>/<chapter>/*.jpg` | Page images (input, never modified). |
| `data/pages/<volume>/<chapter>/<index>.json` | One page document per page (`index` is 0-based). |
| `data/templates/panel.json` | Saved panel templates. |
| `data/templates/export.json` | Saved export templates. |
| `data/presets/align.json` | Saved alignment presets. |
| `data/layouts/<id>.json` | Declarative layout templates. |
| `data/library.json` | Manual language-directory mapping. |
| `data/cache/thumbs/` | Thumbnail cache (safe to delete). |
| `data/backups/` | Copies of imported `.mnproj` files. |
| `exports/` | Generated HTML, PNG, backup ZIPs and project files. |

Writes are atomic: the server writes `<file>.tmp` and renames it over the target. A crash leaves the old file intact.

## Page document

Path: `data/pages/<volume>/<chapter>/<pageIndex>.json`

```json
{
  "version": 1,
  "volume": "点兔第14卷",
  "chapter": "172",
  "pageIndex": 0,
  "panels": [
    {
      "id": "p1",
      "rect": { "x": 0.04, "y": 0.03, "w": 0.44, "h": 0.31 },
      "source": "auto",
      "number": 1
    }
  ],
  "notes": [
    {
      "id": "n1712345678901",
      "scope": "panel",
      "panelId": "p1",
      "text": "**原文**：……\n\n翻译更正式。",
      "tags": ["语气", "待确认"],
      "source": { "title": "参考页面", "url": "https://example.com" },
      "createdAt": "2026-05-12T10:00:00.000Z",
      "updatedAt": "2026-05-12T10:05:00.000Z"
    }
  ],
  "offsets": {
    "ja": { "x": 0, "y": 0, "scale": 1 },
    "zh": { "x": 0.01, "y": -0.005, "scale": 1.02 }
  },
  "alignMode": "panel",
  "panelOffsets": {
    "p1": { "zh": { "x": 0.01, "y": 0, "scale": 1 } }
  },
  "gridStep": 1,
  "readingDirection": "rtl",
  "detectorVersion": "xycut-1.3",
  "detectedAt": "2026-05-12T09:59:00.000Z",
  "detectSource": "auto",
  "editCount": 7,
  "lastEditedAt": "2026-05-12T10:05:00.000Z",
  "lastEditSummary": "调整格框；修改批注",
  "groups": [{ "id": "g1", "name": "跨页大图", "panelIds": ["p2", "p3"], "number": 1 }],
  "annotations": [
    {
      "id": "a1",
      "kind": "arrow",
      "scope": "panel",
      "panelId": "p1",
      "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.8, "y": 0.7 }],
      "color": "#c2410c",
      "width": 3,
      "opacity": 0.9,
      "text": null,
      "fontSize": null,
      "createdAt": "2026-05-12T10:00:00.000Z",
      "updatedAt": "2026-05-12T10:00:00.000Z"
    }
  ],
  "annotationsVisible": true,
  "updatedAt": "2026-05-12T10:05:00.000Z"
}
```

### Field reference

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `1` | Page document schema version. |
| `volume`, `chapter` | string | Must match the folder names. |
| `pageIndex` | number | 0-based. |
| `panels` | `Panel[]` | See below. Coordinates are clamped to `0..1`; width/height are at least `0.005`. |
| `notes` | `Note[]` | `scope` is `page` or `panel`; panel notes require a `panelId`. Rows without a string `text` are dropped. |
| `offsets` | `Record<Lang, AlignOffset>` | Page-level alignment. `scale` is clamped to `0.2..4`. |
| `alignMode` | `page \| panel \| anchors \| grid` | Invalid values become `page`. |
| `panelOffsets` | `Record<panelId, Record<Lang, AlignOffset>>` | Panel-level alignment. |
| `gridStep` | number | Percent, clamped to `0.1..10`, default `1`. |
| `readingDirection` | `rtl \| ltr \| ttb` | Invalid values become `rtl`. |
| `detectorVersion` | string | e.g. `xycut-1.3`, `layout:<id>`, `plugin:<name>`. |
| `detectedAt` | ISO string | Last detection time. |
| `detectSource` | `auto \| template \| plugin \| manual` | Which path produced the panels. |
| `editCount` | number | Incremented on every write. Not an audit log. |
| `lastEditedAt`, `lastEditSummary` | string | Human-readable change summary. |
| `groups` | `PanelGroup[]` | Dangling panel ids are removed on read; empty groups are dropped. |
| `annotations` | `Annotation[]` | Invalid points are dropped. |
| `annotationsVisible` | boolean | `false` hides the annotation layer in UI and export; data is kept. |
| `updatedAt` | ISO string | Server-set on write. |

### Panel

```json
{
  "id": "p1",
  "rect": { "x": 0.04, "y": 0.03, "w": 0.44, "h": 0.31 },
  "source": "auto",
  "number": 1
}
```

- `id` is page-local and must be unique.
- `x`, `y`, `w`, `h` are normalized to the page.
- `source` is `auto`, `manual` or `merged`.
- `number` is optional; omit it to use reading order.

### Note

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique within the page. |
| `scope` | `page \| panel` | |
| `panelId` | string \| null | Required for panel scope. |
| `text` | string | Markdown. Raw HTML is escaped. |
| `tags` | string[] | |
| `source` | `{ title?, url?, text? }` | `text` is a free-form source label. |
| `images` | `{ id, name, dataUrl }[]` | Screenshots attached to the note. Paste, drop or add them in the notes editor; images over 400 KB are downscaled to a 1600 px edge. |
| `createdAt`, `updatedAt` | ISO string | |

### Annotation kinds

`arrow`, `rect`, `ellipse`, `highlight`, `text`, `badge`, `mosaic`, `pen`.

Coordinates are relative to the annotation's scope (page box or panel box). Freehand pen strokes use the full `points` polyline; arrows use first/last points.

## Version rules

### Page documents

- `version` is currently **1**.
- On read, the server **normalizes** rather than rejects: unknown fields are dropped, invalid numbers become defaults, rectangles are clamped, dangling group references are removed, and missing ids are generated.
- A page JSON that cannot be parsed is treated as absent; the app then auto-detects and re-creates it.
- When a future schema change arrives, the same normalization approach will migrate old files on read. Do not assume unknown future fields will be preserved.

### Project packages

- `schemaVersion` is currently **1**.
- A package declaring a **higher** version is rejected with a clear error: upgrade the app first.
- Version **0** packages (early experiments) are migrated on import: top-level `images`, a `file` field and a flat `langDirs` map are converted into the current manifest shape.
- Missing optional fields are filled with defaults; invalid images are dropped rather than aborting the import.

## Project package (`.mnproj`)

A `.mnproj` file is a ZIP:

```text
manifest.json
pages/<volume>/<chapter>/<index>.json
templates/...
presets/...
config/library.json          (optional)
assets/<sha1>.<ext>          (packaged mode only)
```

### Manifest

```json
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "createdAt": "2026-05-12T10:00:00.000Z",
  "updatedAt": "2026-05-12T10:00:00.000Z",
  "storageMode": "reference",
  "name": "点兔第14卷 学习笔记",
  "language": {
    "volumes": { "点兔第14卷": { "ja": "raw-ja", "zh": "raw-zh" } },
    "resolved": { "点兔第14卷": { "ja": "raw-ja", "zh": "raw-zh" } }
  },
  "inventory": {
    "volumes": [
      {
        "volume": "点兔第14卷",
        "languages": ["ja", "zh"],
        "langDirs": { "ja": "raw-ja", "zh": "raw-zh" },
        "chapters": [{ "chapter": "172", "pages": 18, "images": 36 }]
      }
    ],
    "pageCount": 18,
    "images": [
      {
        "volume": "点兔第14卷",
        "chapter": "172",
        "pageIndex": 0,
        "lang": "ja",
        "name": "001.jpg",
        "sha1": "…",
        "size": 245678,
        "path": "raw/点兔第14卷/raw-ja/172/001.jpg"
      }
    ]
  },
  "notes": { "pages": 18, "noteCount": 42, "annotationCount": 0, "text": "optional user memo" }
}
```

### Storage modes

| Mode | Images | Size | Portability |
| --- | --- | --- | --- |
| `reference` | Only paths + SHA-1 in the manifest. | Small. | Requires the original images. Supports relinking a folder by SHA-1 or filename. |
| `packaged` | Deduplicated into `assets/<sha1>.<ext>`. | Large. | Self-contained; importing writes images into `raw/`. |

Import checks conflicts per file and offers **overwrite**, **merge** or **skip**:

- **Merge** keeps existing panels/annotations when the incoming page lacks them, unions notes by id (incoming wins for the same id), and never deletes existing notes.
- A snapshot of `data/` is written before any import; the original package is also kept under `data/backups/projects/`.

## Layout template

Path: `data/layouts/<id>.json`

```json
{
  "id": "layout-1712345678901",
  "name": "四格等分",
  "scope": "page",
  "volume": "点兔第14卷",
  "chapter": "172",
  "pageIndex": 3,
  "readingDirection": "rtl",
  "margin": { "top": 0.02, "right": 0.02, "bottom": 0.02, "left": 0.02 },
  "gap": 0.012,
  "colWeights": [1, 1],
  "grid": {
    "cols": 2,
    "rows": [
      { "height": 1, "cells": [{}, {}] },
      { "height": 1, "cells": [{}, {}] }
    ]
  },
  "pageOverrides": {
    "2": { "gap": 0.02 }
  },
  "createdAt": "2026-05-12T10:00:00.000Z",
  "notes": "用于第172话大部分页面"
}
```

- `scope` is `page`, `chapter` or `volume`; the resolver prefers the narrowest match.
- `cells[].span` allows a cell to span multiple columns.
- `row.height` is a relative weight.
- `pageOverrides` keys are 1-based page numbers.
- `margin` and `gap` are fractions; `colWeights` default to equal widths.

## Panel template and alignment preset

**Panel template** — copies rectangles from one page:

```json
{
  "id": "tpl-…",
  "name": "四格无缝隙",
  "volume": "点兔第14卷",
  "chapter": "172",
  "panels": [{ "x": 0.02, "y": 0.02, "w": 0.47, "h": 0.47 }],
  "readingDirection": "rtl",
  "createdAt": "2026-05-12T10:00:00.000Z"
}
```

**Alignment preset**:

```json
{
  "id": "preset-…",
  "name": "172 话整体偏移",
  "scope": "chapter",
  "volume": "点兔第14卷",
  "chapter": "172",
  "mode": "page",
  "offsets": { "zh": { "x": 0.01, "y": 0, "scale": 1 } },
  "panelOffsets": {},
  "gridStep": 1,
  "createdAt": "2026-05-12T10:00:00.000Z"
}
```

## Export template

Path: `data/templates/export.json`

An array of named templates, each storing part of an export configuration:

```json
[
  {
    "id": "exp-…",
    "name": "左图右注-紧凑",
    "createdAt": "2026-05-12T10:00:00.000Z",
    "config": {
      "template": "two-column",
      "languages": ["ja", "zh"],
      "embedImages": false,
      "pageWidthRatio": 46,
      "columnGap": 28,
      "fontScale": 1,
      "columns": 1
    }
  }
]
```

The full export configuration also includes `title`, `volume`, `chapter`, `pageIndices`, `offsets`, `showPanelBoxes`, `includeNotes`, `onlyWithNotes` and `noteFilterTags`.

## Backup ZIP

A backup is a ZIP where every entry is prefixed with `data/`:

```text
data/pages/...
data/templates/...
data/presets/...
data/library.json
data/.backup-meta.json
```

The thumbnail cache (`data/cache/`) and `.tmp` / `.log` files are excluded. Restoring overwrites same-named files under `data/` but does not delete pages absent from the backup; a snapshot of the current data is written first.

## `data/library.json`

```json
{
  "volumes": {
    "点兔第14卷": {
      "dirs": { "ja": "raw-ja", "zh": "raw-zh" }
    }
  }
}
```

Only manual overrides live here. Automatic language detection still runs for volumes without an entry.
