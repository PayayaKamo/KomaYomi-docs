# Server & CLI message codes

KomaYomi keeps every user-facing sentence produced by `server/` and `scripts/` in one
trilingual catalog (`server/messages/catalog.ts`). Domain code raises a **stable code plus
parameters**; the text is rendered at the boundary in the language negotiated for that
request (HTTP) or invocation (CLI).

`ERR_*` / `WARN_*` / `STATUS_*` codes are public API — clients and scripts may match on
them, so renaming a code is a breaking change. Adding a code is not.

- Catalog: `server/messages/catalog.ts`
- Language negotiation: `server/messages/index.ts`
- Error type: `server/errors.ts`

## HTTP response contract

Every error response keeps the legacy `error` string (the current client reads it) and
adds the structured fields:

```json
{
  "error": "Page not found: 点兔第14卷 / 172 page 99",
  "message": "Page not found: 点兔第14卷 / 172 page 99",
  "code": "ERR_PAGE_NOT_FOUND",
  "params": { "volume": "点兔第14卷", "chapter": "172", "page": 99 },
  "lang": "en"
}
```

| Field     | Meaning                                                              |
| --------- | -------------------------------------------------------------------- |
| `error`   | Localized text (kept for backwards compatibility).                   |
| `message` | Same text as `error`, for clients written against the new contract.  |
| `code`    | Stable machine-readable code from this document.                     |
| `params`  | Values interpolated into the text; never localized.                  |
| `lang`    | Language actually used for `error` / `message`.                      |

`sendJson` also sets `Content-Language: <lang>` and `Vary: Accept-Language`.

Warnings embedded in successful payloads stay `string[]` (localized for the request), so
existing UI code keeps working. `POST /api/detect` additionally returns
`warningCodes: [{ "code": "WARN_…", "params": { … } }]` for the warnings it generates
itself.

### Language negotiation

Priority, highest first:

1. `?lang=zh` query parameter (`en` / `zh` / `ja`, region tags such as `zh-CN` accepted).
2. `Accept-Language` header, q-values respected (`ja;q=0.9, en;q=0.4`).
3. Environment: `KOMAYOMI_LANG`, then `MANGA_LOCALE`, then `LC_ALL` / `LANG`.
4. English.

```bash
curl -s 'http://127.0.0.1:5173/api/page?volume=V&chapter=1&index=999' \
  -H 'Accept-Language: ja-JP,ja;q=0.9'
# → {"error":"ページが見つかりません：V / 1 …","code":"ERR_PAGE_NOT_FOUND",…}
```

## CLI

`scripts/manga-cli.ts` renders the same catalog.

```bash
node scripts/manga-cli.ts report --lang ja
KOMAYOMI_LANG=zh node scripts/manga-cli.ts layouts
LANG=ja_JP.UTF-8 node scripts/manga-cli.ts report
```

- `--lang en|zh|ja` wins, region tags are normalized (`zh-CN`, `ja_JP`).
- Without the flag the CLI follows `KOMAYOMI_LANG` → `MANGA_LOCALE` → `LC_ALL`/`LANG`,
  then English.
- `--content-lang ja` selects which image files to read (formerly the overloaded
  `--lang`); `--image-lang` is accepted as an alias.
- Errors print as `Error: <localized message>` on stderr and exit with status 1.

## Error codes

### Request, routing and files

| Code                       | HTTP | Meaning                                        | Common cause                                         | What to do                                          |
| -------------------------- | ---- | ---------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `ERR_INTERNAL`             | 500  | Unexpected server error (detail attached)      | Bug, unreadable data directory, unexpected exception | Check the `detail` param and the server log.        |
| `ERR_INVALID_JSON`         | 400  | Request body is not valid JSON                 | Hand-edited file, wrong `Content-Type`               | Send a JSON body; validate before uploading.        |
| `ERR_BODY_TOO_LARGE`       | 413  | Body exceeds the 8 MB limit                    | Importing a very large `.mnproj`                      | Import via the file endpoint that streams to disk.  |
| `ERR_UNKNOWN_ENDPOINT`     | 404  | No route matches the path                      | Old client, typo, wrong base URL                     | Check the path in this repository's `server/app.ts`.|
| `ERR_FILE_NOT_FOUND`       | 404  | Requested export/download file is missing      | File was moved or cleaned up                         | Re-run the export.                                  |
| `ERR_EXPORT_FILE_NOT_FOUND`| 404  | Export artifact is not on disk                 | Export directory cleared                             | Re-export the chapter.                              |

