# 安装与运行

KomaYomi 既可以作为**由本地 Node 服务器支撑的浏览器应用**运行，也可以作为 **Electron 桌面窗口**运行。两者使用同一套服务器代码和同一个数据目录。

## 它解决什么问题

你希望应用跑在自己的机器上，读取自己的目录，不需要账号，也不上传任何东西。这一页带你从全新克隆走到第一次打开页面，并说明桌面打包版与浏览器开发服务器的区别。

## 环境要求

- **Node.js 20 或更高版本**（服务器 bundle 以 Node 20 为目标；仓库的开发环境使用 Node 22+）。
- npm（随 Node 一起提供）。
- 可选：Electron 相关依赖会随 `npm install` 一起安装。

没有托管服务，也不需要账号。应用只监听 `127.0.0.1`。

## 安装

在仓库根目录执行：

```bash
npm install
```

## 以开发模式运行

```bash
npm run dev
```

这会在 `http://127.0.0.1:5173` 上启动 Vite（如果 5173 被占用，端口可能会变化）。API 由 Vite 中间件插件提供，因此不需要启动第二个进程。

## 以桌面应用运行

```bash
npm run desktop
```

该命令做三件事：

1. `npm run build` —— 类型检查并把前端构建到 `dist/`。
2. `npm run server:build` —— 用 esbuild 把服务器打包为 `dist-server/app.mjs`。
3. `electron .` —— 打开一个窗口，从本地 HTTP 服务器加载打包好的静态文件。

桌面版数据目录：

- 从源码运行（`npm run desktop`）时，使用仓库文件夹，`raw/`、`data/` 和 `exports/` 与代码放在一起。
- 打包版默认使用 Electron `userData` 目录内的 `library` 文件夹，并在首次启动时让你选择文件夹。
- `Ctrl+Shift+D` 可切换数据目录（需要重启）。
- 环境变量 `MANGA_DATA_DIR` 会覆盖数据目录。
- `MANGA_PORT` 固定内部端口；否则会选择一个空闲端。

## 打包桌面应用

仓库包含 `electron-builder.yml` 和两个打包脚本：

```bash
npm run dist:win   # Windows x64：在 release/ 下生成 NSIS 安装程序和便携版 .exe
npm run dist:dir   # 在 release/ 下生成未打包的应用，适合快速冒烟测试
```

`dist:win` 会先构建前端和打包后的服务器，然后用 electron-builder 同时生成 `nsis` 和 `portable` 两种目标。产物命名为 `KomaYomi-<version>-<arch>.exe` 和 `KomaYomi-<version>-portable.exe`。

包内包含的内容：

- 只有 `dist/`、`dist-server/`、`electron/` 和 `package.json` —— 不会附带 `node_modules`。
- `raw/`、`data/` 和 `exports/` **不会**被打包。打包版会在首次启动时要求选择图库文件夹，并记住该选择。

当前限制：

- 唯一配置的目标是 Windows x64；没有 macOS 或 Linux 打包。
- 安装程序未签名，因此 Windows SmartScreen 可能在首次启动时给出警告。
- 本仓库尚未端到端产出过安装包；在你亲自做冒烟测试之前，请把首次 `npm run dist:win` 的输出视为**未经校验**。
- 没有自动更新通道。

## 构建产物

| 命令 | 产物 | 用途 |
| --- | --- | --- |
| `npm run build` | `dist/` | 静态前端。 |
| `npm run server:build` | `dist-server/app.mjs` | Electron 使用的打包 Node 服务器。 |
| `npm run dist:dir` | `release/` | 用于冒烟测试的未打包 Electron 应用。 |
| `npm run dist:win` | `release/` | Windows x64 NSIS 安装程序与便携版 `.exe`（尚未验证）。 |
| `npm run preview` | — | 用 Vite preview 提供构建后的前端。API 中间件是开发服务器的特性；若要访问 API，请使用桌面应用或 `npm run dev`。 |
| `npm run typecheck` | — | TypeScript 项目检查。 |

## 数据目录结构

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

`npm run dev` 通过 `/raw/...` 提供图片，通过 `/exports/...` 提供生成的文件；这两个文件夹都不会被暴露为静态目录列表。

## 端口与主机

- 开发界面：`127.0.0.1:5173`。
- 文档站点（本站）：从 `docs/` 启动时为 `127.0.0.1:5174`。
- Electron 窗口连接一个临时的 localhost 端口。

<figure class="shot">
  <div class="shot-missing">
    <strong>待补截图：首次启动</strong>
    将补上首次打开、图库为空且能看到“添加漫画”入口的界面截图。
  </div>
  <figcaption>计划截图：首次启动与空图库。</figcaption>
</figure>

## 首次运行

1. 按 `raw/<volume>/<ja|zh|en>/<chapter>/<pages>` 的结构，至少把一个卷放到 `raw/` 下。
2. 打开应用。侧边栏会列出卷和章。
3. 选择一页。首次打开时该页会被自动检测并保存。
4. 如果某个语言文件夹未被识别，打开卷设置手动映射目录。

命名规则以及扫描器接受的语言别名，请参见[图库与导入](/zh/guide/gallery)。

## 常见坑

- **5173 端口被占用。** Vite 会顺延到下一个空闲端口，请以终端打印的地址为准，不要默认还是 5173。
- **侧边栏是空的。** `raw/` 下没有卷，或者文件夹名没被识别。参见[图库与导入](/zh/guide/gallery)。
- **打包版启动后要求选择文件夹。** 这是正常的：安装包不附带 `raw/`、`data/` 和 `exports/`。
- **桌面窗口里改了目录却没生效。** 用 `Ctrl+Shift+D` 切换数据目录后必须重启，切换不是实时的。
- **`npm run preview` 里没有 API。** 该中间件只存在于开发服务器和桌面版，预览模式下页面加载不了图片。
- **`dist:win` 尚未验证。** 第一次打包请当作冒烟测试，并在干净机器上记录安装器的实际行为。

## 文档站点

文档位于 `docs/`，有自己独立的依赖：

```bash
cd docs
npm install
npm run docs:dev     # http://127.0.0.1:5174
npm run docs:build   # static output in docs/.vitepress/dist
npm run docs:preview # preview the production build
```

在仓库根目录也可以使用 `npm --prefix docs run docs:dev`。
