# Remote Storage & Backup

## What exists today

Local disk is the default: KomaYomi reads images from `raw/`, writes annotations to `data/`, and writes generated files to `exports/`. On top of that, the server supports **remote image sources** and **remote backup destinations** over WebDAV or a mounted/SMB network share, configured under **Data tools → Storage** and stored in `data/storage.json` (`schemaVersion: 1`).

Two portable local safety nets are also implemented.

### Remote image source (WebDAV / network drive)

A storage target of kind `webdav` or `network` can be set as `rawSource`.

- **Structure sync** — **Sync** walks the remote tree and mirrors its folders into `raw/` as zero-byte placeholder files (up to 20,000 image files). The existing library scanner and naming rules keep working; the placeholders mark which pages exist.
- **On-demand fetch** — image bytes are downloaded the first time a page or thumbnail is opened, not during sync. Fetched files are cached under `data/cache/remote/files/`, addressed by a SHA-1 of the provider id plus the relative path.
- **LRU cache** — the cache is capped by `cacheLimitMb` (default **512 MB**). After each write the server prunes least-recently-used files until usage is below **90%** of the cap. The cache can be cleared from the storage UI.
- **While offline** — pages already in the cache stay readable. An uncached image returns HTTP **503** with code `ERR_REMOTE_UNAVAILABLE`; a failed thumbnail fetch returns **502** `ERR_THUMB_FETCH_FAILED`. The library keeps listing the pages instead of hanging or silently dropping them.
- **Credentials** — the user name is stored in `storage.json`; the password is encrypted with **AES-256-GCM** in `data/secrets.json.enc`, using a per-install key at `data/.secret.key` (mode `0600`). The API only reports `hasSecret`, never the password. This is a portable fallback, not an OS keychain; anyone who copies the whole data folder together with `.secret.key` can decrypt it.
- **WebDAV details** — Basic authentication, `PROPFIND` for listing/status, `GET` for reads, `PUT` for writes, 10-second request timeout. Read-only targets still work as a source but refuse uploads (`ERR_STORAGE_READONLY`).

### Backup ZIP

- Creates a ZIP of `data/` with every entry prefixed by `data/` and a `data/.backup-meta.json` marker.
- Excludes the thumbnail cache and `.tmp` / `.log` files.
- The file is written to `exports/` and offered as a download. If a backup target is selected, the same ZIP is uploaded to `backups/backup-<timestamp>.zip` on that target.
- **Inspect before restore** shows file count, page count, note count, volumes, templates, presets, how many files would be overwritten and the archive size.
- **Restore** writes same-named files under `data/`, but does not delete pages that are absent from the backup. A snapshot of the current data is written to `exports/` before anything is overwritten, so a mis-click is reversible.

### `.mnproj` project package

A ZIP with `manifest.json`, page JSON, templates and presets, in one of two modes:

- **Reference** — records image paths and SHA-1 hashes. Small. If images moved, import can **relink** them from a chosen folder by hash first, then by filename.
- **Packaged** — embeds deduplicated images under `assets/<sha1>.<ext>`. Self-contained and portable, but large.

Import behavior:

- A snapshot of `data/` is written first.
- The original package is kept under `data/backups/projects/`.
- Conflicts can be resolved as **overwrite**, **merge** or **skip**.
- **Merge** preserves existing panels/annotations when the incoming page lacks them, unions notes by id, and never deletes existing notes.

See [Data Formats](/data-format) for the manifest fields and folder layout.

## Recommended practice

1. **Keep `raw/` on a large local disk** (or an attached drive). It is the bulk of the data and is gitignored.
2. **Back up `data/` regularly** with the Backup ZIP. It is small — mostly JSON — and contains all your work.
3. **Use `.mnproj` reference mode** to move annotations between machines that already have the same images.
4. **Use `.mnproj` packaged mode** to hand a self-contained project to someone else.
5. **Keep a copy of `exports/`** if you want to preserve generated study documents; it is gitignored and can be regenerated.
6. **Use a remote source for large libraries** on a NAS; the on-demand cache keeps browsing responsive while avoiding a full local copy.

## Why not just sync the folders?

You can put `raw/`, `data/` and `exports/` on a network drive or in a synced folder. The app does not lock files, but writes are atomic (`.tmp` + rename), so a sync client is unlikely to observe a partially written JSON. Avoid editing the same page from two machines at once; last write wins.

## Planned: still missing

The following are **not implemented** and are listed here so expectations are clear:

- <Badge type="warning" text="Planned" /> **Offline write queue** — queue annotation and note writes while disconnected, then reconcile on reconnect. Today writes always go to the local `data/` folder; when a remote source is offline only reads degrade.
- <Badge type="warning" text="Planned" /> **Scheduled backups** — automatic periodic snapshots, locally or to a configured target.
- <Badge type="warning" text="Planned" /> **Remote sync of `data/` with version history** — the WebDAV target currently serves images and receives backup ZIPs; it does not version the annotation database itself.

Until then, treat the Backup ZIP, remote backup upload and `.mnproj` as the supported transfer mechanisms.

## Restore checklist

1. Click **Backup** and confirm the ZIP appears in `exports/` (or on the chosen remote target).
2. To restore: choose **Inspect**, review the counts, then **Restore**.
3. After restoring, reload the library; pages with annotations get a badge in the sidebar.
4. If a project import reports missing images, point **relink directory** at the folder that contains them and import again with **merge**.
