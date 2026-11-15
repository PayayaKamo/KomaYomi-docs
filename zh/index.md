---
layout: home
titleTemplate: false
description: KomaYomi（Manga Learner）文档——用漫画学语言、做笔记，支持日/中/英对照阅读、分格检测、对齐与批注。
title: KomaYomi — Manga Learner 文档

hero:
  name: KomaYomi
  text: Manga Learner
  tagline: 用漫画学语言，做笔记。分格、对照与笔记都保存在你自己的机器上。
  image:
    src: /assets/screenshots/compare-reading.png
    alt: 三语对照阅读界面
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/guide/introduction
    - theme: alt
      text: 数据格式
      link: /zh/data-format

features:
  - title: 分格优先
    details: 自动 XY-cut 检测，并支持手动绘制、合并、编号和可复用的布局模板。分格数量一致时，原有标注会重新映射。
  - title: 最多对比三种语言
    details: 并排或叠加视图，按语言独立遮罩，滚轮缩放与平移，以及页面 / 分格 / 锚点 / 网格四种对齐方式，可保存为预设。
  - title: 笔记随身走
    details: 页面级或分格级的 Markdown 笔记、标签、来源、速记板、全文搜索，以及一键“复制上下文”粘贴到 LLM。
  - title: 可移植的输出
    details: 导出带图片文件夹的 HTML 或单文件内嵌 HTML，渲染页面 / 分格 / 拼图 PNG，并用 `.mnproj` 项目迁移全部内容。
---

## 什么是 KomaYomi？

KomaYomi（**Manga Learner**）是一个用漫画学语言、做笔记的**本地 Web 应用**：同一部漫画的日文、中文和英文版本并排对照，边读边记。你的页面图片保留在 `raw/` 文件夹中；每个分格、笔记、标签、对齐偏移和标注都存放在 `data/` 下的纯 JSON 里。除非你主动导出，否则任何内容都不会离开本机。

它的定位是学习与翻译校对，而不是托管受版权保护的内容：自备扫描件，把应用指向该文件夹，然后逐页处理。

## 状态一览

KomaYomi 目前处于 **0.1.0 版本，正在积极开发中**。本文档会区分“今天已经存在”与“计划中”的功能。

<div class="status-list">
  <div><strong>当前可用</strong> —— 图库扫描、XY-cut 分格检测、手动编辑分格、分格/布局模板、矢量标注（矩形、椭圆、箭头、文本）、带遮罩和四种对齐模式的对照阅读、可搜索的 Markdown 笔记、HTML 与 PNG 导出、备份 ZIP 及上传到 WebDAV/网络目标、带按需 LRU 缓存的 WebDAV/网络图片源、`.mnproj` 项目导出/导入、CLI 批处理工具。</div>
  <div><strong>计划中</strong> —— 应用内的分格分组编辑；PDF、Word（docx）与词表导出；离线写入队列；定时备份；原生移动端应用；更广泛的集成测试。</div>
</div>

本站中标记为 <Badge type="warning" text="计划中" /> 的任何内容都**尚未实现**。如果某个页面描述了代码中并不存在的行为，请以本条说明为准，并视该功能为不可用。

## 接下来去哪里

- 初次使用？请先阅读[简介](/zh/guide/introduction)，再看[安装与运行](/zh/guide/installation)。
- 想了解整体思路？从[核心概念](/zh/concepts)开始。
- 要基于 JSON 写脚本或开发插件？请前往[数据格式](/zh/data-format)和[布局模板与插件](/zh/extending)。
- 卡在缺失的页面或损坏的导出上？请查看[常见问题与故障排查](/zh/faq)。

::: tip 文档语言
英文是主要语言。中文译文位于 `/zh/`，日文译文位于 `/ja/`。每个页面会分别说明自身的状态。
:::