### Images and thumbnails

| Code                         | HTTP | Meaning                                  | Common cause                                | What to do                                            |
| ---------------------------- | ---- | ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `ERR_IMAGE_NOT_FOUND`        | 404  | Page image is not available              | Wrong `raw/` layout, file renamed           | Check `raw/<volume>/<language>/<chapter>/`.           |
| `ERR_THUMB_SOURCE_MISSING`   | 404  | Thumbnail source is missing              | Page image deleted after the gallery loaded | Refresh the gallery.                                  |
| `ERR_THUMB_FETCH_FAILED`     | 502  | Remote image could not be fetched        | Remote source offline, bad URL              | Verify the remote source in Settings → Storage.       |
| `ERR_THUMB_UNSUPPORTED`      | 415  | Thumbnailing is not implemented for format | AVIF/HEIC or exotic formats               | Convert to JPEG/PNG/WEBP.                             |
| `ERR_UNSUPPORTED_IMAGE_FORMAT` | 415 | Detector cannot read the image           | Non-image file or unsupported codec         | Replace the file with a supported image.              |
| `ERR_REMOTE_UNAVAILABLE`     | 503  | Remote source is temporarily unusable    | Network share offline, WebDAV down          | Cached pages remain readable; retry when online.      |

### Library, pages and volumes

| Code                          | HTTP | Meaning                                   | Common cause                                     | What to do                                             |
| ----------------------------- | ---- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `ERR_VOLUME_NOT_FOUND`        | 404  | Volume id is unknown                      | Renamed folder, stale URL                        | Refresh the library, check the volume id.              |
| `ERR_CHAPTER_NOT_FOUND`       | 404  | Chapter id is unknown                     | Wrong chapter number, empty volume               | Check `chapters` in `/api/library`.                    |
| `ERR_PAGE_NOT_FOUND`          | 404  | Page index out of range                   | Index is 0-based; stale page list                | Read `page.index` from the library instead.            |
| `ERR_MISSING_VOLUME_CHAPTER`  | 400  | Volume and/or chapter not supplied        | Client forgot a field                            | Send both `volume` and `chapter`.                      |
| `ERR_MISSING_VOLUME`          | 400  | Volume name not supplied                  | Destructive action without a target              | Pass `volume`.                                         |
| `ERR_MISSING_VOLUME_DIRS`     | 400  | Volume name or language dirs not supplied | Creating a volume without directories            | Send `{ volume, dirs }`.                               |
| `ERR_URL_NOT_HTTP`            | 400  | Title fetch only supports http(s)         | `file://` or relative URL                        | Use an `http(s)` URL.                                  |
| `ERR_PAGE_NO_IMAGES`          | 400  | Page has no image in any language         | Empty chapter folder, naming mismatch            | Check the files for that page index.                   |
| `ERR_PAGE_NO_PANELS`          | 400  | Operation needs panels first              | Capturing a layout from a page without panels    | Detect panels on that page, then retry.                |
| `ERR_PAGE_SHAPE`              | 400  | Page JSON is not an object                | Wrong file chosen for import                     | Import a `.mnpage.json` produced by KomaYomi.          |
| `ERR_PAGE_TARGET_MISSING`     | 400  | Page JSON has no volume/chapter and no target | Import into a view without selecting a target | Select a volume/chapter before importing.            |
| `ERR_PAGE_INDEX_INVALID`      | 400  | Page JSON has no valid `pageIndex`        | Hand-edited file                                 | Add a zero-based `pageIndex`.                          |
| `ERR_PAGE_NOT_SAVED`          | 400  | Page has no saved data yet                | Export before saving annotations                 | Save the page first.                                   |
| `ERR_UNSAFE_SEGMENT`          | 400  | Volume/chapter name has unsafe characters  | `/`, `..`, control characters                   | Use a plain folder-safe name.                          |
| `ERR_DIR_UNSAFE`              | 400  | Directory contains `..`                   | Malicious or malformed rule input                | Use a relative path without `..`.                      |
| `ERR_DIR_NAME_EMPTY`          | 400  | Directory name is empty                   | Form submitted empty                             | Provide a name.                                        |
| `ERR_DIR_NAME_INVALID`        | 400  | Directory name has `\ / : * ? " < > |`    | Copy-pasted Windows path                         | Strip illegal characters.                              |
| `ERR_DIR_NOT_FOUND`           | 400  | Source directory does not exist           | Folder moved after selection                     | Re-select the folder.                                  |
| `ERR_DIR_NOT_IN_VOLUME`       | 400  | Directory is not under that volume        | Stale directory list                             | Refresh the volume settings.                           |
| `ERR_VOLUME_EXISTS`           | 409  | A same-named directory already exists     | Adding the same source twice                     | Remove the old entry or pick another name.             |
| `ERR_LINK_CREATE_FAILED`      | 500  | Cannot create the directory link          | No permission, filesystem without symlink support | Run on a filesystem that supports links, or copy files.|
| `ERR_REAL_DIRECTORY`          | 409  | Refusing to delete a real directory       | Volume folder is not a link                      | Delete it manually under `raw/` if intended.           |

