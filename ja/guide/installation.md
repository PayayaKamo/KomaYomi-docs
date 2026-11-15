# インストールと起動

KomaYomi は、**ローカルの Node サーバーが支えるブラウザアプリ**としても、**Electron のデスクトップウィンドウ**としても動作します。どちらも同じサーバーコードと同じデータディレクトリを使います。

## 解決する課題

アプリを自分のマシンで動かし、自分のフォルダーを読み、アカウントもアップロードも不要にしたい。このページでは、クローン直後から最初のページを開くまでと、デスクトップ版とブラウザ版の違いを説明します。

## 要件

- **Node.js 20 以上**（サーバーバンドルの対象は Node 20 で、リポジトリは Node 22+ で開発されています）。
- npm（Node に同梱）。
- 任意: Electron の依存関係は `npm install` の一部としてインストールされます。

ホストされたサービスもアカウントもありません。アプリは `127.0.0.1` でのみ待ち受けます。

## インストール

リポジトリのルートで:

```bash
npm install
```

## 開発モードで起動

```bash
npm run dev
```

`http://127.0.0.1:5173` で Vite が起動します（5173 が使用中ならポートが変わります）。API は Vite のミドルウェアプラグインが提供するため、2つ目のプロセスを起動する必要はありません。

## デスクトップアプリとして起動

```bash
npm run desktop
```

このコマンドは3つのことを行います:

1. `npm run build` — 型チェックを行い、フロントエンドを `dist/` にビルドします。
2. `npm run server:build` — esbuild でサーバーを `dist-server/app.mjs` にバンドルします。
3. `electron .` — ローカル HTTP サーバーからバンドル済みの静的ファイルを読み込むウィンドウを開きます。

デスクトップのデータディレクトリ:

- ソースから実行する場合（`npm run desktop`）、リポジトリのフォルダを使い、`raw/`、`data/`、`exports/` をコードの隣に保ちます。
- パッケージ済みビルドでは、Electron の `userData` ディレクトリ内の `library` フォルダが既定となり、初回起動時にフォルダの選択を求めます。
- `Ctrl+Shift+D` でデータディレクトリを切り替えます（再起動が必要です）。
- 環境変数 `MANGA_DATA_DIR` はデータディレクトリを上書きします。
- `MANGA_PORT` は内部ポートを固定します。指定しない場合は空きポートが選ばれます。

## デスクトップビルドのパッケージ化

リポジトリには `electron-builder.yml` と2つのパッケージングスクリプトが含まれています:

```bash
npm run dist:win   # Windows x64: NSIS インストーラー + ポータブル .exe を release/ に出力
npm run dist:dir   # release/ に展開済みアプリを出力。簡単なスモークテストに便利
```

`dist:win` はまずフロントエンドとバンドル済みサーバーをビルドし、その後 `nsis` と `portable` の両ターゲットで electron-builder を実行します。成果物は `KomaYomi-<version>-<arch>.exe` と `KomaYomi-<version>-portable.exe` の命名に従います。

パッケージに含まれるもの:

- `dist/`、`dist-server/`、`electron/`、`package.json` のみです。`node_modules` は同梱されません。
- `raw/`、`data/`、`exports/` は**同梱されません**。パッケージ済みビルドは初回起動時にライブラリフォルダの選択を求め、それを記憶します。

現在の制約:

- 設定済みのターゲットは Windows x64 のみで、macOS や Linux のパッケージングはありません。
- インストーラーは署名されていないため、初回起動時に Windows SmartScreen が警告を表示する可能性があります。
- このリポジトリではまだパッケージングが最後まで実行されていません。最初の `npm run dist:win` の出力は、スモークテストするまで**未検証**として扱ってください。
- 自動更新チャネルはありません。

## ビルド成果物

| コマンド | 出力 | 用途 |
| --- | --- | --- |
| `npm run build` | `dist/` | 静的フロントエンド。 |
| `npm run server:build` | `dist-server/app.mjs` | Electron が使うバンドル済み Node サーバー。 |
| `npm run dist:dir` | `release/` | スモークテスト用の展開済み Electron アプリ。 |
| `npm run dist:win` | `release/` | Windows x64 の NSIS インストーラーとポータブル `.exe`（未検証）。 |
| `npm run preview` | — | ビルド済みフロントエンドを Vite preview で配信します。API ミドルウェアは開発サーバーの機能なので、API にアクセスするにはデスクトップアプリか `npm run dev` を使ってください。 |
| `npm run typecheck` | — | TypeScript のプロジェクトチェック。 |

## データディレクトリの構成

```text
raw/                       # your images (gitignored)
  <volume>/<language>/<chapter>/01.jpg
data/
  pages/<volume>/<chapter>/0.json     # one page JSON, 0-based index
  templates/                          # panel templates and export templates
  presets/                            # alignment presets
  layouts/*.json                      # declarative layout templates
  library.json                        # manual language-directory mapping
  cache/thumbs/                       # thumbnail cache (safe to delete)
  backups/                            # project import backups (gitignored)
exports/                   # generated HTML, PNG, backups, .mnproj (gitignored)
```

`npm run dev` は画像を `/raw/...`、生成ファイルを `/exports/...` 経由で配信します。どちらのフォルダも静的ディレクトリ一覧としては公開されません。

## ポートとホスト

- 開発 UI: `127.0.0.1:5173`。
- ドキュメントサイト（このサイト）: `docs/` から起動した場合 `127.0.0.1:5174`。
- Electron ウィンドウは一時的な localhost ポートと通信します。

<figure class="shot">
  <div class="shot-missing">
    <strong>スクリーンショット準備中: 初回起動</strong>
    初回起動時、ライブラリが空で「漫画を追加」の入口が見える画面を追加します。
  </div>
  <figcaption>予定しているスクリーンショット: 初回起動と空のライブラリ。</figcaption>
</figure>

## 初回起動

1. `raw/<volume>/<ja|zh|en>/<chapter>/<pages>` に従って、少なくとも1巻を `raw/` に置きます。
2. アプリを開きます。サイドバーに巻と話が一覧表示されます。
3. ページを選択します。初回に開くとページが自動検出され、保存されます。
4. 言語フォルダが認識されない場合は、巻の設定を開いてディレクトリを手動で対応付けてください。

命名規則とスキャナーが受け付ける言語の別名は [ライブラリと取り込み](/ja/guide/gallery) を参照してください。

## よくある落とし穴

- **5173 ポートが使用中。** Vite は次の空きポートに移ります。端末に表示された URL を確認し、5173 と決め打ちしないでください。
- **サイドバーが空。** `raw/` に巻がないか、フォルダー名が認識されていません。[ライブラリと取り込み](/ja/guide/gallery) を参照してください。
- **パッケージ版がフォルダー選択を求める。** 正常です。パッケージには `raw/`、`data/`、`exports/` が含まれません。
- **データディレクトリを変えても反映されない。** `Ctrl+Shift+D` で切り替えたあと再起動が必要です。即時反映はされません。
- **`npm run preview` では API がない。** ミドルウェアは開発サーバーとデスクトップ版だけにあり、プレビューでは画像を読み込めません。
- **`dist:win` は未検証。** 最初のパッケージングはスモークテストとして扱い、クリーンな環境でインストーラーの挙動を記録してください。

## ドキュメントサイト

ドキュメントは `docs/` にあり、独自の依存関係を持ちます:

```bash
cd docs
npm install
npm run docs:dev     # http://127.0.0.1:5174
npm run docs:build   # static output in docs/.vitepress/dist
npm run docs:preview # preview the production build
```

リポジトリのルートからは `npm --prefix docs run docs:dev` も使えます。
