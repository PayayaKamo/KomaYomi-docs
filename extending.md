# Layout Templates & Plugins

Two extension points let you replace or constrain automatic panel detection without touching the app code.

## Priority

When a page is detected, the server tries in this order:

1. **Layout template** bound to the page, chapter or volume.
2. **Matching plugin** from `plugins/` or `data/plugins/`.
3. **Built-in XY-cut detector**.

A layout template always wins. A plugin that throws, times out (2.5 s) or returns no panels falls back to the built-in detector with a visible warning.

## Layout templates

Layout templates describe the page as a grid of rows and cells. They are ideal for a fixed magazine layout reused across a whole chapter.

### Minimal example

`data/layouts/four-panel.json`:

```json
{
  "id": "four-panel",
  "name": "四格等分",
  "scope": "chapter",
  "volume": "点兔第14卷",
  "chapter": "172",
  "readingDirection": "rtl",
  "margin": { "top": 0.03, "right": 0.03, "bottom": 0.03, "left": 0.03 },
  "gap": 0.012,
  "grid": {
    "cols": 2,
    "rows": [
      { "height": 1, "cells": [{}, {}] },
      { "height": 1, "cells": [{}, {}] }
    ]
  }
}
```

### Contract

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | recommended | File is saved as `<id>.json`; generated if omitted. |
| `name` | recommended | Shown in the UI and CLI. |
| `scope` | yes | `page` > `chapter` > `volume` specificity. |
| `volume` | yes | Must match the volume folder name. |
| `chapter` | for chapter/page scope | Must match the chapter folder name. |
| `pageIndex` | for page scope | 0-based. |
| `grid.cols` | yes | 1–12. |
| `grid.rows[].cells` | yes | Each cell may set `span` (default 1). |
| `grid.rows[].height` | no | Relative height weight (default 1). |
| `margin` | no | Fractions of the page; defaults to `0.02` on each side. |
| `gap` | no | Fraction, clamped to `0`–`0.08`, default `0.012`. |
| `colWeights` | no | Relative column widths; equal by default. |
| `pageOverrides` | no | Keys are **1-based** page numbers; may override `grid`, `margin`, `gap`, `colWeights`. |
| `readingDirection` | no | `rtl` (default), `ltr`, `ttb`. |

The server expands the grid into normalized panel rectangles. Rows and cells are laid out inside the margins, subtracting gaps and respecting spans and weights.

### Managing templates

- **Capture** the current page as a layout from the panel workbench (stored via `POST /api/layouts/capture`).
- **Apply** a layout to a page, chapter or volume (`POST /api/layouts/apply`).
- Files can be hand-written and version-controlled. A malformed file is ignored rather than breaking the library.
- CLI: `apply-layout --layout <id> --volume <V> [--chapter <C>] [--pages 1,2]`.

### When to prefer a layout over a panel template

| | Panel template | Layout template |
| --- | --- | --- |
| Source | Exact rectangles copied from one page | Declarative grid |
| Reuse | Same page geometry | Many pages with the same grid |
| Editable | Via the UI | Plain JSON, diff-friendly |
| Priority | Applied manually | Applied automatically during detection |

## Panel plugins

A plugin is a JS module in `plugins/` or `data/plugins/`. Both `.mjs`, `.cjs` and `.js` are loaded. Files are considered in alphabetical order; the first matching plugin is used.

### Minimal working plugin

`plugins/example-2x2-grid.mjs`:

```js
export default {
  name: 'example-2x2-grid',
  match: { volume: /example/i },
  panels({ width, height }) {
    void width
    void height
    const gap = 0.01
    const w = (1 - gap) / 2
    const h = (1 - gap) / 2
    return [
      { x: 0, y: 0, w, h },
      { x: w + gap, y: 0, w, h },
      { x: 0, y: h + gap, w, h },
      { x: w + gap, y: h + gap, w, h },
    ]
  },
}
```

A plugin may also default-export a bare function, which is treated as `panels()` with the filename as its name.

### Interface

