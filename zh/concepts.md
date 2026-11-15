# 核心概念

五个对象几乎可以解释 KomaYomi 中的一切。

## 卷 → 章 → 页

```text
raw/<volume>/<language>/<chapter>/<page images>
```

- **卷**是一个顶层文件夹：一本书、一期杂志、一个合集。
- **章**是语言目录内的一个文件夹。各语言的章会取并集。
- **页**是章内自然排序后的第 *n* 张图片。页面在不同语言之间按位置配对，而不是按文件名配对。

每一页都有稳定的标识：`(volume, chapter, pageIndex)`，其中 JSON 中的 `pageIndex` **从 0 开始**，界面中显示的编号从 1 开始。

## 分格（Panel）

**分格**是页面上的一个矩形，以 `0..1` 归一化存储：

```json
{ "id": "p1", "rect": { "x": 0.05, "y": 0.04, "w": 0.42, "h": 0.30 }, "source": "auto" }
```

- `source` 为 `auto`、`manual` 或 `merged`。
- `number` 可以选择性地覆盖自动阅读顺序。
- 分格 id 在页面内局部有效（`p1`、`p2`……）。
- 分格与语言无关：一组矩形适用于该页的所有语言。

## 分组（Group）

**分组**是一组带名称的分格 id 集合，用于跨多个分格的内容，例如跨页大图或大幅插图。

```json
{ "id": "g1", "name": "跨页大图", "panelIds": ["p2", "p3"], "number": 1 }
```

分组是页面 JSON 的一部分，在读取、写入、导入和导出时都会保留。<Badge type="warning" text="计划中" /> 用于创建和编辑分组的应用内界面尚未实现；目前只能直接编辑 JSON。

## 笔记（Note）

**笔记**是附加到页面或分格上的 Markdown 文本，带有标签和可选的来源。它是主要的标注对象。

## 标注（Annotation）

**标注**是覆盖在页面或分格上的矢量图层：箭头、矩形、椭圆、高亮、文本、徽章、马赛克或自由画笔。坐标相对于作用范围框归一化。

```json
{
  "id": "a1",
  "kind": "arrow",
  "scope": "panel",
  "panelId": "p2",
  "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.8, "y": 0.7 }],
  "color": "#c2410c",
  "width": 3
}
```

数据模型、规范化以及项目导入/导出都支持标注，包括页面级的 `annotationsVisible` 开关。切格工作台提供箭头、矩形、椭圆、高亮、自由画笔、文本、徽标和马赛克等矢量标注工具；标注在导入导出时会保留。

## 对齐（Alignment）

**对齐**是按语言应用的变换，在对照阅读和导出时生效：

```json
{ "x": 0.02, "y": -0.01, "scale": 1.05 }
```

- `x`、`y` 是分格宽/高的比例。
- `scale` 被限制在 `0.2..4` 之间。
- 偏移可以按页面存储（`offsets`），也可以按分格存储（`panelOffsets`）。
- 页面会选择一种 `alignMode`：`page`、`panel`、`anchors` 或 `grid`。
- `gridStep` 是一个百分比（0.1–10，默认 1）。

## 阅读方向

`readingDirection` 取值为：

| 值 | 含义 |
| --- | --- |
| `rtl` | 从右到左、从上到下（日文漫画的默认值）。 |
| `ltr` | 从左到右、从上到下。 |
| `ttb` | 竖排列，从右到左。 |

它决定分格编号以及导出中笔记的顺序。

## 语言代码

应用只认识三种语言：`ja`（日本語）、`zh`（中文）和 `en`（English）。一个卷可以有一种、两种或三种；界面会禁用某页不存在的语言。

## 页面文档

上述所有内容都持久化在每页一个的**页面文档**（`PageDoc`）中，并带有 `version: 1`。所有字段请参见[数据格式](/zh/data-format)。

## 项目包

**`.mnproj` 项目**是一个 zip，包含页面文档、模板、预设和清单，以及图片引用或图片本身。它是你在不同机器之间迁移工作的方式。参见[远程存储与备份](/zh/remote-backup)。

## 心智模型

```text
Library
└── Volume (raw/<volume>)
    └── Chapter (raw/<volume>/<lang>/<chapter>)
        └── Page (paired by index)
            ├── Panel[]  ──────────┐
            ├── Note[] (page|panel)│
            ├── Group[]            │  all in one page JSON
            ├── Annotation[]       │
            └── Alignment offsets ─┘
```

图片文件是只读的输入。所有工作都在 `data/` 中。
