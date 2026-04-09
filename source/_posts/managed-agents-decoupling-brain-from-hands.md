---
title: "Managed Agents 扩展之道：把大脑与双手解耦"
title_en: "Scaling Managed Agents: Decoupling the brain from the hands"
date: 2026-04-09 12:17:00
tags: [AI, Agent, Anthropic, Translate, Architecture]
original_url: https://www.anthropic.com/engineering/managed-agents
author: Anthropic Engineering
---

Anthropic 最近发了篇挺值得细读的工程文章，主题不是“怎么再堆一个更花哨的 agent 框架”，而是更底层的问题：**当模型能力不断变化时，什么样的 agent 系统接口能活得更久？**

这篇文章的核心结论可以浓缩成一句话：**不要把 Claude 的“大脑”与执行动作的“双手”绑死在一起。** 把 harness、session、sandbox 都拆成稳定接口，才能既提升可靠性、性能和安全性，又避免随着模型进步不断背着历史包袱前行。

> Get started with Claude Managed Agents by following our [docs](https://docs.anthropic.com/).
>
>*【以上为产品引导文案，保留原文链接】*

## 文章主旨

Anthropic 过去一直在研究如何构建高效 agent，以及如何为长时间运行的任务设计 harness。问题在于，**harness 本身总是隐含着一堆对模型能力的假设**，而这些假设会随着模型升级迅速过期。

他们举了一个很具体的例子：在之前的工作里，他们发现 Claude Sonnet 4.5 在接近上下文上限时，会提前收尾任务，也就是所谓的“context anxiety（上下文焦虑）”。为了解决这个问题，他们在 harness 中加入了 context reset。但当同样的 harness 用到 Claude Opus 4.5 时，这个问题已经消失了，于是当初那套 reset 逻辑反而变成了多余负担。

这就引出了 Managed Agents 的设计目标：**不是为今天这套实现打造一个特化框架，而是抽象出一组尽量能跨未来实现继续成立的接口。**

Anthropic 把这个问题类比为经典操作系统设计中的“为尚未被想到的程序设计系统”。操作系统能跨越数十年硬件演进，靠的不是预判未来所有设备，而是把底层硬件抽象成稳定接口，比如 process、file、`read()` 这样的原语。Managed Agents 也试图做类似的事。

## Managed Agents 抽象了什么

Anthropic 把 agent 系统拆成了三个核心组成部分：

- **session**：一份 append-only 的事件日志，记录会话中发生的一切
- **harness**：负责调用 Claude，并把 Claude 的 tool call 路由到对应基础设施的循环控制层
- **sandbox**：Claude 可以运行代码、编辑文件的执行环境

关键在于，这三者不是糅在一起的，而是通过稳定接口连接。也就是说：

- session 可以独立持久化
- harness 可以崩溃后重启
- sandbox 可以按需新建、销毁、替换

Anthropic 在文中说得很直白：他们对**接口形状**是有明确主张的，但对接口背后具体跑什么并不执着。

![Managed Agents 架构抽象示意图](/uploads/managed-agents-decoupling-brain-from-hands/001_image.png)

## 别把系统养成“宠物”

文章里我很喜欢的一节标题叫：**Don’t adopt a pet**。

他们一开始把所有 agent 组件都塞进一个容器里：session、harness、sandbox 共用同一个环境。这样做最初确实有好处——比如文件编辑就是直接 syscall，不需要设计跨服务边界。

但问题很快就出现了。

因为所有东西绑在一个容器里，这个容器就从“可替换的 cattle（牲口）”变成了“必须精心照料的 pet（宠物）”：

- 容器挂了，会话就丢了
- 容器卡住了，只能人工进去抢救
- 通过 WebSocket 事件流只能知道“坏了”，却不知道坏在 harness、网络还是容器本身
- 真要排查问题，还得进容器开 shell，而容器里往往又放着用户数据，几乎失去可调试性

更麻烦的是，harness 还默认 Claude 要操作的东西就和它住在同一个容器里。于是当客户希望 Claude 连接到他们自己的 VPC 资源时，就必须要么和 Anthropic 网络互联，要么把 Anthropic 的 harness 跑进自己的环境里。**一个写死在 harness 里的基础假设，直接变成了产品扩展能力的阻力。**

## 把大脑和双手拆开

Anthropic 最终采用的方案，是把他们所说的“brain（Claude + harness）”从“hands（sandbox 和 tools）”以及“session（事件日志）”中解耦出来。

拆开之后，每一部分都变成了低耦合接口：

- 脑负责思考和决策
- 手负责执行
- session 负责记忆与可恢复状态

### 1. harness 退出容器

解耦后的一个直接结果是：**harness 不再住在容器里。**

它把容器当作普通工具一样调用：

```text
execute(name, input) → string
```

这样一来，容器就变成了可以随时替换的 cattle。容器挂了，harness 只会收到一次 tool-call error；如果 Claude 判断值得重试，就可以重新按标准流程拉起一个新容器：

```text
provision({resources})
```

以前那种“得把坏容器当重症病人慢慢抢救”的局面就没了。

### 2. harness 本身也可以变成 cattle

session 被单独放出来后，harness 崩掉也不再致命。

新的 harness 起来之后，只要：

```text
wake(sessionId)
getSession(id)
emitEvent(id, event)
```

就能重新获取事件日志，从最后一个事件继续执行。

也就是说，**harness 不需要自己持有必须跨故障存活的状态**。这是一种非常典型、也非常成熟的分层思路：状态外移，执行层无状态化。

![将大脑、session 与 hands 解耦后的恢复路径示意](/uploads/managed-agents-decoupling-brain-from-hands/002_image.png)

## 真正的安全边界在哪里

这篇文章另一个非常重要的点，是它把安全问题说得很“结构化”，而不是停留在“把 token scope 缩小一点”这种战术补丁层面。

在原本耦合的设计里，Claude 生成的不受信代码和凭证生活在同一个容器里。于是 prompt injection 只需要诱导 Claude 去读取自己的环境变量，就可能把 token 拿到手。一旦攻击者拿到这些 token，就能发起新的 unrestricted session，把权限进一步放大。

Anthropic 认为，仅仅做 narrow scoping 不是根本解决方案，因为那依然基于一种假设：**“Claude 拿到受限 token 后做不了太多事。”** 但随着模型越来越强，这个假设本身不稳。

他们采用的结构性修复是：**让 token 永远不可从 sandbox 触达。**

文中提到两种做法：

1. **资源绑定认证**：比如 Git 仓库的访问 token 在 sandbox 初始化时用于 clone，并被接入本地 git remote，这样 agent 可以在 sandbox 里直接 `push` / `pull`，但从来不需要亲手看到 token。
2. **外部凭证金库 + MCP 代理**：OAuth token 存在 sandbox 外部的 secure vault 中，Claude 调用 MCP tool 时，走一个专门代理；代理根据 session 关联 token 去 vault 里取真正凭证，再帮它访问外部服务。整个过程中 harness 也看不到实际凭证。

这个设计思路很值得记：**别去赌模型“不会想到攻击方式”，而是从结构上让敏感信息根本不在它能碰到的位置。**

![session 作为上下文窗口外可恢复对象的示意图](/uploads/managed-agents-decoupling-brain-from-hands/003_image.png)

## session 不是 Claude 的上下文窗口

Long-horizon 任务天然会超过模型的上下文窗口，所以问题就来了：到底保留哪些上下文、丢弃哪些上下文？

Anthropic 说，常见处理方式——比如 compaction、memory tool、context trimming——本质上都在做一些**不可逆**的取舍。你今天删掉的 token，可能正是未来下一步真正需要的东西。

他们因此把 **session** 定义成一种**存在于上下文窗口之外的“可恢复上下文对象”**。

在 Managed Agents 里：

- Claude 当前真正看到的，只是 harness 从 session 中取回并整理后的一部分上下文
- 而完整上下文则以事件日志的形式持久保留在 session 里

对应接口大致像这样：

```text
getEvents()
```

这样，brain 可以：

- 从上次读到的位置继续往后读
- 回溯到某个动作发生前的几条事件
- 在执行某一步前重新审视前因后果

然后 harness 还可以自由地把取回的 events 重新组织、压缩、裁剪、排序，以服务缓存命中率或其他 context engineering 策略。

这里 Anthropic 强调了一点：**他们把“可恢复的上下文存储”与“任意形式的上下文管理”拆开了。**

- session 只保证上下文可持久、可查询
- harness 负责今天这代模型需要的上下文工程技巧

为什么要这样分？因为没有人知道未来模型到底还需要什么形式的上下文工程。既然预判不了，那就别把这些策略写死在底层存储抽象里。

## Many brains, many hands

这部分其实是在回答 Managed Agents 的横向扩展能力。

### Many brains

过去把 brain 放进容器意味着：**多少个 brain，就要提前准备多少个容器**。

结果是每个 session 一上来都要先承担整套容器初始化成本：

- clone repo
- 启动进程
- 拉取 pending events
- 做一堆可能根本暂时用不上的准备动作

这部分死时间直接体现在 **TTFT（time-to-first-token）** 上，也就是用户最能感知的首 token 延迟。

解耦之后，brain 只有在真的需要 hands 时，才通过 tool call 去 provision 容器。于是：

- 不需要 sandbox 的 session，不用等容器
- orchestration 层只要拿到 session log，就能先开始 inference

Anthropic 给出的结果很夸张：

- p50 TTFT 下降约 **60%**
- p95 TTFT 下降超过 **90%**

这说明他们不是只在谈架构优雅，而是真拿到了非常具体的性能收益。

### Many hands

另一个目标，是让同一个 brain 能够连到多只 hands。

从模型角度看，这其实是在要求 Claude 学会在多个执行环境之间做路由与决策：

- 这个任务送给哪个 sandbox？
- 哪个工具最合适？
- 哪部分状态应该留在哪个执行面？

早期模型做不到，所以他们最初把一切都塞进单容器里。后来随着模型智能提升，单容器反而变成瓶颈：只要容器挂了，brain 正在触达的所有 hands 的状态都会一起受损。

解耦之后，每只 hand 都只表现为统一的工具接口：

```text
execute(name, input) → string
```

于是 hand 可以是：

- 一个容器
- 一个 MCP server
- 一部手机
- 甚至一个 Pokémon 模拟器

而 harness 不必关心它到底是什么。更进一步，因为 hand 不再绑定到单个 brain，不同 brain 之间甚至还能互相传递 hands。

这点其实非常有意思：**Anthropic 不是在构建“一个很强的 agent”，而是在构建一种让 agent 组件自由编排的基础设施层。**

![Many brains, many hands 的扩展模型示意](/uploads/managed-agents-decoupling-brain-from-hands/004_image.png)

## 结论：为未来还没出现的 harness 预留空间

Anthropic 在结尾把 Managed Agents 定义成一种 **meta-harness**。

也就是说，它本身并不执着于某一种具体 harness，而是提供足够一般化的接口，让未来不同风格的 harness 都能接上来。文中也明确提到：

- Claude Code 是他们广泛使用的一种优秀 harness
- task-specific agent harness 在某些窄领域也很强
- Managed Agents 应该能同时容纳这些不同风格

换句话说，他们的目标不是定义“正确的 agent 工作方式”，而是定义**一组能让未来 agent 工作方式自由演进的底座接口**。

这篇文章最值得带走的，不是几个 API 名字，而是它背后的架构判断：

1. **把会过期的模型行为假设，从底层抽象中拿出去**
2. **把状态与执行解耦，让故障恢复更廉价**
3. **把敏感凭证从模型可执行环境中彻底隔离**
4. **把上下文存储与上下文工程分层，给未来模型保留余地**
5. **用统一接口接住 many brains / many hands 的扩展需求**

如果你最近也在做 agent infra，这篇文章很值得认真看。它不炫技，反而很克制——但正因为克制，里面很多判断都很像那种能活很多年的基础设施思路。

## 原文信息

- 原文标题：Scaling Managed Agents: Decoupling the brain from the hands
- 作者：Anthropic Engineering
- 原文链接：<https://www.anthropic.com/engineering/managed-agents>
