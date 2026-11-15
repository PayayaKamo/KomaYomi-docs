# Keyboard Shortcuts

One page for every key and mouse gesture. Single-key shortcuts are ignored while the focus is inside a text field, so typing a note never flips the view.

## What this page solves

Shortcuts are spread across the library, the workbench, the compare reader and the notes editor. Instead of hunting through each chapter, keep this page open while you learn the workflow, or print it as a one-page reference.

## Global

| Key | Action |
| --- | --- |
| `[` | Previous page (crosses chapter boundaries). |
| `]` | Next page (crosses chapter boundaries). |
| `P` | Switch to the panel workbench. |
| `C` | Switch to the compare reader. |
| `S` | Show or hide the library sidebar. |
| `N` | Show or hide the notes column. |
| `E` | Open the export dialog (when a page is open). |
| `?` | Open the keyboard and actions help. |
| `Ctrl+Z` | Undo the last panel change. |
| `Ctrl+Shift+Z` | Redo. |
| `Ctrl+Y` | Redo (alternative). |

## File

| Key | Action |
| --- | --- |
| `Ctrl+O` | Open a project file (`.mnproj`). |
| `Ctrl+S` | Save the current page. |
| `Ctrl+Shift+S` | Save as a project. |

These file shortcuts work even while typing, matching desktop apps.

## Panel workbench

| Key / gesture | Action |
| --- | --- |
| Drag a box | Move the panel. |
| Drag a corner or edge handle | Resize in eight directions. |
| Double-click empty space | Add a default panel. |
| Drag on empty space | Draw a panel. |
| `Shift` + drag | Constrain the new panel to a square. |
| `Alt` + drag | Disable snapping. |
| `Ctrl`-click / `Shift`-click | Add or remove a panel from the selection. |
| Arrow keys | Nudge the selection by 0.2% of the page. |
| `Shift` + arrow keys | Nudge by 1%. |
| `Delete` / `Backspace` | Delete the selected panels (or the selected annotation). |
| `Enter` | Save (Confirm mode). |
| `Esc` | Discard changes (Confirm mode); otherwise leave the annotation tool or deselect a mark. |

The annotation toolbar has no letter shortcuts; it is mouse-only. `Esc` always backs out one level: selected annotation → current tool → dirty page.

## Compare reader

| Key / gesture | Action |
| --- | --- |
| `H` | Mask everything (turn the mask master switch on). |
| `Shift+H` | Reveal everything (turn the mask master switch off). |
| Drag a pane | Pan that language. |
| Wheel over a pane | Zoom that language. |
| `Alt` + drag / wheel | Apply the gesture to the current panel only. |
| Click a masked pane | Reveal it temporarily; click again to mask it. |

Panel navigation uses the **Previous panel** / **Next panel** buttons; they are not bound to keys because `[` and `]` already change pages.

## Notes editor

| Key | Action |
| --- | --- |
| `Ctrl+B` | Bold. |
| `Ctrl+I` | Italic. |
| `Ctrl+K` | Insert a link. |
| `Ctrl+Enter` | Save the note (or save the scratchpad). |
| `Enter` in the tag field | Add the tag. |
| `Tab` | Indent inside the editor. |

## Mouse-only actions

Some controls have no keyboard equivalent by design:

- Pane splitters: drag to resize, double-click to reset.
- Language chip reordering in the compare reader: drag a chip.
- Zoom buttons: `−` / `＋` in the panel toolbar.
- Panel template and alignment preset pickers.

## Common pitfalls

- **A shortcut types a letter instead.** Focus is in an input, textarea or contenteditable element. Click the stage first.
- **`H` does not mask.** The focus is in a note or toolbar field; the compare shortcut is ignored while typing.
- **`E` does nothing.** No page is open, so the export dialog is unavailable.
- **`Ctrl+Z` undoes a note instead.** Inside a text field the browser's native undo applies; page-level undo only works on the stage.

## Related

- [Panel Workbench](/guide/panels) — the controls these keys drive.
- [Compare Reader](/guide/compare) — masking and alignment.
- [Notes](/guide/notes) — editor behaviour.
