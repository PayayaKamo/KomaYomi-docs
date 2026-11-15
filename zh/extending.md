# 布局模板与插件

有两个扩展点可以让你在不改动应用代码的情况下替换或约束自动分格检测。

## 优先级

检测某一页时，服务器按以下顺序尝试：

1. 绑定到页面、章或卷的**布局模板**。
2. `plugins/` 或 `data/plugins/` 中的**匹配插件**。
3. **内置的 XY-cut 检测器**。

布局模板始终优先。抛出异常、超时（2.5 秒）或没有返回任何分格的插件会回退到内置检测器，并显示一条可见的警告。

## 布局模板

布局模板把页面描述为行与单元格组成的网格。它们非常适合整章复用的固定杂志版式。

### 最小示例

`data/layouts/four-panel.json`：

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

### 约定

| 字段 | 是否必需 | 含义 |
| --- | --- | --- |
| `id` | 推荐 | 文件会保存为 `<id>.json`；省略时会自动生成。 |
| `name` | 推荐 | 在界面和 CLI 中显示。 |
| `scope` | 是 | 具体程度为 `page` > `chapter` > `volume`。 |
| `volume` | 是 | 必须与卷文件夹名一致。 |
| `chapter` | 章/页面级必填 | 必须与章文件夹名一致。 |
| `pageIndex` | 页面级必填 | 从 0 开始。 |
| `grid.cols` | 是 | 1–12。 |
| `grid.rows[].cells` | 是 | 每个单元格可以设置 `span`（默认 1）。 |
| `grid.rows[].height` | 否 | 相对高度权重（默认 1）。 |
| `margin` | 否 | 页面比例；每边默认为 `0.02`。 |
| `gap` | 否 | 比例，限制在 `0`–`0.08`，默认 `0.012`。 |
| `colWeights` | 否 | 相对列宽；默认等宽。 |
| `pageOverrides` | 否 | 键是**从 1 开始**的页码；可以覆盖 `grid`、`margin`、`gap`、`colWeights`。 |
| `readingDirection` | 否 | `rtl`（默认）、`ltr`、`ttb`。 |

服务器会把网格展开为归一化的分格矩形。行和单元格在边距内布局，扣除间距，并遵循跨列与权重。

### 管理模板

- 从分格工作台**捕获**当前页为布局（通过 `POST /api/layouts/capture` 存储）。
- 把布局**应用**到页面、章或卷（`POST /api/layouts/apply`）。
- 文件可以手写并纳入版本控制。格式错误的文件会被忽略，而不会破坏图库。
- CLI：`apply-layout --layout <id> --volume <V> [--chapter <C>] [--pages 1,2]`。

### 何时优先用布局而不是分格模板

| | 分格模板 | 布局模板 |
| --- | --- | --- |
| 来源 | 从某一页复制的精确矩形 | 声明式网格 |
| 复用 | 相同的页面几何 | 共享同一网格的许多页面 |
| 可编辑性 | 通过界面 | 纯 JSON，便于 diff |
| 优先级 | 手动应用 | 检测时自动应用 |

## 分格插件

插件是 `plugins/` 或 `data/plugins/` 中的 JS 模块。`.mjs`、`.cjs` 和 `.js` 都会被加载。文件按字母顺序考虑；第一个匹配的插件会被使用。

### 可用的最小插件

`plugins/example-2x2-grid.mjs`：

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

插件也可以默认导出一个裸函数，它会被当作 `panels()`，并以文件名作为名称。

### 接口

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

### 规则与失败行为

- 返回空数组即视为失败：调用方会回退到自动检测。
- 异常和超时（2500 毫秒）会被捕获；界面会显示警告并使用内置检测器。
- 矩形会被限制在 `0..1`，且宽高最小为 `0.005`。无效条目会被丢弃。
- `match` 对字符串是不区分大小写的子串检查，对正则是正则测试。省略 `match` 会匹配所有内容——开发时有用，但留在生产环境中很危险。
- 插件会通过 mtime 缓存失效机制重新导入，因此编辑文件后不需要重启服务器。
- 插件在服务器进程中运行，拥有完整的 Node 访问权限。只安装你信任的插件。

### 查看插件

```bash
node scripts/manga-cli.ts plugins
```

这会列出每个插件文件、其声明的名称以及任何加载错误。

## 批处理 CLI

CLI 直接操作 `raw/` 和 `data/`，无需启动浏览器。它是一个 TypeScript 入口，依赖 Node 内置的类型剥离（Node 22.6+ 需要加标志，Node 23.6+ 默认启用；Node 26 开箱即用）。

```bash
node scripts/manga-cli.ts <command> [options]
```

| 命令 | 用途 |
| --- | --- |
| `report [--narrow]` | 扫描每一页，打印分格数量直方图。`--narrow` 会列出贴边的窄条（*あらすじ* 误判的候选）。 |
| `regress [--update]` | 对照 `scripts/detect-baseline.json` 比较分格数量；`--update` 会重写基线。 |
| `detect --volume V [--chapter C] [--pages 1,2] [--lang ja] [--plugin NAME] [--auto] [--apply] [--overwrite]` | 用与界面相同的优先级运行检测。不带 `--apply` 时为试运行。`--auto` 强制使用内置检测器。 |
| `apply-layout --layout ID --volume V [--chapter C] [--pages 1,2]` | 展开并应用一个布局模板。 |
| `apply-template --template ID --volume V --chapter C [--pages 1,2]` | 应用已保存的分格模板。 |
| `apply-align --preset ID --volume V --chapter C [--pages 1,2]` | 应用一个对齐预设。 |
| `templates` | 列出分格模板。 |
| `layouts` | 列出布局模板。 |
| `align-presets` | 列出对齐预设。 |
| `plugins` | 列出已安装的分格插件。 |

当分格数量不变时，`detect` 会按阅读顺序重新映射分格级笔记；否则只保留页面级笔记——这与界面在应用模板时使用的规则相同。

示例：

```bash
node scripts/manga-cli.ts detect --volume 点兔第14卷 --chapter 172 --pages 1,2 --apply
node scripts/manga-cli.ts report --narrow
node scripts/manga-cli.ts regress
```

## 供扩展使用的 HTTP API

界面之外的一些有用端点：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/layouts` | 列出布局模板。 |
| `POST` | `/api/layouts` | 保存一个布局。 |
| `POST` | `/api/layouts/capture` | 把当前页捕获为布局。 |
| `POST` | `/api/layouts/apply` | 把布局应用到页面。 |
| `DELETE` | `/api/layouts?id=…` | 删除一个布局。 |
| `GET` | `/api/plugins` | 列出插件和加载错误。 |
| `POST` | `/api/detect` | 按模板 → 插件 → 自动的优先级检测分格。 |
| `GET` | `/api/panel-templates` | 列出分格模板。 |
| `POST` | `/api/panel-templates/apply` | 应用一个分格模板。 |
| `GET` | `/api/align-presets` | 列出对齐预设。 |
| `POST` | `/api/align-presets/apply` | 应用一个对齐预设。 |
| `POST` | `/api/export` | 执行一次 HTML 导出。 |

完整的端点列表见[数据格式](/zh/data-format)和服务器源码（`server/app.ts`）。