### Templates and presets

| Code                              | HTTP | Meaning                                | Common cause                      | What to do                                       |
| --------------------------------- | ---- | -------------------------------------- | --------------------------------- | ------------------------------------------------ |
| `ERR_PANEL_TEMPLATE_EMPTY`        | 400  | Template has no panels                 | Captured from an empty page       | Detect panels before saving a template.          |
| `ERR_LAYOUT_NOT_FOUND`            | 404  | Layout template id/name unknown        | Renamed or deleted template       | List `/api/layouts` again.                       |
| `ERR_LAYOUT_SAVE_INVALID`         | 400  | Layout is missing `grid.rows`          | Hand-edited layout JSON           | Keep `grid.rows` / `grid.cols` in the file.      |
| `ERR_ALIGN_PRESET_MISSING_FIELDS` | 400  | Preset lacks name/volume/chapter       | Partial form submission           | Send `name`, `volume`, `chapter`.                |
| `ERR_ALIGN_PRESET_NOT_FOUND`      | 404  | Alignment preset id unknown            | Preset deleted                    | List `/api/align-presets`.                       |
| `ERR_EXPORT_TEMPLATE_NOT_FOUND`   | 404  | Export template id unknown             | Template deleted or wrong id      | List `/api/export-templates`.                    |

### Import / export files

| Code                              | HTTP | Meaning                                        | Common cause                          | What to do                                       |
| --------------------------------- | ---- | ---------------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| `ERR_EXCHANGE_EMPTY_FILE`         | 400  | No file content received                       | Empty file input                      | Choose a non-empty file.                         |
| `ERR_EXCHANGE_INVALID_JSON`       | 400  | Payload is not JSON                            | Picked the wrong file                 | Choose a `.mntpl` / `.mnexp` / `.mnpage.json`.   |
| `ERR_EXCHANGE_VALIDATION`         | 400  | Schema validation failed (errors attached)      | Outdated or hand-edited payload       | Fix the listed field paths, or re-export.        |
| `ERR_EXCHANGE_VOLUME_REQUIRED`    | 400  | No volume selected for the import              | Applying a template without a volume  | Choose a volume first.                           |
| `ERR_EXCHANGE_CHAPTER_REQUIRED`   | 400  | Chapter binding needs a valid chapter          | `scope=chapter/page` without chapter  | Provide `chapter`.                               |
| `ERR_EXCHANGE_PAGE_INDEX_REQUIRED`| 400  | Page binding needs a zero-based index          | `scope=page` without `pageIndex`      | Provide `pageIndex`.                             |
| `ERR_EXPORT_TEMPLATE_SHAPE`       | 400  | Export template is not an object               | Wrong JSON shape                      | Use an object (or the array in `data/templates/export.json`). |
| `ERR_EXPORT_EMPTY`                | 400  | Nothing to export                              | No panels and no notes in range       | Add panels/notes or widen the page range.        |
| `ERR_PROJECT_EMPTY`               | 400  | Project upload is empty                        | Empty `.mnproj`                       | Re-export the project.                           |
| `ERR_PROJECT_IMAGE_ENTRY`         | 400  | Image entry lacks volume/chapter/name          | Corrupted manifest                    | Re-export the project.                           |
| `ERR_MANIFEST_INVALID_JSON`       | 400  | `manifest.json` is not JSON                    | Not a `.mnproj`, or corrupted         | Check the archive contents.                      |
| `ERR_MANIFEST_NOT_OBJECT`         | 400  | `manifest.json` is not an object               | Corrupted manifest                    | Re-export the project.                           |
| `ERR_MANIFEST_NO_INVENTORY`       | 400  | Manifest has no `inventory`                    | Too old or corrupted export           | Re-export with the current version.              |
| `ERR_MANIFEST_INCOMPLETE`         | 400  | Manifest failed schema validation              | Missing required fields               | Fix the listed paths, or re-export.              |
| `ERR_MANIFEST_MISSING`            | 400  | Archive has no `manifest.json`                 | Not a `.mnproj`                       | Choose the right archive.                        |
| `ERR_LIBRARY_NOT_OBJECT`          | 400  | `library.json` / config is not an object       | Hand-edited config                     | Restore a valid config or start fresh.           |
| `ERR_BACKUP_NOT_KOMAYOMI`         | 400  | Archive has no `data/` directory               | Not a KomaYomi backup                 | Choose a backup created by this app.             |

