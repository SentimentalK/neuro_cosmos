# Neuro Cosmos Knowledge Organism
*(V1 System Architecture & User Guide)*

## 1. 系统核心理念 (The Core Concept)
我们摒弃了传统的“树状文件夹”和枯燥的“清单”。Neuro Cosmos 是一个**由数据驱动生长的神经网络体系**。
你在这里留下的每一条记录，不是进了死寂的文件夹，而是变成了一股“能量”，给宇宙中的那些“概念球体”注入体积（沉淀度）和亮度（近期活跃度）。

---

## 2. 文件夹与数据如何记录？(How to Log Data)
你现在的根目录非常干净，它是你所有思想和知识的最终沉淀池。

### 目录结构解释
* `nodes/` 存放所有的概念节点（YAML）。分两个子目录：
  - `domains/`：你的核心大领域，比如 `ai.yaml`, `math.yaml` 等。这是整个宇宙的“星系中心”。
  - `concepts/` / `topics/`：具体的技术、思想、概念，比如 `transformer.yaml`, `linear-algebra.yaml`。
* `entries/` 存放日常动作、学习事件（按年份组织的 Markdown 文件）。
* `notes/` 存放针对某个具体主题的深度总结文章（Markdown）。
* `edges/` 存放 `manual.yaml`，用来强制指定两个概念之间的关系（比如 Math 是 AI 的地基）。

### 【操作指南】日常怎么写？

**场景一：你今天看了一篇好文章/写了一个小Demo（高频发生活动）**
在 `entries/2026/` 下新建一个文件，比如 `2026-04-10-learned-vit.md`：
```yaml
---
title: "今天看了 Vision Transformer 的论文"
type: study_event        # 类型: study_event / reflection / project_log
topics: 
  - transformer          # 它会给这个【概念】注入能量
domains:
  - ai                   # 归属哪个【大领域】
relates_to:
  - embedding            # 它会在这两个节点间生成一根【生长牵引的线】
hours: 2.0               # 沉淀厚度（最终换算为球的大小）
importance: 0.8          # 重要性权重
---
Vit 的核心就是把图片切成 Patch，然后把 Patch 当成 Token 输入进 Transformer 里去...
```
**当你保存并发布后：** 
`transformer` 这个节点的球体会在前端变大（因为厚度增加了），并且变亮（因为是最近发生的活动，活跃度提升）。同时，`transformer` 和 `embedding` 之间会连起一条神经突触。

**场景二：你想总结某一项比较深入的技术理论笔记**
在 `notes/` 文件夹下新建 `transformer.md`：
```yaml
---
title: "Transformer 完整架构解析"
nodes: 
  - transformer
---
在这里写万字长文...
```
这会被直接挂载在 `transformer` 这个节点详情页的【笔记】里，随时可以点开。

---

## 3. 工作原理 (How the System Translates Data to UI)

目前的系统属于 **Static Site Generation (静态站点生成)** 架构。这就是为什么你需要使用 Docker 构建。

**数据流向：**
1. 你的 Markdown / YAML 文件（人类友好的原始数据）。
2. 执行 `scripts/compile.mjs`，提取所有的字段、进行交叉对比、数学计算（算球体多大，衰减活跃度等），最后把结果编译进成百上千个极其轻量的 `JSON` 文件。
3. ` Vite + React ` 将这些静态 `JSON` 当作前端源数据，编译为纯前端的 HTML / JS / CSS 网页静态包。
4. 被 Nginx 捕获，对外提供毫秒级的极速网页渲染。
