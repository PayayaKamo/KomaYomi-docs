# データ形式

KomaYomi が保存するものはすべてプレーンな JSON またはプレーンな画像ファイルです。このページではディスク上の契約を文書化し、スクリプトから扱ったり、差分を取ったり、手で修復したりできるようにします。

## ファイル構成

| パス | 内容 |
| --- | --- |
| `raw/<volume>/<language>/<chapter>/*.jpg` | ページ画像（入力、変更されません）。 |
| `data/pages/<volume>/<chapter>/<index>.json` | ページごとに1つのページドキュメント（`index` は 0 始まり）。 |
| `data/templates/panel.json` | 保存されたコマテンプレート。 |
| `data/templates/export.json` | 保存されたエクスポートテンプレート。 |
| `data/presets/align.json` | 保存された位置合わせプリセット。 |
| `data/layouts/<id>.json` | 宣言的レイアウトテンプレート。 |
| `data/library.json` | 手動の言語ディレクトリ対応付け。 |
| `data/cache/thumbs/` | サムネイルキャッシュ（削除して問題ありません）。 |
| `data/backups/` | インポートした `.mnproj` ファイルのコピー。 |
| `exports/` | 生成された HTML、PNG、バックアップ ZIP、プロジェクトファイル。 |

書き込みはアトミックです。サーバーは `<file>.tmp` を書いてから対象にリネームします。クラッシュしても古いファイルは無傷で残ります。

## ページドキュメント

パス: `data/pages/<volume>/<chapter>/<pageIndex>.json`

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
      "text": "**原文**：……\n\n翻訳はより硬い表現。",
      "tags": ["语气", "待确认"],
      "source": { "title": "参照ページ", "url": "https://example.com" },
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
  "lastEditSummary": "コマ枠を調整；注釈を変更",
  "groups": [{ "id": "g1", "name": "見開き大ゴマ", "panelIds": ["p2", "p3"], "number": 1 }],
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

### フィールドリファレンス

| フィールド | 型 | 備考 |
| --- | --- | --- |
| `version` | `1` | ページドキュメントのスキーマバージョン。 |
| `volume`, `chapter` | string | フォルダ名と一致する必要があります。 |
| `pageIndex` | number | 0 始まり。 |
| `panels` | `Panel[]` | 後述。座標は `0..1` にクランプされ、幅／高さは最小 `0.005` です。 |
| `notes` | `Note[]` | `scope` は `page` または `panel` で、コマのノートには `panelId` が必要です。文字列の `text` を持たない行は破棄されます。 |
| `offsets` | `Record<Lang, AlignOffset>` | ページ単位の位置合わせ。`scale` は `0.2..4` にクランプされます。 |
| `alignMode` | `page \| panel \| anchors \| grid` | 無効な値は `page` になります。 |
| `panelOffsets` | `Record<panelId, Record<Lang, AlignOffset>>` | コマ単位の位置合わせ。 |
| `gridStep` | number | パーセント。`0.1..10` にクランプされ、既定は `1`。 |
| `readingDirection` | `rtl \| ltr \| ttb` | 無効な値は `rtl` になります。 |
| `detectorVersion` | string | 例: `xycut-1.3`、`layout:<id>`、`plugin:<name>`。 |
| `detectedAt` | ISO string | 最後の検出時刻。 |
| `detectSource` | `auto \| template \| plugin \| manual` | どの経路がコマを生成したか。 |
| `editCount` | number | 書き込みのたびに増えます。監査ログではありません。 |
| `lastEditedAt`, `lastEditSummary` | string | 人間が読める変更の概要。 |
| `groups` | `PanelGroup[]` | 読み込み時にぶら下がったコマ id が削除され、空のグループは破棄されます。 |
| `annotations` | `Annotation[]` | 無効な点は破棄されます。 |
| `annotationsVisible` | boolean | `false` にすると UI とエクスポートで注釈レイヤーを隠します。データは保持されます。 |
| `updatedAt` | ISO string | 書き込み時にサーバーが設定します。 |

### コマ

```json
{
  "id": "p1",
  "rect": { "x": 0.04, "y": 0.03, "w": 0.44, "h": 0.31 },
  "source": "auto",
  "number": 1
}
```

- `id` はページ内でローカルで、一意でなければなりません。
- `x`、`y`、`w`、`h` はページに対して正規化されています。
- `source` は `auto`、`manual`、`merged` のいずれかです。
- `number` は任意です。読み順を使う場合は省略します。

### ノート

| フィールド | 型 | 備考 |
| --- | --- | --- |
| `id` | string | ページ内で一意。 |
| `scope` | `page \| panel` | |
| `panelId` | string \| null | コマスコープでは必須。 |
| `text` | string | Markdown。生の HTML はエスケープされます。 |
| `tags` | string[] | |
| `source` | `{ title?, url?, text? }` | `text` は自由形式の出典ラベルです。 |
| `images` | `{ id, name, dataUrl }[]` | ノートに添付したスクリーンショット。ノートエディタで貼り付け、ドラッグ＆ドロップ、追加ができます。400 KB を超える画像は長辺 1600 px に縮小されます。 |
| `createdAt`, `updatedAt` | ISO string | |