### Storage and remote backups

| Code                           | HTTP | Meaning                              | Common cause                          | What to do                                         |
| ------------------------------ | ---- | ------------------------------------ | ------------------------------------- | -------------------------------------------------- |
| `ERR_UNSAFE_PATH`              | 400  | Path contains `.` / `..` / empty part | Crafted request, bad config           | Only use clean relative paths.                     |
| `ERR_PATH_ESCAPE`              | 400  | Path resolves outside the storage root | Symlink escape, crafted request      | Keep paths inside the configured target.           |
| `ERR_STORAGE_READONLY`         | 403  | Target is read-only                  | Writing to a read-only backup target  | Pick a writable target or clear the read-only flag.|
| `ERR_NOT_A_DIRECTORY`          | 400  | Path is not a directory              | A file sits where a folder is expected| Move the file away.                                |
| `ERR_STORAGE_CONFIG_MISSING`   | 400  | No storage config sent               | Empty settings form                   | Send the storage config object.                    |
| `ERR_REMOTE_SOURCE_MISSING`    | 400  | No remote image source configured     | Sync requested before setup           | Configure a source in Settings → Storage.          |
| `ERR_STORAGE_TARGET_NOT_FOUND` | 404  | Unknown storage target id            | Target deleted, stale tab             | Reload storage settings.                           |
| `ERR_STORAGE_LIST_FAILED`      | 503  | Cannot list the directory            | Offline share, permission denied      | Check connectivity and credentials.                |
| `ERR_BACKUP_UPLOAD_FAILED`     | 503  | Backup upload failed                 | WebDAV error, disk full               | Check the `detail` param and the target.           |

### Plugins

| Code                    | HTTP | Meaning                              | Common cause                      | What to do                                          |
| ----------------------- | ---- | ------------------------------------ | --------------------------------- | --------------------------------------------------- |
| `ERR_PLUGIN_NO_EXPORT`  | 200* | Module has no `panels` export        | Plugin file malformed             | Export `panels` from `plugins/*.mjs`.               |
| `ERR_PLUGIN_TIMEOUT`    | 504* | Plugin exceeded 2500 ms              | Slow algorithm on a large page    | Optimise the plugin; the server falls back to auto. |
| `ERR_PLUGIN_NO_PANELS`  | 200* | Plugin returned no panels            | Threshold too strict              | Return at least one panel, or fall back to auto.    |
| `ERR_PLUGIN_NONE`       | 200* | No plugin matched the page           | No plugin, or `match` mismatch    | Add a plugin or force `--auto` in the CLI.          |

