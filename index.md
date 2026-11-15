---
layout: home
titleTemplate: false
description: KomaYomi (Manga Learner) documentation — learn languages with manga, compare Japanese, Chinese and English pages, detect panels, align artwork and take notes.
title: KomaYomi — Manga Learner documentation

hero:
  name: KomaYomi
  text: Manga Learner
  tagline: Learn languages with manga, take notes. Panels, comparison and notes stay on your own machine.
  image:
    src: /assets/screenshots/compare-reading.png
    alt: Compare reader with three language panes
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Data formats
      link: /data-format

features:
  - title: Panels first
    details: Automatic XY-cut detection with manual drawing, merging, numbering and reusable layout templates. Old annotations are remapped when panel counts match.
  - title: Compare up to three languages
    details: Side-by-side or overlay views, per-language masks, wheel zoom and pan, plus page / panel / anchor / grid alignment with reusable presets.
  - title: Notes that travel
    details: Markdown notes at page or panel scope, tags, sources, a scratch pad, full-text search and one-click "copy context" for pasting into an LLM.
  - title: Portable output
    details: Export HTML with an image folder or as a single embedded file, render page / panel / collage PNGs, and move everything as a `.mnproj` project.
---

## What is KomaYomi?

KomaYomi — **Manga Learner** — is a **local web application** for learning languages with manga: read the same pages in Japanese, Chinese and English, align them closely, and take notes. Your page images stay in a `raw/` folder; every panel, note, tag, alignment offset and annotation lives in plain JSON under `data/`. Nothing leaves the machine unless you export it.

It is designed for study and translation review rather than for hosting copyrighted material: bring your own scans, point the app at the folder, and work page by page.

## Status at a glance

KomaYomi is at **0.1.0 and under active development**. The documentation distinguishes what exists today from what is planned.

<div class="status-list">
  <div><strong>Working today</strong> — library scanning, XY-cut panel detection, manual panel editing, panel/layout templates, vector annotations (rectangle, ellipse, arrow, text), compare reader with masks and four alignment modes, Markdown notes with search, HTML and PNG export, backup ZIP plus upload to a WebDAV/network target, a WebDAV/network image source with on-demand LRU caching, `.mnproj` project export/import, CLI batch tools.</div>
  <div><strong>Planned</strong> — in-app panel-group editing; PDF, Word (docx) and vocabulary-list export; an offline write queue; scheduled backups; a native mobile app; broader integration tests.</div>
</div>

Anything marked <Badge type="warning" text="Planned" /> in this site is **not implemented yet**. If a page describes behavior that is not in the code, treat this note as authoritative and the feature as unavailable.

## Where to go next

- New here? Read [Introduction](/guide/introduction), then [Install & Run](/guide/installation).
- Want the mental model? Start with [Core Concepts](/concepts).
- Building on the JSON or writing a plugin? Go to [Data Formats](/data-format) and [Layout Templates & Plugins](/extending).
- Stuck on a missing page or a broken export? See [FAQ & Troubleshooting](/faq).

::: tip Documentation languages
English is the primary language. A Chinese translation lives under `/zh/` and a Japanese one under `/ja/`. Each page states its status separately.
:::
