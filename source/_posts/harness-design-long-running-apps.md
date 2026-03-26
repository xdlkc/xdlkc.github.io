---
title: "长运行应用开发的 Harness 设计"
title_en: "Harness design for long-running application development"
date: 2026-03-24
source_file: blogs/anthropic/raw/harness-design-long-running-apps.md
translated_by: AI (OpenClaw Subagent)
---

*由我们的 [Labs](https://www.anthropic.com/news/introducing-anthropic-labs) 团队成员 Prithvi Rajasekaran 撰写。*

在过去的几个月里，我一直致力于解决两个相互关联的问题：让 Claude 生成高质量的前端设计，以及让它在没有人类干预的情况下构建完整的应用程序。这项工作源于我们早期在 [frontend design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) 和 [long-running coding agent harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 上的努力，在那里，我和我的同事们能够通过 prompt engineering 和 harness 设计将 Claude 的性能提升到远高于基线的水平——但这两种方法最终都遇到了瓶颈。

为了取得突破，我寻找了适用于两个截然不同领域的新颖 AI 工程方法：一个由主观品味定义，另一个由可验证的正确性和可用性定义。从[生成对抗网络 (GANs)](https://en.wikipedia.org/wiki/Generative_adversarial_network) 中汲取灵感，我设计了一个包含**生成器 (generator)**和**评估器 (evaluator)** agent 的多 agent 结构。构建一个能够可靠且有品味地对输出进行评分的评估器，意味着首先要开发一套标准，将“这个设计好吗？”等主观判断转化为具体的、可评分的条款。

然后，我将这些技术应用于长运行的自主编码，并借鉴了我们早期 harness 工作的两条经验：将构建分解为易于处理的块，以及使用结构化的工件在会话之间传递上下文。最终的结果是一个三 agent 架构——规划器 (planner)、生成器 (generator) 和评估器 (evaluator)——它能够在长达数小时的自主编码会话中生成丰富的全栈应用程序。

## 为什么朴素的实现会达不到要求

我们之前已经证明，harness 设计对长运行 agent 编码的有效性有着重大影响。在早期的[实验](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)中，我们使用了一个初始化 agent 将产品规格分解为任务列表，以及一个编码 agent，它一次实现一个功能的任务，然后在会话之间移交工件以携带上下文。更广泛的开发者社区也得出了类似的见解，例如“[Ralph Wiggum](https://ghuntley.com/ralph/)”方法使用钩子或脚本来让 agent 保持在连续的迭代周期中。

但是有些问题依然存在。对于更复杂的任务，随着时间的推移，agent 仍然容易偏离正轨。在分解这个问题时，我们观察到了 agent 在执行这类任务时的两种常见故障模式。

首先，随着上下文窗口的填满，模型在冗长任务上往往会失去连贯性（参见我们关于 [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 的文章）。一些模型还会表现出“上下文焦虑 (context anxiety)”，即当它们接近自己认为的上下文限制时，就开始过早地结束工作。上下文重置（完全清除上下文窗口并启动一个全新的 agent，结合携带前一个 agent 状态和后续步骤的结构化移交）解决了这两个问题。

这与压缩 (compaction) 不同，在压缩中，对话的早期部分会被就地总结，以便同一个 agent 可以在缩短的历史记录上继续运行。虽然压缩保留了连续性，但它并没有给 agent 一个全新的开始，这意味着上下文焦虑可能依然存在。重置提供了一个全新的开始，代价是移交工件必须具有足够的状态，以便下一个 agent 能够干净利落地接手工作。在我们早期的测试中，我们发现 Claude Sonnet 4.5 表现出强烈的上下文焦虑，以至于单靠压缩不足以实现强大的长任务性能，因此上下文重置成为 harness 设计中必不可少的部分。这解决了核心问题，但给每次 harness 运行增加了编排复杂性、token 开销和延迟。

第二个我们之前没有解决的问题是自我评估。当被要求评估自己产生的工作时，agent 往往会自信地赞扬这项工作——即使在人类观察者看来，质量显然很平庸。这个问题在设计等主观任务中尤为明显，因为没有等同于可验证软件测试的二进制检查。布局感觉是精致的还是普通的，这是一个判断问题，而 agent 在给自己工作评分时总是可靠地偏向正面。

然而，即使在有可验证结果的任务上，agent 仍然有时会表现出糟糕的判断力，从而在完成任务时阻碍其性能。将执行工作的 agent 与评判工作的 agent 分开，被证明是解决这个问题的有力手段。这种分离本身并不能立即消除那种宽容；评估器仍然是一个 LLM，它倾向于对 LLM 生成的输出表现得慷慨。但是，事实证明，将一个独立的评估器调整为持怀疑态度，要比让生成器对自己的工作持批评态度容易得多，一旦有了这种外部反馈，生成器就有了具体的迭代目标。

## 前端设计：让主观质量变得可评分

我从前端设计开始尝试，那里的自我评估问题最为明显。在没有任何干预的情况下，Claude 通常倾向于安全、可预测的布局，这些布局在技术上能起作用，但在视觉上却平淡无奇。

有两个见解塑造了我为前端设计构建的 harness。首先，虽然美学不能完全简化为一个分数——而且个人品味总是各不相同——但它们可以通过编码了设计原则和偏好的评分标准来改善。“这个设计漂亮吗？”很难给出一致的答案，但“这是否遵循了我们良好设计的原则？”给了 Claude 一个具体的评分标准。其次，通过将前端生成与前端评分分开，我们可以创建一个反馈循环，驱使生成器产生更强大的输出。

考虑到这一点，我编写了四个评分标准，并在他们的 prompt 中提供给生成器和评估器 agent：

- **设计质量 (Design quality)：** 设计感觉像是一个连贯的整体，还是仅仅是各部分的集合？这里出色的工作意味着颜色、排版、布局、图像和其他细节结合在一起，创造出一种独特的氛围和身份。
- **原创性 (Originality)：** 是否有定制决策的证据，或者这只是模板布局、库默认设置和 AI 生成的模式？人类设计师应该能识别出深思熟虑的创意选择。未经修改的库存组件——或者 AI 生成的明显迹象，如白色卡片上的紫色渐变——在这里是不及格的。
- **工艺 (Craft)：** 技术执行力：排版层级、间距一致性、色彩和谐度、对比度。这是一种能力检查，而不是创造力检查。大多数合理的实现在这方面默认都做得很好；失败意味着基础被破坏了。
- **功能性 (Functionality)：** 独立于美学的可用性。用户能否理解界面的功能、找到主要操作并在无需猜测的情况下完成任务？

我强调设计质量和原创性胜过工艺和功能性。Claude 在工艺和功能性方面默认得分已经很高，因为所需的技术能力往往对模型来说是自然而然的。但在设计和原创性上，Claude 经常产生充其量只能算是平淡无奇的输出。该标准明确惩罚了高度通用的“AI 垃圾 (AI slop)”模式，并通过赋予设计和原创性更高的权重，推动模型在美学上承担更多风险。

我使用带有详细分数细分的 few-shot 示例校准了评估器。这确保了评估器的判断与我的偏好保持一致，并减少了跨迭代的分数漂移。

我在 [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) 上构建了这个循环，这使得编排保持简单直接。一个生成器 agent 首先根据用户的 prompt 创建了一个 HTML/CSS/JS 前端。我给评估器配备了 Playwright MCP，让它可以直接与实时页面交互，然后再对每个标准进行评分并撰写详细的评论。在实践中，评估器会自行导航页面，截图并仔细研究实现情况，然后再做出评估。该反馈作为下一次迭代的输入流回生成器。我每次生成运行 5 到 15 次迭代，随着生成器响应评估器的评论，每次迭代通常会将生成器推向一个更具特色的方向。由于评估器是在主动导航页面而不是对静态截图进行评分，因此每个周期都需要消耗真实的挂钟时间 (wall-clock time)。完整的运行长达四个小时。我还指示生成器在每次评估后做出战略决策：如果分数趋势良好，则完善当前方向；如果该方法不起作用，则转向完全不同的美学。

在多次运行中，评估器的评估在迭代过程中不断改善，然后趋于稳定，但仍有提升空间。一些生成结果得到了渐进式的完善。另一些则在迭代之间发生了急剧的美学转变。

标准的措辞以我没有完全预料到的方式引导了生成器。包含“最好的设计是博物馆级别的”这样的短语，将设计推向了一种特定的视觉收敛，这表明与标准相关的 prompt 直接塑造了输出的特征。

虽然分数通常随着迭代而提高，但这种模式并不总是纯粹线性的。后期的实现作为一个整体往往会更好，但我经常看到一些情况，我更喜欢中间的某次迭代而不是最后一次。随着生成器为了响应评估器的反馈而寻求更雄心勃勃的解决方案，实现复杂性在各轮之间也趋于增加。即使在第一次迭代中，输出也明显优于根本没有 prompt 的基线，这表明标准和相关语言本身就引导模型远离了通用默认值，甚至在任何评估器反馈带来进一步完善之前就已经如此。

在一个值得注意的例子中，我 prompt 模型为一个荷兰艺术博物馆创建一个网站。到第九次迭代时，它为一个虚构的博物馆生成了一个干净的、暗色主题的登陆页面。该页面在视觉上很精致，但很大程度上符合我的预期。然后，在第十个周期，它完全放弃了这种方法，将网站重新构想为一种空间体验：一个使用 CSS 透视渲染的、铺着方格地板的 3D 房间，艺术品以自由形式悬挂在墙上，并使用基于门口的导航在画廊房间之间切换，而不是滚动或点击。这是一种我在单遍生成中从未见过的创造性飞跃。

## 扩展到全栈编码

### 架构

在我们早期的 [long-running harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 中，我们使用了一个初始化 agent、一个一次处理一个功能的编码 agent，以及会话之间的上下文重置，解决了连贯的多会话编码问题。上下文重置是一个关键的突破：该 harness 使用了 Sonnet 4.5，它表现出了前面提到的“上下文焦虑”倾向。创建一个能在上下文重置中良好运行的 harness，是保持模型专注于任务的关键。Opus 4.5 基本上自行消除了这种行为，所以我能够完全从这个 harness 中去掉上下文重置。这些 agent 在整个构建过程中作为一个连续的会话运行，并由 [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) 的自动压缩 (compaction) 来处理沿途的上下文增长。

对于这项工作，我在原始 harness 的基础上构建了一个三 agent 系统，每个 agent 都解决了我在此前运行中观察到的一个特定差距。系统包含以下 agent 角色：

**规划器 (Planner)：** 我们之前的长运行 harness 要求用户预先提供详细的规格说明。我想自动化这一步，所以我创建了一个规划器 agent，它接收一个简单的 1-4 句 prompt，并将其扩展为一个完整的产品规格。我 prompt 它在范围上要雄心勃勃，并专注于产品上下文和高层技术设计，而不是详细的技术实现。这种强调是出于一种担忧，即如果规划器试图预先指定细粒度的技术细节并犯了错误，规格中的错误将级联到下游的实现中。将 agent 限制在要生成的交付物上，让它们在工作时自己找出路径，似乎是更明智的做法。我还要求规划器寻找机会将 AI 功能融入产品规格中。（请参阅底部附录中的示例。）

**生成器 (Generator)：** 早期 harness 中一次一个功能的方法在范围管理方面效果很好。我在这里应用了类似的模型，指示生成器以冲刺 (sprints) 的形式工作，每次从规格中提取一个功能。每个冲刺使用 React、Vite、FastAPI 和 SQLite（后来改为 PostgreSQL）技术栈来实现应用程序，并指示生成器在每个冲刺结束时、将其移交给 QA 之前对自己的工作进行自我评估。它还配备了 git 用于版本控制。

**评估器 (Evaluator)：** 来自早期 harness 的应用程序通常看起来令人印象深刻，但当您实际尝试使用它们时，仍然会发现真正的 bug。为了捕捉这些问题，评估器使用 Playwright MCP 像用户一样点击运行中的应用程序，测试 UI 功能、API 端点和数据库状态。然后，它根据发现的 bug 和一套仿照前端实验制定的标准（在这里进行了调整，以涵盖产品深度、功能性、视觉设计和代码质量）对每个冲刺进行评分。每个标准都有一个硬性阈值，如果任何一个低于阈值，冲刺就会失败，生成器会得到关于哪里出了问题的详细反馈。

在每次冲刺之前，生成器和评估器会协商一份冲刺合同：在编写任何代码之前，就那部分工作的“完成 (done)”标准达成一致。这之所以存在，是因为产品规格有意做得比较高层，我想要一个步骤来弥合用户故事和可测试实现之间的差距。生成器提出它将构建什么以及如何验证成功，评估器则审查该提案，以确保生成器构建的是正确的东西。两者进行迭代，直到达成一致。

通信是通过文件处理的：一个 agent 会写入一个文件，另一个 agent 会读取它，并在该文件内回复，或者创建一个新文件供前一个 agent 轮流读取。然后，生成器根据商定的合同进行构建，然后将工作移交给 QA。这使得工作忠实于规格，而不会过早地过度指定实现。

### 运行 harness

对于这个 harness 的第一个版本，我使用了 Claude Opus 4.5，将用户的 prompt 针对完整的 harness 和一个单 agent 系统运行以进行比较。我之所以使用 Opus 4.5，是因为当我开始这些实验时，它是我们最好的编码模型。

我写了以下 prompt 来生成一个复古视频游戏制作器：

> *Create a 2D retro game maker with features including a level editor, sprite editor, entity behaviors, and a playable test mode.*

*【以上为 AI 生成的 prompt 示例，保留英文原文】*

下表显示了 harness 类型、运行长度和总成本。

| **Harness** | **Duration** | **Cost** |
| --- | --- | --- |
| Solo | 20 min | $9 |
| Full harness | 6 hr | $200 |

harness 的成本高出 20 多倍，但输出质量的差异立竿见影。

我期望有一个界面，我可以在其中构建一个关卡及其组成部分（精灵、实体、图块布局），然后点击播放来实际游玩这个关卡。我首先打开了 solo 运行的输出，最初的应用程序似乎符合这些期望。

然而，当我点击浏览时，问题开始出现了。布局浪费了空间，固定高度的面板让视口的大部分区域都是空的。工作流程很僵化。尝试填充一个关卡会提示我先创建精灵和实体，但 UI 中没有任何东西引导我遵循该顺序。更关键的是，实际的游戏是坏的。我的实体出现在屏幕上，但没有任何东西对输入做出响应。深入研究代码后发现，实体定义和游戏运行时的连线被破坏了，表面上没有任何指示表明问题出在哪里。

Opening screenSprite editorGame play![](/uploads/harness-design-long-running-apps/001_image.png)通过 solo harness 创建的应用程序在打开时的初始屏幕。![](/uploads/harness-design-long-running-apps/002_image.png)在 solo harness 制作的精灵编辑器中创建精灵![](/uploads/harness-design-long-running-apps/003_image.png)尝试播放我创建的关卡但未能成功

在评估了 solo 运行之后，我将注意力转向了 harness 运行。这次运行从同一个一句话 prompt 开始，但规划器步骤将该 prompt 扩展为一个包含 16 个功能的规格说明，分布在十个冲刺中。这远远超出了 solo 运行所尝试的范围。除了核心编辑器和游玩模式之外，规格还要求提供精灵动画系统、行为模板、音效和音乐、AI 辅助的精灵生成器和关卡设计师，以及带有可共享链接的游戏导出功能。我让规划器访问我们的 [frontend design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)，它读取并使用该技能为应用程序创建了一种视觉设计语言，作为规格的一部分。对于每个冲刺，生成器和评估器协商了一份合同，定义了该冲刺的具体实现细节，以及将测试以验证完成情况的可测试行为。

该应用程序立即展现出比 solo 运行更多的精致感和流畅度。画布使用了整个视口，面板的大小也很合理，并且界面具有一致的视觉身份，紧随规格中的设计方向。我在 solo 运行中看到的一些笨拙之处确实保留了下来——工作流程仍然没有明确说明在尝试填充关卡之前应该构建精灵和实体，我不得不在到处摸索后才弄明白这一点。这被解读为基础模型产品直觉上的差距，而不是 harness 旨在解决的问题，尽管它确实表明在 harness 内部进行有针对性的迭代可以帮助进一步提高输出质量。

在使用这些编辑器时，新运行相较于 solo 运行的优势变得更加明显。精灵编辑器更加丰富且功能更齐全，拥有更干净的工具调色板、更好的颜色选择器以及更实用的缩放控件。

因为我已经要求规划器将 AI 功能编织到其规格中，所以该应用程序还带有一个内置的 Claude 集成，让我可以通过 prompting 生成游戏的不同部分。这极大地加快了工作流程。

Opening screenSprite editorAI game designAI game designGame play![](/uploads/harness-design-long-running-apps/004_image.png)初始屏幕：在完整的 harness 构建的应用程序中创建新游戏![](/uploads/harness-design-long-running-apps/005_image.png)精灵编辑器感觉更干净且更容易使用![](/uploads/harness-design-long-running-apps/006_image.png)使用内置的 AI 功能生成关卡![](/uploads/harness-design-long-running-apps/007_image.png)使用内置的 AI 功能生成关卡![](/uploads/harness-design-long-running-apps/008_image.png)游玩我生成出来的游戏

最大的区别在于游玩模式。我竟然真的能够移动我的实体并游玩游戏。物理效果有一些粗糙的边缘——我的角色跳到了一个平台上，但最终与它重叠了，这在直觉上感觉是错误的——但核心部分起作用了，而这正是 solo 运行没能做到的。在四处走动了一会儿后，我确实碰到了 AI 构建游戏关卡的一些限制。有一堵很大的墙，我无法跳过去，所以我被卡住了。这表明 harness 还可以处理一些常识性的改进和边缘情况，以进一步完善应用程序。

通读日志，很明显评估器使实现与规格保持一致。在每个冲刺中，它都会遍历冲刺合同的测试标准，并通过 Playwright 运行正在执行的应用程序，针对任何偏离预期行为的情况提交 bug。合同是细粒度的——仅冲刺 3 就有 27 个涵盖关卡编辑器的标准——而且评估器的发现足够具体，无需额外调查即可采取行动。下表展示了我们的评估器识别出的几个问题示例：

| **Contract criterion** | **Evaluator finding** |
| --- | --- |
| 矩形填充工具允许通过点击拖动，使用所选图块填充矩形区域 | **失败 (FAIL)** — 工具仅在拖动开始/结束点放置图块，而不是填充整个区域。`fillRectangle` 函数存在，但在 mouseUp 时未被正确触发。 |
| 用户可以选择并删除放置的实体生成点 | **失败 (FAIL)** — `LevelEditor.tsx:892` 处的删除键处理程序要求同时设置 `selection` 和 `selectedEntityId `，但点击实体仅会设置 `selectedEntityId`。条件应为 `selection || (selectedEntityId && activeLayer === 'entity')`。 |
| 用户可以通过 API 重新排序动画帧 | **失败 (FAIL)** — `PUT /frames/reorder` 路由定义在 `/{frame_id}` 路由之后。FastAPI 将 'r`eorder`' 匹配为 frame_id 整数，并返回 422："unable to parse string as an integer." |

让评估器达到这个水平需要付出努力。开箱即用的情况下，Claude 是一个糟糕的 QA agent。在早期的运行中，我看着它识别出合理的问题，然后又说服自己认为这些问题没什么大不了的，并无论如何都批准了这项工作。它还倾向于进行表面测试，而不是探测边缘情况，因此更隐蔽的 bug 经常会漏网。调整循环是读取评估器的日志，找到它的判断与我产生分歧的例子，然后更新 QA 的 prompt 以解决这些问题。在评估器能够以我认为了合理的方式进行评分之前，这花费了好几轮的开发循环。即便如此，harness 的输出仍然显示了模型在 QA 能力上的局限性：小的布局问题、在某些地方感觉不直观的交互，以及在评估器没有彻底执行的更深层嵌套功能中未被发现的 bug。显然，随着进一步的调整，还有更多的验证空间可以捕捉。但与中心功能根本不起作用的 solo 运行相比，提升是显而易见的。

### 迭代 harness

第一组 harness 结果令人鼓舞，但它也显得臃肿、缓慢且昂贵。合乎逻辑的下一步是寻找在不降低其性能的情况下简化 harness 的方法。这部分是常识，部分是因为一个更普遍的原则：harness 中的每个组件都编码了一个关于模型靠自己无法做到什么的假设，而这些假设值得进行压力测试，这既因为它们可能是不正确的，也因为随着模型的改进它们会很快过时。我们的博客文章 [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 将这一潜在的理念构建为“找到尽可能最简单的解决方案，仅在需要时增加复杂性”，对于任何维护 agent harness 的人来说，这是一种始终如一出现的模式。

在我的第一次简化尝试中，我大幅削减了 harness，并尝试了一些具有创意的新想法，但我无法复现原始版本的性能。这也变得很难分辨 harness 设计中的哪些部分实际上承载着负荷，以及它们是以何种方式起作用的。基于那次经验，我转向了一种更有条理的方法，每次移除一个组件，然后审查它对最终结果产生了什么影响。

当我在经历这些迭代周期时，我们还发布了 Opus 4.6，这为降低 harness 的复杂性提供了进一步的动力。有充分的理由期望 4.6 会比 4.5 需要更少的脚手架 (scaffolding)。摘自我们的 [launch blog:](https://www.anthropic.com/news/claude-opus-4-6) “[Opus 4.6] 计划得更加仔细，能更长时间地维持 agentic 任务，在更大的代码库中能更可靠地运行，并拥有更好的代码审查和调试技能以发现自己的错误。”它在长上下文检索方面也取得了实质性的改进。这些都是当初构建该 harness 旨在补充的能力。

### 移除冲刺结构 (sprint construct)

我首先完全移除了冲刺结构 (sprint construct)。冲刺结构曾帮助将工作分解为多个块，以便模型能连贯地工作。考虑到 Opus 4.6 的改进，有充分的理由相信模型可以原生地处理这项工作，而不需要这种分解。

我保留了规划器和评估器，因为它们都继续增加着明显的价值。如果没有规划器，生成器就会对范围规划不足：给定原始的 prompt，它会在不首先明确其工作规格的情况下开始构建，最终创建出的应用程序在功能丰富度上不如规划器。

移除冲刺结构后，我将评估器转移到运行结束时的单次遍历中，而不是按冲刺评分。由于模型的能力强得多，它改变了评估器在某些运行中的负荷承受度，其有效性取决于任务相对于模型能够可靠地独自完成的事情处于什么位置。在 4.5 上，那个边界很近：我们的构建处于生成器能独自做好的边缘，而评估器在整个构建过程中捕获到了有意义的问题。在 4.6 上，模型的原始能力增加了，因此边界向外移动了。过去需要评估器检查才能连贯执行的任务，现在往往在生成器能自己处理得很好的范围内，对于那个边界内的任务，评估器成了不必要的开销。但对于构建中仍然处于生成器能力边缘的部分，评估器继续提供了真正的提升。

实际的意义是，评估器并不是一个固定的“是或否”决定。当任务超出了当前模型能够可靠地独自完成的范围时，它就物有所值了。

除了结构上的简化之外，我还添加了 prompting 来改善 harness 如何将 AI 功能构建到每个应用程序中，特别是让生成器构建一个合适的 agent，以通过工具驱动应用程序自身的功能。这需要真正的迭代，因为相关知识足够新，以至于 Claude 的训练数据对其覆盖得很薄弱。但在经过足够的调整后，生成器能够正确地构建 agent 了。

### 更新后的 harness 结果

为了对更新后的 harness 进行测试，我使用了以下 prompt 来生成一个数字音频工作站 (DAW)，这是一个用于作曲、录音和混音歌曲的音乐制作程序：

> *Build a fully featured DAW in the browser using the Web Audio API.*

*【以上为 AI 生成的 prompt 示例，保留英文原文】*

这次运行仍然漫长且昂贵，耗时约 4 小时，token 成本为 124 美元。

大部分时间都花在了构建器上，它连贯地运行了两个多小时，而没有使用 Opus 4.5 曾经需要的冲刺分解。

| **Agent & Phase** | **Duration** | **Cost** |
| --- | --- | --- |
| Planner | 4.7 min | $0.46 |
| Build (Round 1) | 2 hr 7 min | $71.08 |
| QA (Round 1) | 8.8 min | $3.24 |
| Build (Round 2) | 1 hr 2 min | $36.89 |
| QA (Round 2) | 6.8 min | $3.09 |
| Build (Round 3) | 10.9 min | $5.88 |
| QA (Round 3) | 9.6 min | $4.06 |
| **Total V2 Harness** | **3 hr 50 min** | **$124.70** |

与之前的 harness 一样，规划器将单行的 prompt 扩展为一个完整的规格说明。从日志中我可以看到，生成器模型在规划应用程序和 agent 设计、将 agent 连接起来，并在移交给 QA 之前对其进行测试方面做得很出色。

话虽如此，QA agent 仍然发现了真正的差距。在它第一轮的反馈中，它指出：

> 这是一个强大的应用程序，具有极高的设计保真度、坚实的 AI agent 以及良好的后端。主要的故障点在于功能完整性 (Feature Completeness) ——虽然该应用程序看起来令人印象深刻且 AI 集成运作良好，但几个核心 DAW 功能仅供显示而缺乏交互深度：剪辑无法在时间轴上拖动/移动，没有乐器 UI 面板（合成器旋钮、鼓垫），也没有视觉效果编辑器（EQ 曲线、压缩器电平表）。这些并不是边缘情况——它们是使 DAW 具有可用性的核心交互，而且规格中明确要求了这些功能。

在它第二轮的反馈中，它再次指出了几个功能性差距：

> 剩余的差距：
> - 音频录制仍然只是个存根 (stub)（按钮可以切换，但没有麦克风捕获）
> - 通过边缘拖动来调整剪辑大小以及剪辑拆分尚未实现
> - 效果可视化只是数字滑块，而不是图形化的（没有 EQ 曲线）

如果不加以控制，生成器仍然容易遗漏细节或保留存根功能，而 QA 在捕获这些最后一英里的问题以供生成器修复方面仍然增加了价值。

基于该 prompt，我期望能得到一个程序，我可以在其中创建旋律、和声和鼓声模式，将它们编排成一首歌曲，并在过程中获得集成 agent 的帮助。下面的视频展示了结果。

这个应用程序远非一个专业的音乐制作程序，而且 agent 的歌曲创作技巧显然还需要大量的改进。此外，Claude 实际上听不到声音，这使得 QA 反馈循环在音乐品味方面的有效性降低了。

但最终的应用程序拥有了功能性音乐制作程序的所有核心部分：在浏览器中运行的一个有效的编排视图、混音器和走带控制 (transport)。除此之外，我能够完全通过 prompting 将一段简短的歌曲片段拼接在一起：agent 设置了速度和基调，铺设了旋律，建立了一条鼓轨，调整了混音器电平，并添加了混响。歌曲创作的核心原语都存在，并且 agent 可以自主地驱动它们，使用工具从头到尾创建简单的制作。您可能会说它还不完美——但它正在朝那个方向发展。

## 接下来是什么

随着模型的不断改进，我们大致可以期望它们能够工作更长时间，处理更复杂的任务。在某些情况下，这意味着随着时间的推移，围绕模型的脚手架会变得不那么重要，开发者可以等待下一个模型，并看到某些问题自然而然地得到解决。另一方面，模型变得越好，开发 harness 的空间就越大，这些 harness 能够实现超出模型在基线水平所能完成的复杂任务。

考虑到这一点，这项工作中有一些经验值得继续传承。针对您正在构建的模型进行实验，阅读它在现实问题上的运行轨迹，并调整它的性能以实现您期望的结果，这始终是一个好习惯。在处理更复杂的任务时，有时通过分解任务并将专业的 agent 应用于问题的各个方面，会获得提升空间。而当一个新模型推出时，通常的好习惯是重新检查 harness，剥离掉那些不再承载性能负荷的部分，并添加新的部分以实现以前可能无法实现的更强能力。

从这项工作中，我坚信有趣 harness 组合的空间不会随着模型的改进而缩小。相反，它在移动，而 AI 工程师有趣的工作就是不断寻找下一个新颖的组合。

## 致谢

特别感谢 Mike Krieger、Michael Agaby、Justin Young、Jeremy Hadfield、David Hershey、Julius Tarng、Xiaoyi Zhang、Barry Zhang、Orowa Sidker、Michael Tingley、Ibrahim Madha、Martina Long 和 Canyon Robbins 对这项工作做出的贡献。

也要感谢 Jake Eaton、Alyssa Leonard 和 Stef Sequeira 在塑造这篇文章方面的帮助。

## 附录

由规划器 agent 生成的计划示例。

```
RetroForge - 2D Retro Game Maker

Overview
RetroForge is a web-based creative studio for designing and building 2D retro-style video games. It combines the nostalgic charm of classic 8-bit and 16-bit game aesthetics with modern, intuitive editing tools—enabling anyone from hobbyist creators to indie developers to bring their game ideas to life without writing traditional code.

The platform provides four integrated creative modules: a tile-based Level Editor for designing game worlds, a pixel-art Sprite Editor for crafting visual assets, a visual Entity Behavior system for defining game logic, and an instant Playable Test Mode for real-time gameplay testing. By weaving AI assistance throughout (powered by Claude), RetroForge accelerates the creative process—helping users generate sprites, design levels, and configure behaviors through natural language interaction.

RetroForge targets creators who love retro gaming aesthetics but want modern conveniences. Whether recreating the platformers, RPGs, or action games of their childhood, or inventing entirely new experiences within retro constraints, users can prototype rapidly, iterate visually, and share their creations with others.

Features
1. Project Dashboard & Management
The Project Dashboard is the home base for all creative work in RetroForge. Users need a clear, organized way to manage their game projects—creating new ones, returning to works-in-progress, and understanding what each project contains at a glance.

User Stories: As a user, I want to:

- Create a new game project with a name and description, so that I can begin designing my game
- See all my existing projects displayed as visual cards showing the project name, last modified date, and a thumbnail preview, so that I can quickly find and continue my work
- Open any project to enter the full game editor workspace, so that I can work on my game
- Delete projects I no longer need, with a confirmation dialog to prevent accidents, so that I can keep my workspace organized
- Duplicate an existing project as a starting point for a new game, so that I can reuse my previous work

Project Data Model: Each project contains:

Project metadata (name, description, created/modified timestamps)
Canvas settings (resolution: e.g., 256x224, 320x240, or 160x144)
Tile size configuration (8x8, 16x16, or 32x32 pixels)
Color palette selection 
All associated sprites, tilesets, levels, and entity definitions

...

```