\* Plugin failures are normally returned as `warnings` (with `warningCodes`) while
detection falls back to the automatic detector, so the HTTP call still succeeds.

### Archives (`.mnproj`, backups)

| Code                         | HTTP | Meaning                                | Common cause                  | What to do                               |
| ---------------------------- | ---- | -------------------------------------- | ----------------------------- | ---------------------------------------- |
| `ERR_ZIP_TOO_SMALL`          | 400  | File too small to be a zip             | Truncated upload              | Re-upload the archive.                   |
| `ERR_ZIP_NO_EOCD`            | 400  | Central directory not found            | Not a zip, or truncated       | Use a complete `.mnproj` / backup.       |
| `ERR_ZIP_CORRUPT_DIR`        | 400  | Central directory is corrupted         | Damaged archive               | Re-create the archive.                   |
| `ERR_ZIP_ENTRY_CORRUPT`      | 400  | Entry header is corrupted              | Damaged archive               | Re-create the archive.                   |
| `ERR_ZIP_UNSUPPORTED_METHOD` | 400  | Compression method other than store/deflate | 7-Zip/legacy compressing  | Re-zip with deflate.                     |
| `ERR_ZIP_ENTRY_SIZE`         | 400  | Declared size does not match data      | Damaged archive               | Re-create the archive.                   |

### Directory rules

| Code                           | HTTP | Meaning                                     | Common cause                       | What to do                                   |
| ------------------------------ | ---- | ------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| `ERR_RULE_EMPTY`               | 400  | Pattern is empty                            | Blank rule row                     | Fill the pattern or delete the row.          |
| `ERR_RULE_UNKNOWN_PLACEHOLDER` | 400  | Placeholder is not supported                | Typo such as `{vol}`               | Use `{volume}`, `{language}`, `{chapter}`, `{page}`. |
| `ERR_RULES_NOT_ARRAY`          | 400  | Rules must be a non-empty array             | Cleared all rules                  | Keep at least one rule.                      |
| `ERR_RULE_NOT_OBJECT`          | 400  | Rule entry is not an object                 | Hand-edited JSON                   | Send an array of objects.                    |
| `ERR_RULE_PATTERN_MISSING`     | 400  | Rule has no `pattern`                       | Partial rule                       | Add `pattern`.                               |
| `ERR_RULE_PATTERN_ABSOLUTE`    | 400  | Rule is absolute or contains `..`           | Pasted filesystem path             | Use a relative pattern.                      |
| `ERR_RULE_PAGE_MISSING`        | 400  | Rule has no `{page}`                        | Forgot the page segment            | Add `{page}`.                                |
| `ERR_RULE_LANGUAGE_INVALID`    | 400  | `language` is not ja/zh/en                  | Typo in the fallback language      | Use `ja`, `zh` or `en`.                      |
| `ERR_RULE_LANGUAGE_MISSING`    | 400  | Rule has no language info                   | No `{language}` and no fallback    | Add `{language}` or `language`.              |
| `ERR_RULE_DUPLICATE_ID`        | 409  | Two rules share an id                       | Copy-pasted rule                   | Give each rule a unique id.                  |
| `ERR_RULE_PARSE`               | 400  | A stored rule cannot be parsed              | Corrupt `config/dir-rules.json`    | Fix the rule; the library otherwise falls back to defaults. |

## Warning codes

Warnings accompany a successful response; the payload also contains `warningCodes` where
the server generated them itself.

