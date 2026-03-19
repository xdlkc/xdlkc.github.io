---
title: 每个 ADK 开发者都应该知道的 5 种 Agent Skill 设计模式
date: 2026-03-19 00:00:00
---

![封面图](/uploads/agent-skill-design-patterns/001_cover.jpg)

作者：[Saboo_Shubham_](https://x.com/@Saboo_Shubham_) 和 [lavinigam](https://x.com/@lavinigam)

在处理 𝚂𝙺𝙸𝙻𝙻.𝚖𝚍 时，开发者往往过度关注格式——把 YAML 写对、目录结构弄好、遵循规范。但现在已经有 30 多个 agent 工具（如 Claude Code、Gemini CLI 和 Cursor）都采用了相同的布局，格式问题实际上已经过时了。

现在的挑战在于内容设计。规范文档解释了如何打包一个 skill，但对如何在其内部构建逻辑结构几乎没有任何指导。例如，一个封装 FastAPI 约定的 skill 与四步文档管道的运作方式完全不同，即使它们的 𝚂𝙺𝙸𝙻𝙻.𝚖𝚍 文件在外观上看起来一模一样。

通过研究整个生态系统中 skills 的构建方式——从 Anthropic 的仓库到 Vercel 和 Google 的内部指南——我们发现五种反复出现的设计模式，可以帮助开发者构建更好的 agents。

本文将用实际可用的 ADK 代码逐一介绍这些模式：

- **Tool Wrapper（工具包装器）**：让你的 agent 立即成为任何库的专家
- **Generator（生成器）**：通过可重用模板生成结构化文档
- **Reviewer（审查者）**：按严重程度对代码进行评分
- **Inversion（反转）**：agent 在行动之前先对你进行访谈
- **Pipeline（管道）**：通过检查点强制执行严格的多步骤工作流

![介绍图](/uploads/agent-skill-design-patterns/002_intro.jpg)

## 模式 1：Tool Wrapper（工具包装器）

![模式 1 图示](/uploads/agent-skill-design-patterns/003_pattern1.jpg)

Tool Wrapper 为你的 agent 提供特定库的按需上下文。与其将 API 约定硬编码到系统提示词中，不如将它们打包成一个 skill。你的 agent 只有在实际使用该技术时才会加载这些上下文。

这是最简单的实现模式。𝚂𝙺𝙸𝙻𝙻.𝚖𝚍 文件会监听用户提示词中的特定库关键词，动态地从 𝚛𝚎𝚏𝚎𝚛𝚎𝚗𝚌𝚎𝚜/ 目录加载你的内部文档，并将这些规则作为绝对真理应用。这正是你将团队的内部编码规范或特定框架最佳实践直接分发到开发者工作流程中的确切机制。

下面是一个教 agent 如何编写 FastAPI 代码的 Tool Wrapper 示例。请注意，指令明确告诉 agent 只有在开始审查或编写代码时才加载 𝚌𝚘𝚗𝚟𝚎𝚗𝚝𝚒𝚘𝚗𝚜.𝚖𝚍 文件：

```markdown
# skills/api-expert/SKILL.md
---
name: api-expert
description: FastAPI 开发最佳实践和约定。在构建、审查或调试 FastAPI 应用程序、REST API 或 Pydantic 模型时使用。
metadata:
  pattern: tool-wrapper
  domain: fastapi
---

你是 FastAPI 开发专家。将这些约定应用于用户的代码或问题。

## 核心约定
加载 'references/conventions.md' 以获取完整的 FastAPI 最佳实践列表。

## 审查代码时
1. 加载约定参考
2. 对照每个约定检查用户的代码
3. 对于每个违规，引用具体规则并建议修复方法

## 编写代码时
1. 加载约定参考
2. 严格遵循每个约定
3. 为所有函数签名添加类型注解
4. 使用 Annotated 风格进行依赖注入
```

## 模式 2：Generator（生成器）

![模式 2 图示](/uploads/agent-skill-design-patterns/004_pattern2.jpg)

Tool Wrapper 应用知识，而 Generator 强制输出一致性。如果你苦恼于 agent 在每次运行时生成不同的文档结构，Generator 通过编排填空过程来解决这个问题。

它利用两个可选目录：𝚊𝚜𝚜𝚎𝚝𝚜/ 保存你的输出模板，𝚛𝚎𝚏𝚎𝚛𝚎𝚗𝚌𝚎𝚜/ 保存你的风格指南。指令充当项目经理。它们告诉 agent 加载模板、阅读风格指南、询问用户缺失的变量，并填充文档。这对于生成可预测的 API 文档、标准化提交消息或脚手架化项目架构非常实用。

在这个技术报告生成器示例中，skill 文件不包含实际的布局或语法规则。它只是协调这些资源的检索，并强制 agent 逐步执行：

```markdown
# skills/report-generator/SKILL.md
---
name: report-generator
description: 以 Markdown 格式生成结构化技术报告。当用户要求编写、创建或起草报告、摘要或分析文档时使用。
metadata:
  pattern: generator
  output-format: markdown
---

你是一个技术报告生成器。请严格遵循以下步骤：

**步骤 1：** 加载 'references/style-guide.md' 以获取语气和格式规则。

**步骤 2：** 加载 'assets/report-template.md' 以获取所需的输出结构。

**步骤 3：** 询问用户填充模板所需的任何缺失信息：
- 主题或主题
- 关键发现或数据点
- 目标受众（技术、高管、普通）

**步骤 4：** 按照风格指南规则填充模板。输出中必须存在模板的每个部分。

**步骤 5：** 将完成的报告作为单个 Markdown 文档返回。
```

## 模式 3：Reviewer（审查者）

![模式 3 图示](/uploads/agent-skill-design-patterns/005_pattern3.jpg)

Reviewer 模式将"检查什么"与"如何检查"分离。与其编写详细说明每个代码异味的冗长系统提示词，不如将模块化评分标准存储在 𝚛𝚎𝚏𝚎𝚛𝚎𝚗𝚌𝚎𝚜/𝚛𝚎𝚟𝚒𝚎𝚠-𝚌𝚑𝚎𝚌𝚔𝚕𝚒𝚜𝚝.𝚖𝚍 文件中。

当用户提交代码时，agent 加载此检查表并系统地给提交打分，按严重程度对发现进行分组。如果你将 Python 风格检查表换成 OWASP 安全检查表，你会得到完全不同的专业审计，但使用的是完全相同的 skill 基础设施。这是自动化 PR 审查或在人工查看代码之前捕获漏洞的非常有效的方法。

下面的代码审查者 skill 演示了这种分离。指令保持静态，但 agent 动态加载来自外部检查表的具体审查标准，并强制输出结构化的、基于严重程度的评审结果：

```markdown
# skills/code-reviewer/SKILL.md
---
name: code-reviewer
description: 审查 Python 代码的质量、风格和常见错误。当用户提交代码进行审查、请求对其代码的反馈或想要代码审计时使用。
metadata:
  pattern: reviewer
  severity-levels: error,warning,info
---

你是一个 Python 代码审查者。请严格遵循此审查协议：

**步骤 1：** 加载 'references/review-checklist.md' 以获取完整的审查标准。

**步骤 2：** 仔细阅读用户的代码。在批评之前先理解其目的。

**步骤 3：** 将检查表中的每个规则应用于代码。对于发现的每个违规：
- 记录行号（或大概位置）
- 分类严重程度：error（必须修复）、warning（应该修复）、info（考虑）
- 解释为什么这是一个问题，而不仅仅是哪里错了
- 建议具体的修复方法和更正后的代码

**步骤 4：** 生成包含以下部分的结构化审查：
- **摘要**：代码的作用、整体质量评估
- **发现**：按严重程度分组（首先是错误，然后是警告，最后是信息）
- **评分**：给出 1-10 分，并简要说明理由
- **前 3 项建议**：最有影响力的改进
```

## 模式 4：Inversion（反转）

![模式 4 图示](/uploads/agent-skill-design-patterns/006_pattern4.jpg)

agent 天生就想猜测并立即生成内容。Inversion 模式翻转了这种动态。不是用户驱动提示词和 agent 执行，而是 agent 充当面试官的角色。

Inversion 依赖于明确的、不可协商的门控指令（如"在所有阶段完成之前不要开始构建"）来强制 agent 首先收集上下文。它按顺序询问结构化问题，并在进入下一阶段之前等待你的答案。agent 在获得对你的需求和部署约束的完整画面之前，拒绝合成最终输出。

要在实践中看到这一点，请看这个项目规划器 skill。这里的关键元素是严格的分阶段和明确的门控提示词，它阻止 agent 在收集完所有用户答案之前合成最终计划：

```markdown
# skills/project-planner/SKILL.md
---
name: project-planner
description: 通过在生成计划之前通过结构化问题收集需求来规划新软件项目。当用户说"我想构建"、"帮我规划"、"设计系统"或"开始一个新项目"时使用。
metadata:
  pattern: inversion
  interaction: multi-turn
---

你正在进行结构化需求访谈。在所有阶段完成之前不要开始构建或设计。

## 第 1 阶段 —— 问题发现（一次问一个问题，等待每个答案）
按顺序问这些问题。不要跳过任何问题。
- Q1："这个项目为用户解决了什么问题？"
- Q2："主要用户是谁？他们的技术水平如何？"
- Q3："预期的规模是多少？（每天的用户数、数据量、请求率）"

## 第 2 阶段 —— 技术约束（仅在完成第 1 阶段后）
- Q4："你将使用什么部署环境？"
- Q5："你有任何技术栈要求或偏好吗？"
- Q6："有哪些不可协商的要求？（延迟、正常运行时间、合规性、预算）"

## 第 3 阶段 —— 合成（仅在所有问题回答后）
1. 加载 'assets/plan-template.md' 以获取输出格式
2. 使用收集的需求填充模板的每个部分
3. 向用户展示完成的计划
4. 询问："这个计划是否准确反映了你的需求？你想改变什么？"
5. 在反馈上迭代，直到用户确认
```

## 模式 5：Pipeline（管道）

![模式 5 图示](/uploads/agent-skill-design-patterns/007_pattern5.jpg)

对于复杂任务，你无法承担跳过步骤或忽略指令的后果。Pipeline 模式通过硬检查点强制执行严格、顺序的工作流。

指令本身充当工作流定义。通过实施显式的菱形门控条件（例如，在从 docstring 生成移动到最终组装之前要求用户批准），Pipeline 确保 agent 无法绕过复杂任务并呈现未经验证的最终结果。

此模式利用所有可选目录，仅在需要它们的特定步骤中拉入不同的参考文件和模板，保持上下文窗口干净。

在这个文档管道示例中，请注意显式的门控条件。agent 被明确禁止在用户确认上一步骤生成的 docstring 之前移动到组装阶段：

```markdown
# skills/doc-pipeline/SKILL.md
---
name: doc-pipeline
description: 通过多步骤管道从 Python 源代码生成 API 文档。当用户要求为模块生成文档、生成 API 文档或从代码创建文档时使用。
metadata:
  pattern: pipeline
  steps: "4"
---

你正在运行文档生成管道。按顺序执行每个步骤。不要跳过步骤或在步骤失败时继续。

## 步骤 1 —— 解析和清单
分析用户的 Python 代码以提取所有公共类、函数和常量。将清单作为检查表呈现。询问："这是你想要记录的完整公共 API 吗？"

## 步骤 2 —— 生成 Docstring
对于每个缺少 docstring 的函数：
- 加载 'references/docstring-style.md' 以获取所需格式
- 完全按照风格指南生成 docstring
- 为用户批准呈现每个生成的 docstring
在用户确认之前不要进行步骤 3。

## 步骤 3 —— 组装文档
加载 'assets/api-doc-template.md' 以获取输出结构。将所有类、函数和 docstring 编译成单个 API 参考文档。

## 步骤 4 —— 质量检查
对照 'references/quality-checklist.md' 进行审查：
- 每个公共符号都已记录
- 每个参数都有类型和描述
- 每个函数至少有一个使用示例
报告结果。在展示最终文档之前修复问题。
```

## 选择正确的 agent skill 模式

每种模式回答不同的问题。使用此决策树为你的用例找到合适的模式：

![决策树](/uploads/agent-skill-design-patterns/008_decision_tree.jpg)

## 最后，模式可以组合

这些模式不是互斥的。它们可以组合。

Pipeline skill 可以在末尾包含一个 Reviewer 步骤，以双重检查自己的工作。Generator 可以在最开始依赖 Inversion 来收集必要的变量，然后再填充模板。得益于 ADK 的 𝚂𝚔𝚒𝚕𝚕𝃚�𝚘𝚕𝜎和渐进式披露，你的 agent 只在运行时在所需的确切模式上花费上下文 token。

停止尝试将复杂且脆弱的指令塞进单个系统提示词中。将你的工作流分解，应用正确的结构模式，构建可靠的 agent。

## 今天就开始

Agent Skills 规范是开源的，并且在整个 ADK 中得到原生支持。你已经知道如何打包格式。现在你知道如何设计内容。使用 [Google Agent Development Kit](https://google.github.io/adk-docs/) 构建更智能的 agent。
