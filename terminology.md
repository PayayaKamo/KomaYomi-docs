# Terminology

The three language versions of this manual use the terms below consistently. When a page and the UI disagree, the UI label wins; when in doubt, use the row in this table.

UI labels are quoted in the interface language, so a button may read differently from the prose. This table is the shared reference for translators and for readers switching languages.

## Core objects

| Concept | English | 中文 | 日本語 |
| --- | --- | --- | --- |
| A box on a page | panel | 分格 | コマ |
| The artwork panels are drawn on | base image | 底图 | 下地画像 |
| An image file on disk | page | 页面 | ページ |
| A folder of pages | chapter | 话 | 話 |
| A top-level folder | volume | 卷 | 巻 |
| The whole scanned collection | library | 图库 | ライブラリ |
| Two pages printed as one image | spread | 跨页 | 見開き |

## Panels and alignment

| Concept | English | 中文 | 日本語 |
| --- | --- | --- | --- |
| Automatic panel detection | auto split | 自动切格 | 自動分割 |
| Combining panels into one | merge | 合并 | 結合 |
| Panel numbering | reading order | 阅读顺序 | 読み順 |
| Horizontal or vertical reading | reading direction | 阅读方向 | 読み方向 |
| Making two editions overlap | alignment | 对齐 | 位置合わせ |
| A per-language displacement | offset | 偏移 | オフセット |
| A reference point for alignment | anchor | 锚点 | アンカー |
| Snapping to a fixed step | grid snap | 网格吸附 | グリッド吸着 |
| A saved alignment | preset | 预设 | プリセット |
| A saved set of rectangles | panel template | 分格模板 | コマテンプレート |
| A declarative page grid | layout template | 布局模板 | レイアウトテンプレート |

## Reading and annotation

| Concept | English | 中文 | 日本語 |
| --- | --- | --- | --- |
| Hiding artwork for self-testing | mask | 遮蔽 | マスク |
| A blur or solid cover | mask style | 遮蔽样式 | マスクスタイル |
| Drawing on the artwork | annotation | 标注 | 注釈 |
| A vector mark | arrow / rectangle / ellipse | 箭头 / 矩形 / 椭圆 | 矢印 / 矩形 / 楕円 |
| Pixelating an area | mosaic | 马赛克 | モザイク |
| Writing about a page or panel | note | 笔记 | ノート |
| The note column | notes panel | 笔记栏 | ノート欄 |
| A label on a note | tag | 标签 | タグ |
| Where a note came from | source | 来源 | 出典 |
| Draft notes area | scratchpad | 暂存区 | スクラッチパッド |

## Storage and export

| Concept | English | 中文 | 日本語 |
| --- | --- | --- | --- |
| The generated document | HTML export | HTML 导出 | HTML エクスポート |
| A static image export | PNG export | PNG 导出 | PNG エクスポート |
| A reusable document style | export template | 导出模板 | エクスポートテンプレート |
| A portable project archive | project package | 工程包 | プロジェクトパッケージ |
| A single layout or page file | exchange file | 交换文件 | 交換ファイル |
| A full data archive | backup | 备份 | バックアップ |
| Where a backup is uploaded | backup target | 备份目标 | バックアップ先 |
| A remote image source | remote assets | 远端素材 | リモート素材 |
| Fetching an image when opened | on-demand fetch | 按需拉取 | オンデマンド取得 |
| Local copy of a remote original | cache | 缓存 | キャッシュ |
| A zero-byte mirror entry | placeholder | 占位文件 | プレースホルダー |
| A reduced preview image | thumbnail | 缩略图 | サムネイル |
| The file format version | schema version | 格式版本 | スキーマバージョン |

## Words we avoid

| Avoid | Use instead | Why |
| --- | --- | --- |
| image / picture (for a scanned page) | page | “Image” is ambiguous with exported PNGs. |
| crop box | panel | A crop is an export operation; the stored rectangle is a panel. |
| translation | compare | The app compares editions; it does not translate. |
| sync (for annotations) | save | Annotations are local; nothing is uploaded. |
| template (alone) | panel template / layout template / export template | Three different objects share the word. |

## Related

- [Core Concepts](/concepts) — the data model in prose.
- [Data Formats](/data-format) — field names and versions.
- [Keyboard Shortcuts](/guide/shortcuts) — the keys that drive these objects.