```ts
type PanelRect = { x: number; y: number; w: number; h: number } // normalized 0..1

type PluginPanelInfo = {
  width: number
  height: number
  volume: string
  chapter: string
  pageIndex: number
  filename: string
}

type PanelPlugin = {
  name?: string
  match?: {
    volume?: string | RegExp
    chapter?: string | RegExp
    file?: string | RegExp
  }
  panels: (
    info: PluginPanelInfo,
  ) => PanelRect[] | { panels: PanelRect[]; warnings?: string[] }
     | Promise<PanelRect[] | { panels: PanelRect[]; warnings?: string[] }>
}
```

### Rules and failure behavior

- Returning an empty array counts as a failure: the caller falls back to automatic detection.
- Exceptions and timeouts (2500 ms) are caught; the UI shows a warning and uses the built-in detector.
- Rects are clamped to `0..1` and a minimum width/height of `0.005`. Invalid entries are dropped.
- `match` is a substring check for strings (case-insensitive) or a regex test. Omitting `match` matches everything — useful while developing, dangerous to leave in.
- Plugins are re-imported with an mtime cache-buster, so editing a file does not require restarting the server.
- Plugins run in the server process with full Node access. Only install plugins you trust.

### Inspecting plugins

```bash
node scripts/manga-cli.ts plugins
```

This lists each plugin file, its declared name and any load error.

## Batch CLI

The CLI works directly on `raw/` and `data/` without starting a browser. It is a TypeScript entry that relies on Node's built-in type stripping (Node 22.6+ with the flag, Node 23.6+ by default; Node 26 works out of the box).

```bash
node scripts/manga-cli.ts <command> [options]
```

| Command | Purpose |
| --- | --- |
| `report [--narrow]` | Scan every page, print the panel-count histogram. `--narrow` lists edge-hugging narrow strips (the *あらすじ* false-positive candidates). |
| `regress [--update]` | Compare panel counts against `scripts/detect-baseline.json`; `--update` rewrites the baseline. |
| `detect --volume V [--chapter C] [--pages 1,2] [--lang ja] [--plugin NAME] [--auto] [--apply] [--overwrite]` | Run detection with the same priority as the UI. Without `--apply` it is a dry run. `--auto` forces the built-in detector. |
| `apply-layout --layout ID --volume V [--chapter C] [--pages 1,2]` | Expand and apply a layout template. |
| `apply-template --template ID --volume V --chapter C [--pages 1,2]` | Apply a saved panel template. |
| `apply-align --preset ID --volume V --chapter C [--pages 1,2]` | Apply an alignment preset. |
| `templates` | List panel templates. |
| `layouts` | List layout templates. |
| `align-presets` | List alignment presets. |
| `plugins` | List installed panel plugins. |

`detect` remaps panel-scoped notes by reading order when the panel count is unchanged, and otherwise keeps only page-scoped notes — the same rule the UI uses when a template is applied.

Example:

```bash
node scripts/manga-cli.ts detect --volume 点兔第14卷 --chapter 172 --pages 1,2 --apply
node scripts/manga-cli.ts report --narrow
node scripts/manga-cli.ts regress
```

## HTTP API for extensions

Useful endpoints beyond the UI:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/layouts` | List layout templates. |
| `POST` | `/api/layouts` | Save a layout. |
| `POST` | `/api/layouts/capture` | Capture the current page as a layout. |
| `POST` | `/api/layouts/apply` | Apply a layout to pages. |
| `DELETE` | `/api/layouts?id=…` | Delete a layout. |
| `GET` | `/api/plugins` | List plugins and load errors. |
| `POST` | `/api/detect` | Detect panels with template → plugin → auto priority. |
| `GET` | `/api/panel-templates` | List panel templates. |
| `POST` | `/api/panel-templates/apply` | Apply a panel template. |
| `GET` | `/api/align-presets` | List alignment presets. |
| `POST` | `/api/align-presets/apply` | Apply an alignment preset. |
| `POST` | `/api/export` | Run an HTML export. |

The full endpoint list is in [Data Formats](/data-format) and the server source (`server/app.ts`).