| Code                              | Meaning                                              | Typical cause                                 |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `WARN_DETECT_FROM_LAYOUT`         | Panels taken from a layout template                  | A layout is bound to that volume/chapter/page |
| `WARN_DETECT_FROM_PLUGIN`         | Panels detected by a plugin                          | A plugin matched the page                     |
| `WARN_PLUGIN_FAILED_FALLBACK`     | Plugin failed, automatic detection used               | Plugin error or timeout                       |
| `WARN_TITLE_FETCH_FAILED`         | Title could not be fetched                           | Network restriction, blocked host             |
| `WARN_PAGE_SKIPPED_NO_PANELS`     | Page skipped: no panels                              | Detected but never saved                      |
| `WARN_PAGE_SKIPPED_NO_ANNOTATIONS`| Page skipped: no annotations                         | Nothing to export on that page                |
| `WARN_PAGE_IMAGE_UNREADABLE`      | Page image cannot be decoded                         | Corrupt image, unsupported codec              |
| `WARN_DIR_RULES_FALLBACK`         | Invalid directory rules, defaults used               | Corrupt `config/dir-rules.json`               |
| `WARN_UNRECOGNIZED_DIRS`          | Directories could not be mapped to a language        | Non-standard folder names                     |
| `WARN_LANGUAGE_PAGE_COUNT`        | Languages differ in page count                       | Missing pages in one language                 |
| `WARN_MIXED_EXTENSIONS`           | Mixed extensions inside one chapter                   | `.jpg` and `.png` mixed                       |
| `WARN_MISSING_PAGE`               | A page is missing for a language                     | Gap in numbering                              |
| `WARN_FILENAME_MISMATCH`          | Filename number differs from the page order          | `page-010.jpg` at index 8                     |
| `WARN_NO_LANGUAGE_DIRS`           | No language directories recognized                   | Layout matches no rule                        |
| `WARN_SAME_NAME_VOLUME`           | Same-named folder already exists                     | Re-adding an existing source                  |
| `WARN_EMPTY_VOLUME_CREATED`       | Empty volume folder created                          | New volume without images                     |
| `WARN_NO_LANGUAGE_DIR_DETECTED`   | Added as a single volume, no language folders         | Flat folder layout                            |
| `WARN_VOLUME_ALREADY_IN_LIBRARY`  | Volume already present                               | Duplicate add                                 |
| `WARN_VOLUME_DIR_REMOVED`         | Missing directory removed from config                | Folder deleted outside the app                |
| `WARN_IMAGE_PATH_INVALID`         | Image path cannot be resolved                        | Malformed manifest URL                        |
| `WARN_IMAGE_MISSING`              | Image missing, skipped                               | Incomplete `.mnproj`                          |
| `WARN_PAGE_JSON_INVALID`          | Page JSON cannot be parsed                           | Corrupt page file                             |
| `WARN_ENTRY_JSON_INVALID`         | Archive entry JSON cannot be parsed                  | Corrupt config inside the archive             |
| `WARN_SUSPICIOUS_PATH`            | Suspicious path skipped (zip-slip guard)             | `../` entries in an archive                   |
| `WARN_UNKNOWN_ENTRY`              | Unknown archive entry ignored                        | Extra files in the archive                    |
| `WARN_SNAPSHOT_FAILED`            | Pre-restore snapshot failed                          | Disk full, permissions                        |
| `WARN_PROJECT_COPY_FAILED`        | Original project file could not be stored            | Disk full, permissions                        |
| `WARN_JSON_MERGE_FALLBACK`        | Config entry could not be merged                     | Invalid JSON in the archive                   |
| `WARN_LIBRARY_MERGE_FALLBACK`     | `library.json` could not be merged                   | Invalid JSON in the archive                   |
| `WARN_RELINK_DIR_MISSING`         | Relink directory missing                             | Moved source folder                           |
| `WARN_UNSAFE_IMAGE_PATH`          | Unsafe image path skipped                            | Crafted archive                               |
| `WARN_IMAGE_OVERWRITE_SKIPPED`    | Different image with the same name left untouched    | Conflicting assets                            |
| `WARN_RULE_LEVEL_MISMATCH`        | Directory depth does not match the rule              | Extra/missing folder level                    |
| `WARN_RULE_NO_LANGUAGE`           | Rule has no language segment or fallback             | Incomplete rule                               |
| `WARN_UNKNOWN_LANGUAGE_DIR`       | Language folder not recognized                       | `jp`, `cn`, custom names                      |
| `WARN_NO_RULE_MATCHED`            | No rule matched the path                             | Unsupported layout                            |

## Other message codes

These are also localized but are data rather than diagnostics:

- `STATUS_STORAGE_*` — storage probe results (`online`, `message`) in `GET /api/storage`
  and `POST /api/storage/test`:

  | Code                             | Meaning                                        |
  | -------------------------------- | ---------------------------------------------- |
  | `STATUS_STORAGE_LOCAL_OK`        | Local directory is reachable                   |
  | `STATUS_STORAGE_NETWORK_OK`      | Network share is reachable                     |
  | `STATUS_STORAGE_WEBDAV_OK`       | WebDAV is reachable                            |
  | `STATUS_STORAGE_DIR_NOT_CREATED` | Target directory does not exist yet            |
  | `STATUS_STORAGE_ACCESS_FAILED`   | Cannot access it (detail attached)             |
  | `STATUS_STORAGE_TIMEOUT`         | Connection timed out                           |
  | `STATUS_STORAGE_UNREACHABLE`     | Cannot connect                                 |

- `HISTORY_*` — `lastEditSummary` values stored in page docs (written in the language of
  the request that saved the page): `HISTORY_CREATED`, `HISTORY_PANELS`,
  `HISTORY_PANEL_RECTS`, `HISTORY_NOTES`, `HISTORY_NOTE_EDIT`, `HISTORY_DIRECTION`,
  `HISTORY_GROUPS`, `HISTORY_ANNOTATIONS`, `HISTORY_ALIGN_MODE`, `HISTORY_OFFSETS`,
  `HISTORY_SAVE`, `HISTORY_DETECTED`.
- `EXPORT_*` — labels inside exported HTML: `EXPORT_DIRECTION_RTL`,
  `EXPORT_DIRECTION_LTR`, `EXPORT_DIRECTION_TTB`, `EXPORT_PAGE_NOTES`, `EXPORT_PANEL_NO`,
  `EXPORT_EMPTY_PANELS`, `EXPORT_EMPTY_IMAGE`, `EXPORT_EMPTY_NOTES`, `EXPORT_PAGE_ALT`,
  `EXPORT_CHAPTER_LINE`, `EXPORT_AT`, `EXPORT_FOOTER`.
- `LANG_NAME_JA`, `LANG_NAME_ZH`, `LANG_NAME_EN`, `LABEL_*`, `DEFAULT_NAME_*` — display
  names and default titles.
- `CLI_*` — CLI-only lines: `CLI_USAGE`, `CLI_ERROR`, `CLI_REPORT_SUMMARY`,
  `CLI_REPORT_HISTOGRAM`, `CLI_REPORT_HISTOGRAM_ITEM`, `CLI_REPORT_NARROW`,
  `CLI_REGRESS_BASELINE`, `CLI_REGRESS_RESULT`, `CLI_DETECT_SKIPPED`,
  `CLI_DETECT_SKIPPED_EXISTING`, `CLI_DETECT_PAGE`, `CLI_DETECT_WRITTEN`,
  `CLI_DETECT_PREVIEW`, `CLI_DETECT_WARNING_SUFFIX`, `CLI_DETECT_DONE`,
  `CLI_LAYOUT_APPLIED`, `CLI_LAYOUT_NONE`, `CLI_LAYOUT_ROW`, `CLI_PLUGIN_NONE`,
  `CLI_PLUGIN_ROW`, `CLI_PLUGIN_ROW_ERROR`, `CLI_PLUGIN_FAILED`, `CLI_TEMPLATE_APPLIED`,
  `CLI_TEMPLATE_NONE`, `CLI_TEMPLATE_ROW`, `CLI_ALIGN_APPLIED`, `CLI_ALIGN_NONE`,
  `CLI_ALIGN_ROW`, `CLI_NO_RESULT`.
- CLI-only errors: `CLI_TEMPLATE_ARGS_REQUIRED` (missing `--template/--volume/--chapter`),
  `CLI_TARGET_CHAPTER_MISSING`, `CLI_MISSING_STATIC_DIR`.

## Adding or changing a message

1. Add the code to `MESSAGES` in `server/messages/catalog.ts` with **all three**
   languages (`en` is the fallback and must always be present).
2. Use `t('CODE', { param })` for user-facing text, or
   `throw new AppError('CODE', { param }, status)` for failures. Never concatenate
   translated fragments — pass values as parameters.
3. Add a row to the matching table above (and to the warning table for `WARN_*`).
4. Run `npm run typecheck`, `npm run lint` and `npm run format:check` — the catalog key
   type is derived from `MESSAGES`, so a typo becomes a compile error.
