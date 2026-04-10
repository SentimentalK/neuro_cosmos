---
title: "Transformer Architecture"
nodes:
  - transformer
  - llm
visibility: public
---

## Core Idea

Transformer 用 self-attention 机制取代了 RNN 的序列依赖，实现了并行化训练。

## Key Components

- **Self-Attention**: 让每个 token 可以直接 attend to 所有其他 token
- **Multi-Head**: 多组 QKV 投影并行，捕捉不同类型的关系
- **Positional Encoding**: 因为去掉了序列结构，需要显式注入位置信息
- **Feed-Forward Network**: 每层 attention 后跟一个 FFN 做非线性变换
- **Layer Normalization**: 稳定训练

## Why It Matters

Transformer 是 GPT / BERT / LLaMA 等所有现代 LLM 的基础架构。
理解它等于理解整个 LLM 技术栈的地基。
