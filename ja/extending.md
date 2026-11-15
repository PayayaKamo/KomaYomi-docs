# レイアウトテンプレートとプラグイン

2つの拡張ポイントにより、アプリのコードに触れずに自動コマ検出を置き換えたり制約したりできます。

## 優先順位

ページが検出されるとき、サーバーは次の順に試します:

1. ページ、話、巻に紐づけられた**レイアウトテンプレート**。
2. `plugins/` または `data/plugins/` からの**一致するプラグイン**。
3. **内蔵の XYカット検出器**。

レイアウトテンプレートが常に優先されます。例外を投げる、タイムアウトする（2.5 秒）、またはコマを返さないプラグインは、目に見える警告とともに内蔵の検出器へフォールバックします。

## レイアウトテンプレート

レイアウトテンプレートはページを行とセルのグリッドとして記述します。話全体で再利用する固定の雑誌レイアウトに最適です。

### 最小の例

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

### 契約

| フィールド | 必須 | 意味 |
| --- | --- | --- |
| `id` | 推奨 | ファイルは `<id>.json` として保存され、省略時は生成されます。 |
| `name` | 推奨 | UI と CLI に表示されます。 |
| `scope` | はい | `page` > `chapter` > `volume` の特異性。 |
| `volume` | はい | 巻のフォルダ名と一致する必要があります。 |
| `chapter` | 話／ページスコープでは必須 | 話のフォルダ名と一致する必要があります。 |
| `pageIndex` | ページスコープでは必須 | 0 始まり。 |
| `grid.cols` | はい | 1–12。 |
| `grid.rows[].cells` | はい | 各セルは `span`（既定 1）を設定できます。 |
| `grid.rows[].height` | いいえ | 相対的な高さの重み（既定 1）。 |
| `margin` | いいえ | ページに対する比率。既定は各辺 `0.02`。 |
| `gap` | いいえ | 比率。`0`–`0.08` にクランプされ、既定は `0.012`。 |
| `colWeights` | いいえ | 相対的な列幅。既定では均等。 |
| `pageOverrides` | いいえ | キーは**1 始まり**のページ番号。`grid`、`margin`、`gap`、`colWeights` を上書きできます。 |
| `readingDirection` | いいえ | `rtl`（既定）、`ltr`、`ttb`。 |

サーバーはグリッドを正規化されたコマ矩形に展開します。行とセルはマージンの内側に、間隔を差し引き、スパンと重みを尊重して配置されます。

### テンプレートの管理

- コマ分割ワークベンチから現在のページをレイアウトとして**取り込み**ます（`POST /api/layouts/capture` で保存されます）。
- レイアウトをページ、話、巻に**適用**します（`POST /api/layouts/apply`）。
- ファイルは手書きでき、バージョン管理もできます。不正なファイルはライブラリを壊すのではなく無視されます。
- CLI: `apply-layout --layout <id> --volume <V> [--chapter <C>] [--pages 1,2]`。

### コマテンプレートよりレイアウトを選ぶべきとき

| | コマテンプレート | レイアウトテンプレート |
| --- | --- | --- |
| ソース | 1ページからコピーした正確な矩形 | 宣言的なグリッド |
| 再利用 | 同じページの形状 | 同じグリッドの多くのページ |
| 編集 | UI 経由 | プレーンな JSON で差分が取りやすい |
| 優先度 | 手動で適用 | 検出時に自動で適用 |

## コマプラグイン

プラグインは `plugins/` または `data/plugins/` 内の JS モジュールです。`.mjs`、`.cjs`、`.js` のすべてが読み込まれます。ファイルはアルファベット順に検討され、最初に一致したプラグインが使われます。

### 動作する最小のプラグイン

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

プラグインは素の関数をデフォルトエクスポートすることもでき、それはファイル名を名前とする `panels()` として扱われます。

### インターフェース

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

### ルールと失敗時の挙動

