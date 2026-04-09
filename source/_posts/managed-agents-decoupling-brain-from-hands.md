---
title: "扩展 Managed Agents：将大脑与双手解耦"
title_en: "Scaling Managed Agents: Decoupling the brain from the hands"
date: 2026-04-10 01:15:00
tags: [AI, Agent, Anthropic, Translate, Architecture]
original_url: https://www.anthropic.com/engineering/managed-agents
author: Anthropic Engineering
---

# 扩展 Managed Agents：将大脑与双手解耦

> 原文标题：Scaling Managed Agents: Decoupling the brain from the hands  
> 作者：Lance Martin、Gabe Cemaj、Michael Cohen（Anthropic Engineering）  
> 原文链接：<https://www.anthropic.com/engineering/managed-agents>

工程博客里一个持续讨论的话题，是如何[构建高效的 agent](https://www.anthropic.com/engineering/building-effective-agents)，以及如何为[长时间运行的工作](https://www.anthropic.com/engineering/harness-design-long-running-apps)[设计 harness](https://www.staging.ant.dev/engineering/effective-harnesses-for-long-running-agents)。贯穿这些工作的一个共同线索是，harness 会把一些关于 Claude 自身做不到什么的假设编码进去。不过，随着模型不断进步，这些假设可能会[逐渐失效](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)，因此必须被频繁重新审视。

仅举一个例子：在之前的工作中，[我们发现](https://www.anthropic.com/engineering/harness-design-long-running-apps) Claude Sonnet 4.5 会在感知到自己的上下文限制将近时过早结束任务——这种行为有时被称为“context anxiety（上下文焦虑）”。我们通过在 harness 中加入 context reset 解决了这个问题。但当我们把同样的 harness 用在 Claude Opus 4.5 上时，却发现这种行为已经消失了。那些 reset 反而成了累赘。

我们预计 harness 还会继续演化。因此，我们构建了 Managed Agents：这是 Claude Platform 上的一项托管服务，通过一组旨在比任何特定实现都活得更久的小型接口，代表你运行长周期 agent——包括我们今天自己运行的那些实现。

构建 Managed Agents，意味着要解决计算领域的一个老问题：如何为“[尚未被想到的程序](http://www.catb.org/esr/writings/taoup/html/ch03s01.html)”设计系统。几十年前，操作系统通过把硬件虚拟化为抽象概念——*process、file*——解决了这个问题；这些抽象足够通用，能够支撑当时尚不存在的程序。抽象比硬件本身活得更久。`read()` 命令并不在乎它访问的是 1970 年代的磁盘设备，还是现代 SSD。上层抽象保持稳定，而下层实现可以自由变化。

Managed Agents 也遵循同样的模式。我们把 agent 的组成部分做了虚拟化：session（记录所有已发生事件的追加式日志）、harness（调用 Claude 并将 Claude 的工具调用路由到相关基础设施的循环）、以及 sandbox（Claude 可在其中运行代码和编辑文件的执行环境）。这样一来，每一部分的实现都可以在不影响其他部分的情况下被替换。我们对这些接口的形状有明确主张，但并不执着于其背后具体运行什么。

![](/uploads/managed-agents-decoupling-brain-from-hands/001_image.png)

## 不要养一只宠物

起初，我们把所有 agent 组件都放进同一个容器里，这意味着 session、agent harness 和 sandbox 共用一个环境。这样做有一些好处，例如文件编辑是直接的系统调用，而且不需要设计服务边界。

但把所有东西耦合进一个容器后，我们遇到了一个经典的基础设施问题：我们养出了一只[*宠物*](https://cloudscaling.com/blog/cloud-computing/the-history-of-pets-vs-cattle/)。在 pets-vs-cattle 的比喻里，宠物是一个有名字、需要手工照料、你承受不起失去它的个体；而 cattle 则是可互换的。在我们的场景里，服务器就成了那只宠物：如果容器故障，session 就会丢失；如果容器没有响应，我们就不得不把它慢慢“救活”。

照料容器，意味着要调试那些卡住且无响应的 session。我们唯一能看到的窗口是 WebSocket 事件流，但它无法告诉我们故障究竟出在哪里，这意味着 harness 的 bug、事件流中的丢包，或是容器离线，表现出来都一样。要弄清问题到底是什么，工程师必须进入容器打开 shell；但因为容器里通常也持有用户数据，这种做法实际上意味着我们几乎没有可调试能力。

第二个问题是，harness 默认认为 Claude 所操作的任何东西都与它一起生活在容器里。当客户要求我们把 Claude 连接到他们自己的虚拟私有云时，他们要么得把自己的网络和我们的网络打通，要么就得把我们的 harness 运行在他们自己的环境里。一个被写死在 harness 里的假设，在我们想把它连接到不同基础设施时，变成了问题。

## 将大脑与双手解耦

我们最终采用的解决方案，是把我们所说的“大脑”（Claude 及其 harness）与“双手”（执行动作的 sandbox 和工具）以及“session”（session 事件日志）解耦。每一部分都成了一个对其他部分假设很少的接口，而且每一部分都可以独立失败、独立被替换。

**Harness 离开容器。**将大脑与双手解耦，意味着 harness 不再住在容器内部。它像调用其他任何工具一样调用容器：`execute(name, input) → string`。容器因此成了 cattle。如果容器挂掉，harness 会把该故障作为一次 tool-call error 捕获下来，并回传给 Claude。如果 Claude 决定重试，就可以通过一套标准配方重新初始化一个新容器：`provision({resources})`。我们再也不需要把故障容器像重症病人一样照料回健康状态。

**从 harness 故障中恢复。**Harness 本身也成了 cattle。由于 session log 位于 harness 之外，harness 中没有任何东西必须在崩溃后继续存活。当某个 harness 失败时，一个新的 harness 可以通过 `wake(sessionId)` 重启，再用 `getSession(id)` 取回事件日志，并从最后一个事件继续恢复执行。在 agent loop 期间，harness 会通过 `emitEvent(id, event)` 向 session 写入内容，以保持一份持久的事件记录。

![](/uploads/managed-agents-decoupling-brain-from-hands/002_image.png)

**安全边界。**在原先耦合的设计中，Claude 生成的任何不受信任代码，都会与凭证一起运行在同一个容器里——因此，一次 prompt injection 只需要说服 Claude 去读取自己的环境即可。一旦攻击者拿到这些 token，他们就能新建不受限制的 session，并把工作委派给它们。缩小 token scope 显然是一种缓解方式，但这等于把一种关于 Claude 无法拿受限 token 做什么的假设编码了进去——而 Claude 正在变得越来越聪明。真正的结构性修复方式，是确保这些 token 永远无法从运行 Claude 生成代码的 sandbox 中被访问到。

为此我们使用了两种模式。认证信息要么与资源绑定在一起，要么保存在 sandbox 之外的 vault 中。对于 Git，我们在 sandbox 初始化期间用每个仓库自己的访问 token 去 clone 仓库，并把它接入本地 git remote。这样一来，Git `push` 和 `pull` 可以在 sandbox 内部工作，而 agent 自身从不需要接触 token。对于自定义工具，我们支持 MCP，并将 OAuth token 存储在安全 vault 中。Claude 通过专用代理调用 MCP 工具；这个代理接收一个与 session 关联的 token。随后代理可以从 vault 中取出对应的凭证，并代替它调用外部服务。Harness 永远不会知道任何实际凭证。

## Session 不是 Claude 的上下文窗口

长周期任务经常会超出 Claude 上下文窗口的长度，而解决这个问题的标准方法，都涉及对保留什么内容做出不可逆的决策。我们在之前关于 context engineering 的[相关工作](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)中探索过这些技术。例如，compaction 允许 Claude 保存其上下文窗口的摘要，memory tool 则允许 Claude 将上下文写入文件，从而实现跨 session 学习。这些方法还可以与 context trimming 搭配使用，后者会有选择地移除旧工具结果或 thinking block 等 token。

但这种对上下文进行选择性保留或丢弃的不可逆决策，可能会导致失败。很难知道未来的轮次究竟会需要哪些 token。如果消息经过 compaction 步骤被转换，harness 就会把被压缩的消息从 Claude 的上下文窗口里移除；而这些消息只有在被额外存储的情况下才可恢复。之前的工作[已经探索过](https://arxiv.org/pdf/2512.24601)如何通过把上下文存储为一个生活在*上下文窗口之外*的对象来解决这个问题。例如，上下文可以是 REPL 中的一个对象，LLM 通过编写代码去筛选或切片这个对象，以编程方式访问它。

![](/uploads/managed-agents-decoupling-brain-from-hands/003_image.png)

在 Managed Agents 中，session 也提供了同样的好处：它作为一个生活在 Claude 上下文窗口之外的上下文对象存在。但与其把它保存在 sandbox 或 REPL 内部，不如把上下文持久地存储在 session log 中。接口 `getEvents()` 允许大脑通过选取事件流中的位置切片来查询上下文。这个接口可以被灵活使用：大脑可以从上次停止读取的地方继续，也可以在某个特定时刻之前回退几条事件以查看前因，还可以在执行某个动作之前重新读取上下文。

任何被取回的事件，也都可以在传给 Claude 的上下文窗口之前，先在 harness 中被转换。这些转换可以是 harness 所编码的任何内容，包括为了获得更高 prompt cache 命中率而进行的上下文组织，以及 context engineering。我们之所以把 session 中的可恢复上下文存储，与 harness 中任意形式的上下文管理分开，是因为我们无法预测未来模型究竟需要怎样的 context engineering。我们的接口把这些上下文管理工作推到 harness 中，只保证 session 是持久的，而且可以被查询。

## Many brains, many hands

**Many brains。**将大脑与双手解耦，解决了客户最早提出的一项抱怨。当团队希望 Claude 访问其自有 VPC 中的资源时，过去唯一的办法是把他们的网络与我们的网络打通，因为那个承载 harness 的容器默认假设所有资源都在它身边。Harness 不再位于容器内之后，这个假设就消失了。同样的变化还带来了性能收益。最初我们把大脑放进容器里时，这意味着有多少个大脑，就需要多少个容器。对于每个大脑来说，只有等那个容器准备完毕后，推理才能开始；每个 session 都要预先承担完整的容器初始化成本。每个 session——甚至那些永远不会真正接触 sandbox 的 session——都必须先 clone 仓库、启动进程、从我们的服务器拉取待处理事件。

这段纯粹的等待时间，会体现在首 token 时间（time-to-first-token，TTFT）中，它衡量的是 session 从接收工作到产出第一个响应 token 之间等待了多久。TTFT 是用户感受最明显的一种延迟。

将大脑与双手解耦后，容器只有在真的需要时，才会由大脑通过一次工具调用 `(execute(name, input) → string)` 来创建。因此，一个不需要立刻用到容器的 session，就不必先等待容器。只要 orchestration layer 从 session log 中拉取到待处理事件，推理就可以立即开始。借助这套架构，我们的 p50 TTFT 大约下降了 60%，p95 则下降了 90% 以上。扩展到 many brains，只意味着启动许多个无状态 harness，并且仅在需要时才把它们连接到 hands。

**Many hands。**我们还希望每个大脑都能连接到 many hands。实际而言，这意味着 Claude 必须能对多个执行环境进行推理，并决定把工作发往哪里——这比只在单一 shell 中操作，是更困难的认知任务。我们最初把大脑放进单个容器中，是因为早期模型还做不到这一点。随着智能水平提升，单容器反而成了限制：一旦那个容器失败，我们就会失去大脑正在伸入其中的每一只手的状态。

将大脑与双手解耦，使得每一只 hand 都变成一个工具：`execute(name, input) → string`。输入一个名称和输入参数，返回一个字符串。这个接口支持任意自定义工具、任意 MCP server，以及我们自己的工具。Harness 并不知道 sandbox 究竟是一个容器、一部手机，还是一个 Pokémon 模拟器。而且因为任何 hand 都不再耦合到某个特定 brain，不同 brain 之间还可以互相传递 hands。

![](/uploads/managed-agents-decoupling-brain-from-hands/004_image.png)

## 结论

我们面对的挑战是一个古老的问题：如何为“尚未被想到的程序”设计系统。操作系统之所以能延续数十年，是因为它们把硬件虚拟化成了足够通用的抽象，能够容纳当时还不存在的程序。借助 Managed Agents，我们的目标是设计一套系统，使其能够容纳未来围绕 Claude 出现的 harness、sandbox 或其他组件。

本着同样的精神，Managed Agents 是一个 meta-harness：它并不对未来 Claude 所需要的*具体* harness 持有预设立场。相反，它是一套具有通用接口的系统，允许许多不同的 harness 并存。例如，Claude Code 就是一种优秀的 harness，我们在许多任务中都广泛使用它。我们也已经展示过，任务特定的 agent harness 在狭窄领域中表现出色。Managed Agents 可以容纳其中任何一种，并随着时间推移匹配 Claude 的智能水平。

Meta-harness 设计意味着，我们对 Claude 周边接口持有明确主张：我们预计 Claude 需要操纵状态（session）的能力，也需要执行计算（sandbox）的能力。我们同样预计 Claude 还需要扩展到 many brains 和 many hands 的能力。我们设计这些接口，是为了让这些能力能够在长时间尺度上以可靠且安全的方式运行。但我们并不对 Claude 所需要的大脑和双手的数量或位置做任何假设。

## 致谢

本文由 Lance Martin、Gabe Cemaj 和 Michael Cohen 撰写。特别感谢 Agents API 团队以及 Jake Eaton 的贡献。