### 注釈の種類

`arrow`、`rect`、`ellipse`、`highlight`、`text`、`badge`、`mosaic`、`pen`。

座標は注釈のスコープ（ページの枠またはコマの枠）に対する相対値です。フリーハンドのペンストロークは `points` の折れ線全体を使い、矢印は最初と最後の点を使います。

## バージョンのルール

### ページドキュメント

- `version` は現在 **1** です。
- 読み込み時にサーバーは拒否ではなく**正規化**を行います。未知のフィールドは破棄され、無効な数値は既定値になり、矩形はクランプされ、ぶら下がったグループ参照は削除され、欠けた id は生成されます。
- 解析できないページ JSON は存在しないものとして扱われ、アプリが自動検出して再作成します。
- 将来スキーマが変わった場合も、同じ正規化のアプローチで読み込み時に古いファイルを移行します。未知の将来のフィールドが保持されるとは考えないでください。

### プロジェクトパッケージ

- `schemaVersion` は現在 **1** です。
- **より高い**バージョンを宣言するパッケージは、明確なエラーで拒否されます。まずアプリをアップグレードしてください。
- バージョン **0** のパッケージ（初期の実験）はインポート時に移行されます。トップレベルの `images`、`file` フィールド、フラットな `langDirs` マップが現在のマニフェスト形状に変換されます。
- 欠けている任意のフィールドは既定値で埋められ、無効な画像はインポートを中断するのではなく破棄されます。

## プロジェクトパッケージ（`.mnproj`）

`.mnproj` ファイルは ZIP です:

```text
manifest.json
pages/<volume>/<chapter>/<index>.json
templates/...
presets/...
config/library.json          (optional)
assets/<sha1>.<ext>          (packaged mode only)
```

### マニフェスト

```json
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "createdAt": "2026-05-12T10:00:00.000Z",
  "updatedAt": "2026-05-12T10:00:00.000Z",
  "storageMode": "reference",
  "name": "点兔第14巻 学習ノート",
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

### ストレージモード

| モード | 画像 | サイズ | 可搬性 |
| --- | --- | --- | --- |
| `reference` | マニフェストにパスと SHA-1 のみ。 | 小さい。 | 元の画像が必要です。SHA-1 またはファイル名でフォルダを再リンクできます。 |
| `packaged` | `assets/<sha1>.<ext>` に重複排除して格納。 | 大きい。 | 自己完結。インポートすると画像が `raw/` に書き込まれます。 |

インポートはファイルごとに競合を確認し、**上書き**、**マージ**、**スキップ**を提示します:

- **マージ** は、入力側のページにコマ／注釈がない場合に既存のものを保持し、ノートを id で統合し（同じ id は入力側が優先）、既存のノートを決して削除しません。
- インポートの前に必ず `data/` のスナップショットが書き込まれ、元のパッケージも `data/backups/projects/` に保持されます。

## レイアウトテンプレート

パス: `data/layouts/<id>.json`

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
  "notes": "172話の大半のページに使用"
}
```

- `scope` は `page`、`chapter`、`volume` のいずれかで、リゾルバーは最も狭い一致を優先します。
- `cells[].span` により、セルを複数の列にまたがらせられます。
- `row.height` は相対的な重みです。
- `pageOverrides` のキーは 1 始まりのページ番号です。
- `margin` と `gap` は比率で、`colWeights` は既定で等幅です。

## コマテンプレートと位置合わせプリセット

**コマテンプレート** — 1つのページから矩形をコピーします:

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

**位置合わせプリセット**:

```json
{
  "id": "preset-…",
  "name": "172話 全体オフセット",
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

## エクスポートテンプレート

パス: `data/templates/export.json`

名前付きテンプレートの配列で、それぞれがエクスポート設定の一部を保存します:

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

完全なエクスポート設定には `title`、`volume`、`chapter`、`pageIndices`、`offsets`、`showPanelBoxes`、`includeNotes`、`onlyWithNotes`、`noteFilterTags` も含まれます。

## バックアップ ZIP

バックアップは、すべてのエントリに `data/` が前置された ZIP です:

```text
data/pages/...
data/templates/...
data/presets/...
data/library.json
data/.backup-meta.json
```

サムネイルキャッシュ（`data/cache/`）と `.tmp` / `.log` ファイルは除外されます。復元は `data/` 以下の同名ファイルを上書きしますが、バックアップにないページを削除はしません。現在のデータのスナップショットが先に書き込まれます。

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

手動の上書きだけがここにあります。エントリのない巻でも自動の言語検出は実行されます。
