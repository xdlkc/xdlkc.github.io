---
title: "如何构建知识工厂"
date: "2026-11-22 00:40:42"
updated: "2026-11-22 00:40:42"
permalink: 2026/11/22/how-to-build-a-knowledge-factory/
description: "中文翻译。原作者 Harrison Chase。原文：https://x.com/hwchase17/status/2124181216719151585"
tags:
  - 中文翻译
  - Harrison Chase
  - Agent
categories:
  - 翻译
---

中文翻译｜原作者 [Harrison Chase](https://x.com/hwchase17)

原文：<https://x.com/hwchase17/status/2124181216719151585>

![如何构建知识工厂](/uploads/how-to-build-a-knowledge-factory/00-cover-HXqar2DbsAAs_XI-zh.png)

> 我们在 LangChain 的所有 Agent（内部 GTM 和内容 Agent、LangSmith Engine）都有一个包含相似组件的学习闭环
>
> 写了一篇文章，分享我们认为构成“知识工厂”的要素 https://x.com/i/article/2124180107669766144

要让 AI 在你的公司真正发挥作用，缺少的并不是更好的模型，也不仅仅是更多的[上下文](https://www.langchain.com/blog/context-engineering-for-agents)——而是更好的知识。这些知识关乎你的公司如何运作、你制定了哪些运营标准、数据存储在哪里以及如何访问这些数据。

你最高效的员工脑子里都装着这些知识。他们知道该找谁沟通、去哪里寻找问题的答案、以及为什么你们会以特定方式做事。这些知识往往是默会的、隐性的、零散的——有时只存在于他们的脑海中，有时则分散在各种各样的文档里。

要让 AI 为你的公司所用，你需要收集、整理并维护这些知识的某种表征形式，以便传递给 Agent。帮助你完成这一过程的系统，就是我们所说的“知识工厂”。

我们在 LangChain 通过几种方式构建了这种系统。我们内部的 [GTM](https://www.langchain.com/blog/how-we-built-langchains-gtm-agent) 和[内容工作室](https://www.langchain.com/blog/design-agent) Agent 都由知识工厂驱动。[LangSmith Engine](https://www.langchain.com/langsmith/engine)（我们用于分析运行轨迹并提出修复建议的 Agent）也会为每个 Agent 维护一个知识工厂。这篇文章将分享我们的经验与心得。

## 上下文与知识

上下文是 Agent 在执行任务时手头可用的信息。

知识则是我们持续维护的、可复用的理解，用来确保 Agent 能够正确完成任务：某个指标代表什么含义、应该信任哪个数据源，或者我们如何处理特定情况。这些知识有时被记录了下来，但更多时候并没有。

知识工厂将零散的文档和经验转化为知识，使之成为未来工作的上下文。

因此，知识是 Agent 将获得的上下文的一种形式，但它通常不是（也不应该是）Agent 获得的唯一上下文。其他类型的上下文你原本就已经可靠地采集/存储好了，可以直接提供给 Agent（详见下文关于快速变化数据的部分）。

## 从软件工厂到知识工厂

过去一年半里，“软件工厂”的理念迅速兴起。其核心思想是：与其让你最优秀的工程师亲自编写软件，不如让他们构建工厂（即各种系统），帮助公司里的每一个人更高效地构建软件。而实际的软件开发工作可以交给 Agent 来完成。

通用知识工作现在也正在沿着类似的轨迹发展。Agent 如今已经足够强大，能够制作演示文稿、发布视频、开展外呼拓客（outbound）。你应该尽可能多地利用它们来承担这些任务。但要让它们完成这些任务，它们就需要掌握所有那些默会的、隐性的、零散的知识。

这正是你应该投入资源的地方。你需要构建这些知识，更重要的是，构建一个用于收集、整理和维护这些知识的工厂。只有这样，你才能把更多通用知识工作交给 Agent 来完成。

## 知识的组成部分

通常来说，你需要维护以下几类知识。

- **如何完成工作——技能（Skills）。** 按照公司期望的方式完成任务的流程、指令和脚本。
- **业务如何运作——领域知识。** 关于你的产品、客户、竞争对手和组织的定义、政策与事实。
- **从哪里获取最新信息——数据访问指南。** 应该使用哪些数据源、哪些数据存储在哪里以及如何查询。

![技能、领域知识与数据访问指南](/uploads/how-to-build-a-knowledge-factory/01-HXqawXSbYAABTuC-zh.png)

**技能（Skills）**：这些是在公司内部“正确”做事的流程，即关于如何按照公司特定要求完成任务的指令和脚本。很多时候，这些内容以前从未被写下来（而是由同事之间口口相传）。你应该努力将它们记录下来。

**领域知识**：这类知识不会频繁过时，通常是关于人员、产品和竞争对手的核心信息。这些信息往往已经写成了文档——但仅仅因为知识量过于庞大，通常并不完整（甚至存在错误）。

**数据访问指南**：你应该具备良好的数据战略（如 Snowflake、Databricks 等），这是打造实用 Agent 的基础。如果数据的唯一可信来源（source of truth）已经在那里，并且完整、及时更新——那就没有必要再去维护一份单独的副本。相反，你需要新维护的内容是清晰的说明，明确指出什么数据存放在哪里以及如何查询。

## **工厂的组成部分**

要让 Agent 真正有用，所有这些信息都不可或缺。不要试图手动维护它们——那是一项极其艰巨的工程。相反，你应该建立一套系统来维护这些知识。通常来说，这套系统包含以下几个部分：

![执行工作的 Agent、整理 Agent 与知识存储](/uploads/how-to-build-a-knowledge-factory/02-HXqazU-bIAAhZzt-zh.png)

**让 Agent 标记缺失知识的机制**：了解缺失了哪些知识的最佳方法之一，就是让 Agent 在工作过程中直接将其标记出来。如果它们被要求做某件事，却找不到相关信息，或者发现查到的信息是错误的——它们就应该将其标记出来！给 Agent 提供一个工具，至少能够报告哪里出了问题，还可以选择性地提出正确的更新建议。

**整理 Agent（Curator Agent）：用于更新、整理和维护这些知识的 Agent**：这些知识不应该靠人工保持更新——工作量太大了。也不应该完全交由使用这些知识的 Agent 来更新——它们非常擅长标记哪些内容有误或缺失，但要修复这些问题，需要对底层知识和其他数据源有深入的理解。要求那些主要专注于完成自身目标的 Agent 去妥善更新和维护这些知识，只会导致知识库变得杂乱无章、矛盾百出。相反，你需要一个整理 Agent，在后台[按一定周期](https://docs.langchain.com/langsmith/python/managed-deep-agents-schedules)运行，专门负责更新这些知识。它应该能够访问所有可能散落着这些知识的原始数据源（如 Notion、Slack 等）；它应该能够访问 [Agent 运行轨迹](https://www.langchain.com/langsmith/observability)，从而了解人们正试图如何使用 Agent，并将其沉淀为技能；它还应该能够获取 Agent 标记出的错误内容（即上一节提到的内容）。

**知识的存储**：从某种角度来说，这反而是最不重要的部分。你可以将这些知识以 [Skill 格式](https://docs.langchain.com/oss/python/deepagents/skills)存储在 GitHub 中，也可以存放在 Notion 的单个文件里，或者以 [OKF 格式](https://github.com/open-knowledge-format/open-knowledge-format)存储在 [LangSmith Context Hub](https://www.langchain.com/blog/introducing-context-hub) 中，抑或是存放在 Neo4j 的知识图谱里。整理 Agent 应该知道如何与所有这些格式进行交互（这并不难）。但从另一方面来看，这也是目前探索最少的领域：你该如何表征[记忆](https://www.langchain.com/blog/how-to-give-your-agent-memory)？作为整个行业，我们已经就用技能来表示“程序性记忆（procedural memory）”达成了共识。而对于更具语义性的记忆（semantic memory），未来很可能会出现另一种标准（会是 OKF 吗？）。目前还处于早期阶段，尚未形成统一标准——因此最好不要对这种格式做出过于死板的规定，也不要将其过度复杂化。

## 将所有部分串联起来

最后，我们用一个 Agent 准备营收报告的端到端示例来收尾。

首先，Agent 需要一些基础上下文：存储在 BigQuery 和 Salesforce 中的原始营收数据。

其次是知识。它可能包含几种不同的类型：

- 技能（Skills）：如何以 LangChain 的风格创建报告。这些内容以标准的 Skill 格式存储在 GitHub 中。
- 长期知识：我们计算 ARR 的方法。这些内容存储在公司 Wiki 中。
- 如何访问快速变化的知识：如何访问 BigQuery/Salesforce 中的原始数据。这些同样作为技能存储，只不过这一次是存储在 Context Hub 中。

Agent 开始运行。它可能会注意到我们在 BigQuery 中重命名了某一列，于是当场找出了正确的列名，并使用自己的问题上报工具将其标记出来，同时建议更新为正确的列名。

生成报告后，我们的财务负责人与 Agent 实时协作，修复了几处格式问题，其中包括告诉它现在所有 LangChain 文档都需要使用一个新的页眉。

当天晚上，整理 Agent 看到了被标记的问题。它还检查了该 Agent 的运行轨迹，注意到了它与财务负责人之间的这番来回沟通。于是，它相应地更新了相关技能（在获取数据时使用新列名，在起草报告时使用新页眉）。

![营收报告从标记到技能更新](/uploads/how-to-build-a-knowledge-factory/03-HXqa3cWbMAAyfJO-zh.png)

## 总结

目标并不是在 Agent 开始工作之前就把所有事情都写成文档，而是构建这样一个系统：在执行工作的过程中暴露出缺失的知识，而填补这些空白又会让未来的工作做得更好。从一个高频重复的工作流入手，观察 Agent 在哪里遇到了困难，然后把那个闭环跑通。

我们已经[在 LangChain 构建了这套体系](https://www.langchain.com/blog/components-building-company-harness)，目前也正在与一些客户合作，将其引入他们的（内部及外部）Agent 中。如果你对此感兴趣——请[联系我们](https://www.langchain.com/contact-sales)，我们可以提供帮助！
