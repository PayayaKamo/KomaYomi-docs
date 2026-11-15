# Remote Storage & Backup

Your images can live on another disk, a NAS share or a WebDAV server while annotations stay in the local `data/` folder. This page explains how remote libraries behave, what happens offline, and how backups work.

## The problem it solves

A manga library is often much larger than the disk you want the app to index, or it already lives on a NAS. Copying tens of thousands of images into `raw/` is wasteful. At the same time, annotations are small and must never be lost when the network is down.

KomaYomi separates the two: **images are read remotely on demand, annotations are written locally.**

## Setting up a remote library

1. Open **Backup / restore** in the sidebar.
2. In **Remote assets / network storage**, click **Add a remote folder**.
3. Fill in the target:

| Field | Meaning |
| --- | --- |
| **Name** | Label shown in the dialog. |
| **Type** | Local folder, Network drive / UNC, or WebDAV. |
| **Folder path** | e.g. `D:\manga` or `\\nas\share\manga` (local / network). |
| **WebDAV URL**, **Username**, **Password** | WebDAV credentials. |
| **Read-only** | Mark the source as read-only so the app never writes to it. |

4. Click **Test connection**. The dialog reports *Online* / *Offline* and whether the target is read-only.
5. Click **Sync remote folder tree**.

### What the sync does

The app walks the remote folder and creates **zero-byte placeholder files** in a local mirror (`data/cache/remote/tree/`). The normal library scanner and folder rules then run over that mirror, so remote volumes appear in the sidebar exactly like local ones, with the same volume → language → chapter grouping.

- Only image extensions are mirrored: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, `.bmp`.
- The walk is limited to 10 levels deep and **20,000 files**; hitting the limit reports “file limit reached” and stops.
- Folders that cannot be read are counted and reported, without aborting the sync.
- Syncing again replaces the mirror; annotations are unaffected.

## On-demand loading and caching

When you open a page:

1. The app checks the local cache for the original file.
2. If it is missing, the file is fetched from the remote source.
3. The bytes are written to `data/cache/remote/files/`, content-addressed per provider and path.
4. Thumbnails are generated from the cached original.

There is no “download the whole library” step. Only pages you actually open are fetched.

| Control | Meaning |
| --- | --- |
| **Cache n MB / limit MB (m files)** | Current cache usage. |
| **Cache limit (MB)** | Upper bound; default **512 MB**, any positive value up to 100,000. |
| **Clear image cache** | Deletes cached remote originals and thumbnails; safe to use, they are re-fetched. |

When the cache exceeds its limit, the least-recently-used files are evicted until usage falls below **90%** of the cap.

## Offline behaviour

The network is allowed to disappear:

| Situation | Result |
| --- | --- |
| Page already cached | Opens normally, offline. |
| Page not cached, remote offline | The image request fails with HTTP **503** `ERR_REMOTE_UNAVAILABLE`; the UI shows an error instead of hanging. |
| Thumbnail of an uncached page, remote offline | HTTP **502** `ERR_THUMB_FETCH_FAILED`. |
| Annotations, notes, panels | Always local; you can keep editing pages whose images are cached. |

There is no offline **write** queue: writes go to the local `data/` folder, which is always on the machine running the app.

::: tip Practical offline use
Before going offline, open the pages you plan to study. They stay readable because the originals and thumbnails are cached. The cache limit determines how much you can carry.
:::

## Passwords and credentials

- Passwords are **not** stored in `storage.json`.
- They are encrypted with **AES-256-GCM** into `data/secrets.json.enc`, using a per-install key file `data/.secret.key` created with mode `0600`.
- A copied or synced `data/` folder therefore does not leak the password, and the UI never shows it back — leave the password field blank to keep the saved value.
- Passwords are **excluded from backups**.

## Backup targets

The same dialog lists **Backup targets**. A target is where a backup ZIP is uploaded:

1. **Add a backup target** and choose local folder, network drive or WebDAV.
2. **Back up to this target** builds a ZIP of `data/` and uploads it to `backups/backup-<timestamp>.zip` under that target.
3. The dialog reports the target, file name and size when it finishes.

Any configured source or target can be tested with **Test connection**; the ones that are offline are reported.

## Manual backup and restore

- **Create and download a backup** produces a ZIP of `data/`: pages, templates, presets, layouts, `library.json` and a `.backup-meta.json`. Thumbnail caches and temporary files are excluded.
- **Choose a backup file…** inspects the ZIP first and reports how many pages, notes, templates and presets it contains, and which volumes are involved.
- Restoring **overwrites same-named files** under `data/` but does not delete pages absent from the backup. A snapshot of the current data is written before the restore.

See [Remote Storage & Backup (reference)](/remote-backup) for the file-level contract and the exact storage JSON.

## Current limitations

The following are **not implemented** and remain <Badge type="warning" text="Planned" />:

- An offline write queue: edits always target the local data folder.
- Scheduled or automatic backups: backups are started manually.
- Cloud providers other than WebDAV (no Dropbox / Google Drive / S3 integration).

<figure class="shot">
  <div class="shot-missing">
    <strong>Screenshot pending: remote storage settings</strong>
    A screenshot of the Backup / restore dialog with a WebDAV source, cache usage and a backup target will be added here.
  </div>
  <figcaption>Planned screenshot: remote source, cache usage and backup targets.</figcaption>
</figure>

## Common pitfalls

- **The remote volume does not appear.** Run **Sync remote folder tree**; the mirror is what the library scans. Check the file limit and skipped-folder count in the result.
- **Every page shows a 503.** The remote is offline and the page was never cached. Reconnect, then reopen the page.
- **Disk usage keeps growing.** The cache cap is 512 MB by default; raise it deliberately, or clear the cache when you switch libraries.
- **A backup is missing a password.** That is by design; re-enter the password after restoring on another machine.
- **A network path works in Explorer but not here.** Network drives must be reachable from the account that runs the app — this matters for a service or a different desktop user.

## Missing screenshots

| Figure | Needed for |
| --- | --- |
| remote source form | Type, URL, credentials, read-only |
| cache usage strip | Usage, limit, clear button |
| backup target list | Add, test, upload |

## Related

- [Backup reference](/remote-backup) — storage JSON and file-level details.
- [Library & Import](/guide/gallery) — folder rules still apply to the mirror.
- [Server & CLI Message Codes](/server/error-codes) — `ERR_REMOTE_UNAVAILABLE`, `ERR_THUMB_FETCH_FAILED`.
