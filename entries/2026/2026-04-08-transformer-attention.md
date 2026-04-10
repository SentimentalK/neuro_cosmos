---
title: "Transformer 的 Multi-Head Attention 直觉"
type: study_event
topics:
  - transformer
  - llm
domains:
  - ai
relates_to:
  - embedding
  - linear-algebra
visibility: public
hours: 2.0
importance: 0.85
references:
  - type: video
    ref: "https://www.youtube.com/watch?v=eMlx5fFNoYc"
    title: "Transformer explained visually"
  - type: article
    ref: "https://jalammar.github.io/illustrated-transformer/"
    title: "The Illustrated Transformer"
---

学了 Transformer 的 Multi-Head Attention：

- QKV 本质上是信息检索系统 — Query 问问题，Key 提供索引，Value 给出内容
- Multi-head 让模型可以同时关注不同类型的关系（语法、语义、位置…）
- Self-attention 的复杂度是 O(n²)，这是长序列的瓶颈
- 和 linear algebra 的关系：QKV 变换本质上是线性投影
