---
title: "Karpathy 的 LLM Wiki：从“检索信息”到“编译知识”"
date: 2026-04-11 11:20:00
tags: [AI, LLM, Knowledge Management, RAG, Research]
---

![LLM Wiki 总览图](/uploads/karpathy-llm-wiki-deep-dive/001_cover.svg)

2026 年 4 月 4 日，Andrej Karpathy 在 GitHub Gist 发布了 [《LLM Wiki》](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。它不是论文，不是产品发布，也不是一个完整框架，而更像是一份“思想草图”：把 LLM 从一个一次性的问答器，变成一个持续维护知识库的“知识编译器”。

这篇短文之所以迅速引发讨论，不只是因为 Karpathy 的个人影响力，更因为它击中了一个越来越明显的现实：**当模型变强之后，瓶颈不再只是“能不能回答”，而是“能不能长期地组织、维护、沉淀、校正知识”**。

在这个意义上，LLM Wiki 并不是一个 Obsidian 工作流，也不是一个“不要 RAG” 的口号，而是一种新的知识架构观。它主张：与其让模型在每次提问时都重新从原始材料里“临时拼装答案”，不如先把原始材料“编译”为一个持续演化的、结构化的、可追踪的 wiki，再基于这个 wiki 去问答、分析、生成报告，甚至继续反哺 wiki 本身。

我认为，这是 2026 年 AI 应用里一个非常值得认真对待的方向。因为它背后反映的，不只是笔记习惯变化，而是 LLM 系统设计范式的变化。

## 一、Karpathy 到底提出了什么

Karpathy 在原始 gist 里写得非常清楚：多数人对 LLM 和文档的使用方式，仍然停留在 RAG 范式里。用户上传文件，系统在提问时检索相关片段，再由模型临时生成回答。这个流程“能用”，但有一个根本缺陷：**知识不会累积**。

他强调，传统 RAG 风格的问题不在于检索不到，而在于每次都要“重新发现知识”。当问题需要跨五篇文档做微妙综合时，系统每次都要重新拼装一次，没有沉淀，没有复利，也没有逐步形成更高层次的结构。

所以他给出的替代思路是：

1. 保留一层不可修改的 `raw sources`，作为原始事实材料。
2. 让 LLM 维护一层 `wiki`，用 markdown 文件承载摘要、概念页、实体页、对比页、综合页。
3. 用 `CLAUDE.md`、`AGENTS.md` 这类 schema 文件定义结构和流程，让模型知道该如何 ingest、query、lint。

这套设计最关键的点，不是“markdown 很好”，而是 **knowledge compilation**。Karpathy 的原话可以概括为：系统不该在每次提问时重新从原始文档推导知识，而应该在新资料加入时，先把知识编译进 wiki，并随着后续材料持续修正。

这意味着几件很重要的事同时发生了：

- 知识从“查询时临时生成”变成“摄入时持续整理”。
- 问答从“对原始材料提问”变成“对一个已组织的知识结构提问”。
- 输出不再只进入聊天记录，而是可以回写为新的 wiki 页面，继续成为未来问题的上下文。

Karpathy 还给了一个非常传神的比喻：**“Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.”** 这句话很重要，因为它表明在他心里，这不是一个笔记应用，而是一个由人和模型共同维护的“知识代码库”。

## 二、这为什么重要：它解决的不是搜索，而是知识复利

很多人看完 gist 的第一反应是：“这不就是高级版笔记软件吗？”我认为这低估了它。

LLM Wiki 的真正突破，是把人类知识工作中最难坚持、最不愿做、但又最关键的那一层维护劳动外包给了模型。Karpathy 在文中明确指出，真正让知识库失败的，不是阅读和思考本身，而是那些琐碎维护工作：更新交叉引用、修订摘要、标记新旧观点冲突、维持几十个页面的一致性。人类往往不是不想建知识库，而是维护成本随规模上升得太快。

LLM 恰好适合做这件事。它并不擅长保证真理，但很擅长做高频、低创造性、跨文件的一致性维护。这一点让 wiki 这种古老形态重新活了过来。

所以，LLM Wiki 的意义可以概括为一句话：

**它把知识管理从“存档系统”推进成了“编译系统”。**

存档系统的目标是“别丢”；编译系统的目标是“形成结构”。两者不是一个层级的事情。

## 三、它与 RAG 的真正关系：不是替代，而是把“中间层”做出来

如果只把这件事理解成“Karpathy 反对 RAG”，那也过于粗糙。

Karpathy 其实批评的不是所有 retrieval，而是那种把原始文档切块、嵌入、在查询时临时拼答案的默认范式。他真正强调的是：**对于中等规模、高价值、需要长期累积理解的语料，光有 retrieval 不够，还需要 synthesis layer，也就是综合与结构层。**

这恰好和微软研究院在 2024 年提出 GraphRAG 时指出的问题形成呼应。GraphRAG 的论文 [《From Local to Global》](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/?locale=zh-cn) 认为，传统 RAG 很难回答“整个语料的主要主题是什么”这类全局问题，因为这本质上不是检索任务，而是 query-focused summarization。微软给出的方案，是用 LLM 从原始语料中构建实体图谱和社区摘要，再基于这些结构做回答。

如果把两者并列来看，会发现它们在思想上非常接近：

- GraphRAG 是把原始文本编译为图和社区摘要。
- LLM Wiki 是把原始文本编译为人可读的 markdown wiki。

两者都在做同一件事：**在原始材料和最终问答之间，增加一层“被提前整理过的知识表示”**。

区别只在于：

- GraphRAG 更适合大规模、程序化、图结构显著的企业语料。
- LLM Wiki 更适合个人研究、中型项目、强调可读性和可编辑性的知识工作。

所以更准确的说法不是“LLM Wiki 取代 RAG”，而是：**LLM Wiki 揭示了 RAG 之外另一个长期被低估的方向：先编译知识，再检索知识。**

<video autoplay muted loop playsinline preload="metadata" poster="/uploads/karpathy-llm-wiki-deep-dive/posters/rag-vs-wiki.png" style="width: 100%; border-radius: 16px; margin: 1rem 0 0.5rem 0; background: #f8fafc;">
  <source src="/uploads/karpathy-llm-wiki-deep-dive/videos/rag-vs-wiki.mp4?v=2" type="video/mp4" />
</video>

## 四、Karpathy 的想法为什么在 2026 年这个时间点突然成立

如果把时间往前拨两年，这个思路未必跑得起来。因为早期模型虽然能总结，但很难长时间维持结构一致性，也不太适合跨多个文件持续修订。

它在今天变得可行，至少有三个原因。

### 1. 模型已经足够擅长“文件系统级工作”

Karpathy 的这个模式天然依赖文件读写、跨页更新、结构化输出和增量维护。过去模型擅长生成一段文字，不擅长像程序员一样维护一个文件夹。现在，带工具调用能力的 agent 明显更适合这种工作。

Anthropic 在 2025 年 9 月 29 日的文章 [《Effective context engineering for AI agents》](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 中把这个问题说得很透：上下文是有限资源，长任务下必须依赖 compaction、structured note-taking、sub-agent architecture 等机制，才能让 agent 在多轮、多文件、多阶段任务中维持连贯性。Anthropic 甚至直接把“agentic memory”描述为将信息持久化到上下文窗口之外，再在后续任务中拉回。

LLM Wiki 本质上就是这种 memory externalization 的一个极强形态，只不过它不是临时笔记，而是系统化的知识仓库。

### 2. 大家开始接受“context engineering”比“prompt engineering”更重要

Simon Willison 在 2025 年 6 月 27 日的文章 [《Context engineering》](https://simonwillison.net/2025/Jun/27/context-engineering/) 中引用了 Karpathy 的一句话：工业级 LLM 应用的核心，不是写一句漂亮 prompt，而是在下一步推理前，把“刚刚好的信息”放进上下文窗口。这包括任务说明、示例、RAG、工具、状态、历史和压缩。

这和 LLM Wiki 的底层逻辑完全一致。它其实不是一个笔记法，而是一种 context engineering 基础设施。它做的事情，是把高噪声的 raw 材料，预先转化为高信号的结构化上下文。

换句话说，LLM Wiki 不是在扩展记忆，而是在提高上下文质量。

### 3. 长上下文越来越大，但“上下文腐烂”问题没有消失

更长的窗口没有消灭混乱，反而放大了“信息太多但重点更模糊”的问题。Anthropic 在上述文章里明确指出，context 是有限且会边际递减的资源。更多 token 不自动等于更好结果，反而可能让模型在海量材料中失焦。

这也是为什么 Karpathy 没有选择“把所有文档都塞进超长上下文”，而是选择先整理出一个 wiki。因为在很多复杂任务里，**有组织的 5 万 token，往往比无组织的 50 万 token 更有价值**。

<video autoplay muted loop playsinline preload="metadata" poster="/uploads/karpathy-llm-wiki-deep-dive/posters/compilation-layer.png" style="width: 100%; border-radius: 16px; margin: 1rem 0 0.5rem 0; background: #f8fafc;">
  <source src="/uploads/karpathy-llm-wiki-deep-dive/videos/compilation-layer.mp4?v=2" type="video/mp4" />
</video>

## 五、它最深的启发：知识库第一次真正进入“复利状态”

我觉得 Karpathy 这次最有穿透力的地方，不是技术，而是他对知识工作的重新分工。

在传统知识管理里，人类同时承担四种职责：

1. 收集资料。
2. 判断价值。
3. 形成理解。
4. 做维护与整理。

第四项最耗人，但最不创造价值。它消耗大量意志力，却不直接产生洞见。Karpathy 的设计，相当于把第 4 项大规模自动化了，于是知识工作真正开始进入复利。

复利体现在三个层面：

- 新资料加入后，不只是“多一篇收藏”，而是会改写已有结构。
- 新问题提出后，不只是“得到一个回答”，而是能形成新页面反哺知识库。
- 定期 lint 后，不只是“发现错误”，而是会暴露知识空洞、冲突和待验证命题。

这使得知识库不再是静态仓库，而是一个不断被编译、被重写、被校正的活系统。

<video autoplay muted loop playsinline preload="metadata" poster="/uploads/karpathy-llm-wiki-deep-dive/posters/knowledge-compounding.png" style="width: 100%; border-radius: 16px; margin: 1rem 0 0.5rem 0; background: #f8fafc;">
  <source src="/uploads/karpathy-llm-wiki-deep-dive/videos/knowledge-compounding.mp4?v=2" type="video/mp4" />
</video>

这也解释了为什么 Karpathy 会觉得，自己的 token throughput 正在从“操作代码”转向“操作知识”。因为一旦知识本身变成可维护对象，研究工作的主战场就不再只是写代码，而是构造一个可以长期进化的认知外部器官。

## 六、它的局限在哪里：越强大，越需要治理

当然，LLM Wiki 绝不是“终于解决个人知识管理”的银弹。

恰恰相反，它越有吸引力，越容易把人带入一种危险幻觉：好像只要让模型自动维护知识库，系统就会自然趋向正确。事实并非如此。

我认为它至少有四个核心风险。

### 1. 错误会被“编译”进去

普通聊天中的错误往往随着会话结束而消失；wiki 里的错误则会变成长期资产，反复被后续查询调用。这意味着 hallucination 一旦进入知识库，其危害远大于一次性回答出错。

### 2. 综合会制造“过度确定性”

模型在综合多篇材料时，很容易把本来尚不确定、彼此冲突、证据等级不同的内容，写成一个表面连贯但实际上不够谨慎的结论。这种“合成性失真”在研究型知识库里尤其危险。

### 3. 可维护不等于可审计

markdown 比向量数据库更透明，这是事实。但透明不代表自动可审计。若没有明确的来源引用、更新时间、冲突标记和事实等级，wiki 最终仍可能沦为一堆看似可信的二手改写。

### 4. 个人系统扩展到团队系统时，治理复杂度会陡增

Karpathy 在 gist 里提到 team/business 场景，这确实诱人。但一旦语料来自 Slack、会议记录、客户通话、项目文档，知识不再只是“整理”，而是会碰到权限、版本、责任归属、事实冲突、组织政治等问题。这里就不是一个 prompt 能解决的了。

也正因此，我认为企业级落地最可能的方向不是“纯 LLM Wiki”，而是混合架构：

- 原始材料层继续保留传统文档系统。
- 图谱或索引层处理大规模检索与关系发现。
- wiki 层承载人类可读的综合、结论、争议、决策与叙事。

换句话说，**wiki 更像知识操作系统的可读界面，而不是唯一的数据底座。**

<video autoplay muted loop playsinline preload="metadata" poster="/uploads/karpathy-llm-wiki-deep-dive/posters/governance-risk.png?v=4" style="width: 100%; border-radius: 16px; margin: 1rem 0 0.5rem 0; background: #f8fafc;">
  <source src="/uploads/karpathy-llm-wiki-deep-dive/videos/governance-risk.mp4?v=4" type="video/mp4" />
</video>

## 七、为什么这条路可能比“更大的模型”更重要

Karpathy 的 gist 最让我认同的地方，是它把注意力从“模型本身有多聪明”移到了“系统如何积累聪明”。

过去两年，很多人默认更大的 context window 会自然解决知识问题。但越来越多证据表明，真正的问题不是装不下，而是组织不好。Vannevar Bush 在 1945 年《[As We May Think](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/)》里提出 Memex 时，关心的也不是存储容量，而是如何用“associative trails”组织知识。Karpathy 在 gist 里直接提到 Memex，并指出 Bush 当年没有解决的问题，是谁来承担持续维护的劳动。现在，LLM 恰好填上了这个空位。

所以，LLM Wiki 其实把一个老问题重新推到了前台：

**智能系统的下一阶段竞争力，也许不只是更强的生成能力，而是更强的知识组织能力。**

如果这个判断成立，那么未来真正重要的产品未必只是“万能聊天框”，而是那些能把原始资料、结构化知识、查询、输出和持续校验连接起来的知识编译系统。

## 八、我的判断：LLM Wiki 会成为 AI 时代的重要“中间件”

我对这个方向的最终判断是：

LLM Wiki 不会取代搜索，不会取代数据库，不会取代 RAG，也不会自动取代人的判断。但它很可能会成为一个越来越关键的中间件层。

它的价值在于：

- 把原始信息变成可复用的结构化知识。
- 把一次性问答变成可沉淀的认知资产。
- 把上下文工程从临时拼接推进到长期维护。
- 把“第二大脑”从口号推进到真正可运行的工作流。

如果说 2023 年大家最热衷的是“让 LLM 会检索”，2024 年的关键词是“让 agent 会调用工具”，那么 2026 年一个更深的问题已经浮现出来：**如何让系统拥有一种可持续、可修正、可复利的外部知识结构。**

Karpathy 的 LLM Wiki，正是在回答这个问题。

它真正开启的，不是一个新笔记法，而是一种新范式：从信息检索，走向知识编译；从一次回答，走向持续维护；从“问模型”，走向“与模型共同建设一个会成长的认知系统”。

这条路，值得认真做，而不是只把它当成一个周末的 Obsidian 玩具。

## 参考资料

- Andrej Karpathy, [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), 2026-04-04
- Simon Willison, [Context engineering](https://simonwillison.net/2025/Jun/27/context-engineering/), 2025-06-27
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 2025-09-29
- Microsoft Research, [From Local to Global: A Graph RAG Approach to Query-Focused Summarization](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/?locale=zh-cn), 2024-04
- Vannevar Bush, [As We May Think](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/), 1945-07
