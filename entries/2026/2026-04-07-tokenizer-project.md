---
title: "Built a tiny tokenizer demo"
type: project_log
topics:
  - tokenization
  - llm
domains:
  - projects
  - ai
  - cs
relates_to:
  - transformer
visibility: public
hours: 3.0
importance: 0.85
references:
  - type: repo
    ref: "https://github.com/example/mini-tokenizer"
    title: "mini-tokenizer"
---

做了一个简单的 tokenizer demo：

- 实现了最基础的 BPE 算法
- 从零手写 merge 逻辑，理解了 subword 的核心思想
- 发现 tokenization 质量直接影响下游模型的性能
- 下一步想试 SentencePiece 的 unigram model