- 空の配列を返すことは失敗とみなされます。呼び出し側は自動検出へフォールバックします。
- 例外とタイムアウト（2500 ms）は捕捉され、UI は警告を表示して内蔵の検出器を使います。
- 矩形は `0..1` と最小幅／高さ `0.005` にクランプされ、無効なエントリは破棄されます。
- `match` は、文字列なら部分文字列チェック（大文字小文字を区別しない）、正規表現ならテストです。`match` を省略するとすべてに一致します。開発中は便利ですが、残しておくのは危険です。
- プラグインは mtime のキャッシュバスター付きで再インポートされるため、ファイルを編集してもサーバーの再起動は不要です。
- プラグインはサーバープロセス内で Node への完全なアクセスを持って実行されます。信頼できるプラグインだけをインストールしてください。

### プラグインの検査

```bash
node scripts/manga-cli.ts plugins
```

このコマンドは、各プラグインファイル、宣言された名前、読み込みエラーを一覧表示します。

## バッチ CLI

CLI はブラウザを起動せずに `raw/` と `data/` を直接操作します。Node の組み込み型ストリッピングに依存する TypeScript のエントリです（Node 22.6+ ではフラグ付き、Node 23.6+ では既定、Node 26 ではそのまま動作します）。

```bash
node scripts/manga-cli.ts <command> [options]
```

| コマンド | 目的 |
| --- | --- |
| `report [--narrow]` | すべてのページをスキャンし、コマ数のヒストグラムを出力します。`--narrow` は端に張り付く細い帯（*あらすじ* の誤検出候補）を一覧表示します。 |
| `regress [--update]` | コマ数を `scripts/detect-baseline.json` と比較します。`--update` はベースラインを書き換えます。 |
| `detect --volume V [--chapter C] [--pages 1,2] [--lang ja] [--plugin NAME] [--auto] [--apply] [--overwrite]` | UI と同じ優先順位で検出を実行します。`--apply` がない場合はドライランです。`--auto` は内蔵の検出器を強制します。 |
| `apply-layout --layout ID --volume V [--chapter C] [--pages 1,2]` | レイアウトテンプレートを展開して適用します。 |
| `apply-template --template ID --volume V --chapter C [--pages 1,2]` | 保存されたコマテンプレートを適用します。 |
| `apply-align --preset ID --volume V --chapter C [--pages 1,2]` | 位置合わせプリセットを適用します。 |
| `templates` | コマテンプレートを一覧表示します。 |
| `layouts` | レイアウトテンプレートを一覧表示します。 |
| `align-presets` | 位置合わせプリセットを一覧表示します。 |
| `plugins` | インストールされたコマプラグインを一覧表示します。 |

`detect` は、コマ数が変わらない場合はコマスコープのノートを読み順で再マッピングし、そうでなければページスコープのノートだけを保持します。これは UI がテンプレート適用時に行うのと同じルールです。

例:

```bash
node scripts/manga-cli.ts detect --volume 点兔第14卷 --chapter 172 --pages 1,2 --apply
node scripts/manga-cli.ts report --narrow
node scripts/manga-cli.ts regress
```

## 拡張のための HTTP API

UI 以外で便利なエンドポイント:

| メソッド | パス | 目的 |
| --- | --- | --- |
| `GET` | `/api/layouts` | レイアウトテンプレートを一覧表示します。 |
| `POST` | `/api/layouts` | レイアウトを保存します。 |
| `POST` | `/api/layouts/capture` | 現在のページをレイアウトとして取り込みます。 |
| `POST` | `/api/layouts/apply` | レイアウトをページに適用します。 |
| `DELETE` | `/api/layouts?id=…` | レイアウトを削除します。 |
| `GET` | `/api/plugins` | プラグインと読み込みエラーを一覧表示します。 |
| `POST` | `/api/detect` | テンプレート → プラグイン → 自動の優先順位でコマを検出します。 |
| `GET` | `/api/panel-templates` | コマテンプレートを一覧表示します。 |
| `POST` | `/api/panel-templates/apply` | コマテンプレートを適用します。 |
| `GET` | `/api/align-presets` | 位置合わせプリセットを一覧表示します。 |
| `POST` | `/api/align-presets/apply` | 位置合わせプリセットを適用します。 |
| `POST` | `/api/export` | HTML エクスポートを実行します。 |

完全なエンドポイント一覧は [データ形式](/ja/data-format) とサーバーのソース（`server/app.ts`）にあります。
