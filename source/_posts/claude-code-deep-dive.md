---
title: "Claude Code 深度拆解：一个 AI 编程助手的内部运作机制"
date: 2026-04-01 10:00:00
tags: [Claude, AI, 源码分析, Claude Code]
---

> 本文基于 2026 年 3 月 31 日通过 npm source map 泄露的 Claude Code 源码快照进行分析。约 1,900 个文件、51 万行 TypeScript 代码，构成了目前最复杂的 AI 编程 CLI 工具之一。

---

## 先说结论：Claude Code 到底是什么？

一句话概括：**Claude Code 是一个跑在终端里的 AI 编程助手，它能读写文件、执行命令、搜索代码、联网查资料，甚至能同时派出多个"分身"并行干活。**

但如果你以为它只是一个"套壳 ChatGPT"，那就大错特错了。从源码来看，Claude Code 更像是一个**精心设计的操作系统**——它有自己的工具系统、权限系统、插件系统、记忆系统、多智能体协调系统，甚至还有自己的"进程管理器"。

让我们一层一层拆开来看。

---

## 整体技术栈：为什么选这些？

| 层面 | 技术选型 | 为什么 |
|------|---------|--------|
| **运行时** | Bun | 比 Node.js 快 3-4 倍的启动速度，内置打包器 |
| **语言** | TypeScript (strict) | 类型安全，51 万行代码没有类型系统会崩溃 |
| **终端 UI** | React + Ink | 用 React 的声明式范式画终端界面，组件化开发 |
| **CLI 解析** | Commander.js | 成熟的命令行参数解析方案 |
| **Schema 校验** | Zod v4 | 运行时类型校验，用于工具输入参数验证 |
| **代码搜索** | ripgrep | 比 grep 快 10 倍以上的代码搜索 |
| **协议** | MCP SDK + LSP | 标准化的外部工具和语言服务集成 |
| **遥测** | OpenTelemetry | 行业标准的可观测性框架 |

一个有趣的细节：**Claude Code 用 React 来渲染终端 UI**。是的，你没看错。通过 Ink 这个库，它把 React 组件渲染成终端字符。这意味着整个 UI 层可以用 hooks、状态管理、组件复用这些前端工程师熟悉的模式来开发。对于一个有 140+ 个 UI 组件的项目来说，这个选择非常明智。

---

## 核心架构：一次对话是怎么跑起来的？

当你在终端输入一句话按下回车，背后发生了这些事：

```
用户输入
  │
  ▼
┌──────────────────────────────────────────────────────┐
│  main.tsx (入口)                                      │
│  Commander.js 解析参数 → React/Ink 渲染器初始化        │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  context.ts (上下文收集 — 双缓存架构)                  │
│                                                        │
│  getSystemContext() [memoize]                          │
│    ├── Git 状态（分支、最近提交、diff 摘要）             │
│    └── 缓存注入（调试用）                               │
│                                                        │
│  getUserContext() [memoize]                             │
│    ├── CLAUDE.md 记忆文件（6 层加载）                   │
│    └── 当前日期                                         │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  QueryEngine.ts (查询引擎 - 46K 行，核心中的核心)      │
│  构建 system prompt → 调用 Claude API → 流式响应       │
│                                                        │
│  ┌─────────────────────────────────────────────┐      │
│  │  Tool-Call Loop (工具调用循环)                │      │
│  │                                               │      │
│  │  Claude 返回 → 解析 tool_use → 权限检查       │      │
│  │       → 执行工具 → 结果回传 → Claude 继续     │      │
│  │       → ... (循环直到 Claude 不再调用工具)     │      │
│  └─────────────────────────────────────────────┘      │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  终端渲染：Markdown 格式化 + 代码高亮 + 进度动画      │
└──────────────────────────────────────────────────────┘
```

### 上下文收集：双缓存架构

在请求发送给 Claude 之前，`context.ts` 负责收集两类上下文，它们各自独立缓存（`memoize`），在整个会话期间只计算一次：

**`getSystemContext()`** — 系统级上下文：
- **Git 状态快照**：当前分支、主分支、最近 5 条提交、`git status --short`（超过 2000 字符会截断）、Git 用户名。这是一个**快照**，不会在对话过程中更新——系统提示词里明确告诉 Claude："this status is a snapshot in time, and will not update during the conversation"
- **缓存注入**：调试用的 cache breaker（仅内部版本）

**`getUserContext()`** — 用户级上下文：
- **CLAUDE.md 记忆**：从 6 层目录加载所有 CLAUDE.md 文件，合并成一段文本注入到 system prompt
- **当前日期**：简单但重要——让 Claude 知道"今天是几号"

Git 状态的收集本身也做了并行优化——分支名、主分支名、status、log、用户名五个 git 命令通过 `Promise.all` 并行执行，避免串行等待。

### QueryEngine：46K 行的"大脑"

`QueryEngine.ts` 是整个系统最核心的文件，单文件 46,000 行代码。它做的事情可以概括为一个**无限循环**：

1. **构建请求**：把系统提示词、用户上下文、对话历史、可用工具列表打包成 API 请求
2. **流式调用**：通过 Anthropic SDK 发起流式请求，逐 token 返回
3. **解析响应**：如果 Claude 返回了 `tool_use` 块，就进入工具执行阶段
4. **执行工具**：并行或串行执行工具调用，收集结果
5. **回传结果**：把工具执行结果作为新的消息追加到对话中
6. **继续循环**：回到步骤 1，直到 Claude 不再调用工具

这个循环里还藏着大量的**容错机制**：

- **自动压缩**：对话太长时自动触发 `/compact`，压缩上下文
- **max_output_tokens 恢复**：输出被截断时自动注入 "Resume directly — no apology, no recap" 让 Claude 接着写
- **413 错误恢复**：prompt 太长时自动触发压缩重试
- **Token 预算管理**：跟踪每轮消耗，在预算耗尽前优雅停止

```typescript
// query.ts 中的恢复机制（简化版）
if (isWithheldMaxOutputTokens(lastMessage)) {
  const recoveryMessage = createUserMessage({
    content: `Output token limit hit. Resume directly — no apology, 
              no recap. Pick up mid-thought if that is where the cut happened.`,
    isMeta: true,
  })
  // 注入恢复消息，继续循环
}
```

这段代码揭示了一个精妙的设计：当 Claude 的输出被截断时，系统不是简单地报错，而是**自动注入一条"继续写"的指令**，让 Claude 从断点处接着输出。用户甚至感知不到这个过程。

---

## 七大核心组件深度拆解

### 一、Tool 系统：Claude 的"双手"

Tool 系统是 Claude Code 最核心的能力层。**每一个 Claude 能做的动作，都是一个 Tool。**

#### 工具的定义结构

每个工具都是一个实现了 `Tool` 接口的对象，包含以下关键部分：

```typescript
type Tool = {
  name: string                    // 工具名称
  inputSchema: ZodSchema          // 输入参数的 Zod 校验 schema
  call(args, context)             // 执行逻辑
  checkPermissions(input, ctx)    // 权限检查
  isReadOnly(input)               // 是否只读（影响权限判断）
  isConcurrencySafe(input)        // 是否可以并发执行
  isDestructive(input)            // 是否有破坏性（删除、覆盖等）
  prompt(options)                 // 给 Claude 看的使用说明
  description(input, options)     // 工具描述
  maxResultSizeChars: number      // 结果最大字符数
  // ... 还有大量 UI 渲染方法
}
```

这个设计有几个亮点：

1. **自描述**：每个工具自带 `prompt()` 方法，生成给 Claude 看的使用说明。Claude 不需要"记住"怎么用工具，工具自己会告诉它。
2. **权限内建**：权限检查不是外挂的，而是工具自身的一部分。`BashTool` 执行 `rm -rf /` 和执行 `ls` 的权限要求完全不同。
3. **并发安全标记**：`isConcurrencySafe` 告诉系统这个工具能不能和其他工具同时执行。读文件可以并发，写文件不行。

#### 内置工具一览

Claude Code 内置了约 **40 个工具**，可以分为几大类：

**文件操作类：**
- `BashTool` — 执行 shell 命令（最强大也最危险的工具）
- `FileReadTool` — 读取文件（支持图片、PDF、Jupyter Notebook）
- `FileWriteTool` — 创建/覆盖文件
- `FileEditTool` — 部分修改文件（字符串替换，不是全量覆盖）
- `GlobTool` — 文件模式匹配搜索
- `GrepTool` — 基于 ripgrep 的内容搜索

**网络类：**
- `WebFetchTool` — 抓取网页内容
- `WebSearchTool` — 网络搜索

**智能体类：**
- `AgentTool` — 生成子智能体（最有趣的工具，后面详述）
- `SkillTool` — 执行技能
- `SendMessageTool` — 智能体间通信
- `TeamCreateTool` / `TeamDeleteTool` — 团队管理

**任务管理类：**
- `TaskCreateTool` / `TaskUpdateTool` — 任务创建和更新
- `TodoWriteTool` — 待办事项管理

**模式切换类：**
- `EnterPlanModeTool` / `ExitPlanModeTool` — 计划模式切换
- `EnterWorktreeTool` / `ExitWorktreeTool` — Git worktree 隔离

#### 工具搜索：延迟加载的智慧

40 个工具的 schema 全部塞进 system prompt 会消耗大量 token。Claude Code 的解决方案是 **ToolSearch**：

```typescript
// 部分工具标记为 shouldDefer: true
// 这些工具不会出现在初始 prompt 中
// Claude 需要先调用 ToolSearchTool 来"发现"它们

const ToolSearchTool = {
  name: 'ToolSearch',
  searchHint: 'find available tools by keyword',
  // Claude 通过关键词搜索找到需要的工具
}
```

这就像一个"工具商店"——Claude 不需要一开始就知道所有工具，需要的时候搜一下就行。这大幅减少了每次请求的 token 消耗。

#### `buildTool`：工具的工厂函数

所有工具都通过 `buildTool()` 工厂函数创建，它提供了安全的默认值：

```typescript
const TOOL_DEFAULTS = {
  isEnabled: () => true,
  isConcurrencySafe: () => false,    // 默认不安全（保守策略）
  isReadOnly: () => false,            // 默认假设会写入
  isDestructive: () => false,
  checkPermissions: () => ({ behavior: 'allow' }),
  toAutoClassifierInput: () => '',    // 默认跳过安全分类
}
```

注意 `isConcurrencySafe` 默认为 `false`——这是一个**失败安全（fail-safe）**的设计。如果开发者忘记标记，系统会假设工具不能并发执行，宁可慢一点也不出错。

---

### 二、Command 系统：用户的"遥控器"

Command 是用户通过 `/` 前缀直接调用的斜杠命令。和 Tool 不同，**Tool 是给 Claude 用的，Command 是给用户用的**。

#### Command 的三种类型

```typescript
type Command = 
  | PromptCommand     // 生成 prompt 发给 Claude（Skill 属于此类）
  | LocalCommand      // 本地执行，返回文本结果
  | LocalJSXCommand   // 本地执行，渲染 React/Ink UI
```

- **PromptCommand**：比如 `/review`，它会生成一段 prompt 发给 Claude，让 Claude 来做代码审查。Skill 就是这种类型。
- **LocalCommand**：比如 `/cost`，直接在本地计算并显示费用，不需要调用 Claude。
- **LocalJSXCommand**：比如 `/doctor`，渲染一个全屏的诊断界面。

#### 内置命令约 50 个

涵盖了日常开发的方方面面：

| 类别 | 命令 | 说明 |
|------|------|------|
| **Git** | `/commit`, `/diff`, `/pr_comments` | Git 操作 |
| **代码** | `/review`, `/compact`, `/context` | 代码相关 |
| **配置** | `/config`, `/mcp`, `/permissions` | 系统配置 |
| **会话** | `/resume`, `/share`, `/cost` | 会话管理 |
| **系统** | `/doctor`, `/login`, `/logout` | 系统操作 |
| **UI** | `/theme`, `/vim`, `/clear` | 界面定制 |
| **扩展** | `/skills`, `/plugin`, `/memory` | 扩展系统 |

#### 命令的加载优先级

```typescript
// commands.ts - loadAllCommands()
return [
  ...bundledSkills,           // 1. 内置技能（最高优先级）
  ...builtinPluginSkills,     // 2. 内置插件的技能
  ...skillDirCommands,        // 3. 磁盘上的技能
  ...workflowCommands,        // 4. 工作流命令
  ...pluginCommands,          // 5. 插件命令
  ...pluginSkills,            // 6. 插件技能
  ...COMMANDS(),              // 7. 内置命令（最低优先级）
]
```

这个优先级设计意味着：**用户自定义的技能可以覆盖内置命令**。如果你写了一个叫 `review` 的自定义技能，它会优先于内置的 `/review` 命令。

#### Feature Flag 驱动的条件加载

Claude Code 大量使用 Bun 的编译时 feature flag 来控制功能加载：

```typescript
import { feature } from 'bun:bundle'

// 编译时决定是否包含语音功能
const voiceCommand = feature('VOICE_MODE')
  ? require('./commands/voice/index.js').default
  : null

// 编译时决定是否包含 Proactive 模式
const proactive = feature('PROACTIVE')
  ? require('./commands/proactive/index.js').default
  : null
```

这不是运行时的 `if/else`，而是**编译时的死代码消除**。如果 `VOICE_MODE` 为 false，整个语音模块的代码都不会出现在最终产物中。这让 Claude Code 可以维护一个代码库，但根据不同的构建配置产出不同功能集的版本。

---

### 三、MCP（Model Context Protocol）：连接外部世界的"USB 接口"

MCP 是 Anthropic 提出的开放协议，让 AI 模型能够与外部工具和数据源交互。如果说 Tool 是 Claude Code 的"内置器官"，那 MCP 就是它的 **"USB 接口"**——任何人都可以开发一个 MCP Server，插上就能用。

#### MCP 的架构

```
┌─────────────────────────────────────────────┐
│              Claude Code (MCP Client)        │
│                                               │
│  ┌─────────────┐    ┌──────────────────┐    │
│  │ MCP Config   │    │ MCP Connection   │    │
│  │ (多层配置)    │───▶│ Manager          │    │
│  └─────────────┘    └───────┬──────────┘    │
│                             │                 │
│  ┌──────────────────────────▼──────────────┐ │
│  │         MCP Tool Pool                    │ │
│  │  mcp__github__create_issue               │ │
│  │  mcp__slack__send_message                │ │
│  │  mcp__jira__create_ticket                │ │
│  └──────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ MCP Protocol (JSON-RPC)
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ GitHub │  │  Slack   │  │  JIRA   │
│ Server │  │  Server  │  │  Server  │
└────────┘  └──────────┘  └──────────┘
```

#### 多层配置体系

MCP 服务器的配置支持 **6 个层级**，从低到高：

1. **enterprise** — 企业级配置（最高优先级，管理员控制）
2. **plugin** — 插件提供的 MCP 服务器
3. **user** — 用户全局配置（`~/.claude/`）
4. **project** — 项目配置（`.mcp.json`）
5. **local** — 本地配置
6. **dynamic** — 动态配置（命令行参数）

这意味着企业管理员可以强制所有员工使用特定的 MCP 服务器（比如内部代码审查工具），而员工无法覆盖。

#### 工具命名规范

MCP 工具在 Claude Code 内部使用三段式命名：

```
mcp__<server_name>__<tool_name>
```

比如 GitHub MCP Server 提供的 `create_issue` 工具，在 Claude Code 内部叫 `mcp__github__create_issue`。这避免了不同 MCP Server 之间的工具名冲突。

#### 连接状态管理

每个 MCP Server 连接有 5 种状态：

```typescript
type MCPServerConnection =
  | ConnectedMCPServer      // ✅ 已连接
  | FailedMCPServer         // ❌ 连接失败
  | NeedsAuthMCPServer      // 🔐 需要认证
  | PendingMCPServer        // ⏳ 等待连接
  | DisabledMCPServer       // 🚫 已禁用
```

系统会自动处理重连、认证流程，甚至支持 URL 请求的交互式授权。

#### MCP 与 Tool 系统的融合

MCP 工具和内置工具最终会被合并到同一个工具池中：

```typescript
export function assembleToolPool(permissionContext, mcpTools): Tools {
  const builtInTools = getTools(permissionContext)
  const allowedMcpTools = filterToolsByDenyRules(mcpTools, permissionContext)
  
  // 内置工具在前，MCP 工具在后
  // 同名时内置工具优先
  return uniqBy(
    [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
    'name',
  )
}
```

对 Claude 来说，内置工具和 MCP 工具没有区别——它们都是可以调用的工具。这种透明的集成是 MCP 设计的精髓。

---

### 四、Skill 系统：可复用的"工作流配方"

如果 Tool 是原子操作（读文件、执行命令），那 Skill 就是**由多个操作组成的工作流**。

#### Skill 的本质

Skill 本质上是一个 **Markdown 文件**（`SKILL.md`），里面包含了给 Claude 的指令。当 Claude 调用 `SkillTool` 时，系统会读取对应的 SKILL.md 内容，注入到对话上下文中，让 Claude 按照指令行事。

```
~/.claude/skills/
├── code-review/
│   └── SKILL.md          # "你是一个代码审查专家..."
├── test-writer/
│   └── SKILL.md          # "为给定代码编写单元测试..."
└── refactor/
    └── SKILL.md          # "按照 SOLID 原则重构代码..."
```

#### 四种 Skill 来源

| 来源 | 位置 | 特点 |
|------|------|------|
| **bundledSkills** | 编译在二进制中 | 随 CLI 分发，用户不可修改 |
| **skillDirCommands** | `~/.claude/skills/` 或项目 `.claude/skills/` | 用户自定义，支持动态发现 |
| **pluginSkills** | Plugin 提供 | 随插件安装 |
| **builtinPluginSkills** | 内置 Plugin 提供 | 内置插件的技能 |

#### Skill 的 Frontmatter

SKILL.md 支持 YAML frontmatter 来配置元数据：

```markdown
---
name: code-review
description: 深度代码审查，关注安全性和性能
allowedTools: [FileReadTool, GrepTool, BashTool]
model: claude-sonnet-4-20250514
paths: ["*.py", "*.ts"]
---

你是一个资深的代码审查专家。请按照以下步骤进行审查：
1. 首先理解代码的整体结构...
```

- **allowedTools**：限制 Skill 只能使用特定工具（安全沙箱）
- **model**：指定使用的模型（可以用更便宜的模型执行简单任务）
- **paths**：条件加载——只有当工作目录匹配时才激活

#### 动态发现机制

Claude Code 有一个巧妙的**动态 Skill 发现**机制：当 Claude 在读取文件时，系统会自动扫描文件路径上的 `.claude/skills/` 目录，发现新的 Skill 并加入可用列表。

```typescript
// 当 Claude 读取 /project/src/utils/helper.ts 时
// 系统会自动检查：
//   /project/src/utils/.claude/skills/
//   /project/src/.claude/skills/
//   /project/.claude/skills/
```

这意味着不同的子目录可以有不同的 Skill，实现了**目录级别的能力定制**。

#### Skill vs Command 的关系

```
                    Command (所有命令的总称)
                    ├── PromptCommand (prompt 类型)
                    │   ├── Skill ← 可被 Claude 主动调用
                    │   │   ├── bundledSkills
                    │   │   ├── skillDirCommands
                    │   │   └── pluginSkills
                    │   └── 普通 PromptCommand (如 /review)
                    ├── LocalCommand (如 /cost, /clear)
                    └── LocalJSXCommand (如 /doctor)
```

**所有 Skill 都是 Command，但不是所有 Command 都是 Skill。** Skill 的特殊之处在于它可以被 Claude 通过 `SkillTool` 主动调用，而普通 Command 只能由用户手动输入。

---

### 五、Plugin 系统：第三方扩展的"应用商店"

Plugin 是比 Skill 更重量级的扩展机制。一个 Plugin 可以同时提供多种能力：

```typescript
type LoadedPlugin = {
  skills?: BundledSkillDefinition[]              // 技能
  hooks?: HooksSettings                           // 钩子（拦截器）
  mcpServers?: Record<string, McpServerConfig>    // MCP 服务器
  commandsPath?: string                           // 自定义命令
  agentsPath?: string                             // 自定义 Agent 定义
}
```

#### 内置 Plugin vs 市场 Plugin

- **内置 Plugin**：随 CLI 分发，用户可以启用/禁用
- **市场 Plugin**：从 Git 仓库安装，提供更丰富的扩展

```typescript
// 内置 Plugin 注册
registerBuiltinPlugin({
  name: 'security-scanner',
  description: '自动安全扫描',
  defaultEnabled: true,
  skills: [securityScanSkill],
  hooks: { PostToolUse: [securityCheckHook] },
  mcpServers: { 'vuln-db': { command: 'vuln-db-server' } },
})
```

#### Plugin 的 Hooks 机制

Plugin 可以注册钩子来拦截 Claude Code 的各种事件。Hooks 支持两种执行方式：**Shell 脚本**和 **HTTP 请求**。

**Hook 事件类型：**

| 事件 | 触发时机 | 能做什么 |
|------|---------|---------|
| **PreToolUse** | 工具执行前 | 修改输入、阻止执行（exit code 2 = 阻止并告知模型） |
| **PostToolUse** | 工具执行后 | 分析结果、触发后续动作（exit code 2 = 将 stderr 发给模型） |
| **PostToolUseFailure** | 工具执行失败后 | 错误处理、降级逻辑 |
| **Notification** | 系统通知 | 外部集成（Slack 通知、日志记录等） |
| **Stop** | 对话即将结束 | 阻止结束、要求继续（如"测试还没跑完"） |

**Hook 的匹配机制：**

每个 Hook 可以通过 `matcher` 指定只对特定工具生效。比如一个 "auto-lint" Hook 可以配置为只在 `FileWriteTool` 和 `FileEditTool` 执行后触发：

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": { "tool_name": ["Write", "Edit"] },
      "command": "npx eslint --fix $FILE_PATH"
    }]
  }
}
```

**HTTP Hook：** 除了本地脚本，Hook 还支持 HTTP 方式——将事件 POST 到指定 URL。这让远程服务也能参与工具调用的拦截和处理。HTTP Hook 支持环境变量插值（如 `Authorization: Bearer $MY_TOKEN`），并有域名白名单安全策略。

这让 Plugin 能实现诸如"每次写文件后自动运行 linter"、"每次执行 bash 命令前检查安全性"、"代码变更后通知 Slack 频道"这样的自动化流程。

---

### 六、Agent Teams：多智能体协作的"项目团队"

这是 Claude Code 最前沿的功能之一——**让多个 Claude 实例像一个团队一样协作**。

#### 单 Agent 模式：AgentTool

最基础的多智能体能力是 `AgentTool`——主 Claude 可以生成一个子 Agent 来处理独立任务：

```
主 Claude (Leader)
  │
  ├── AgentTool("搜索所有 TODO 注释") → 子 Agent 1
  ├── AgentTool("分析测试覆盖率")     → 子 Agent 2
  └── AgentTool("检查依赖安全性")     → 子 Agent 3
```

子 Agent 有自己独立的对话上下文，但**工具集受限**——它不能再生成子 Agent（防止无限递归），也不能执行某些危险操作。

#### Coordinator 模式：真正的团队协作

更高级的是 **Coordinator 模式**，它把主 Claude 变成一个"项目经理"：

```
Coordinator (项目经理)
  │
  │  只能使用：AgentTool, SendMessageTool, TaskStopTool
  │  不能直接操作文件或执行命令
  │
  ├── Worker 1 (前端开发) ← 有完整工具集
  ├── Worker 2 (后端开发) ← 有完整工具集
  └── Worker 3 (测试工程师) ← 有完整工具集
```

Coordinator 遵循一个四阶段工作流：

1. **Research** — 先调研，理解任务
2. **Synthesis** — 综合信息，制定计划
3. **Implementation** — 分配任务给 Worker 并行执行
4. **Verification** — 验证结果，确保质量

#### In-Process Teammate：同进程的"队友"

`TeamCreateTool` 创建的是 **In-Process Teammate**——它们运行在同一个进程中，通过**邮箱系统（Mailbox）**通信：

```typescript
// Teammate 的主循环
while (!abortController.signal.aborted && !shouldExit) {
  // 1. 运行 agent 循环
  for await (const message of runAgent({...})) {
    // 处理消息
  }
  // 2. 等待下一条消息或 shutdown
  const waitResult = await waitForNextPromptOrShutdown(...)
}
```

Teammate 之间通过 `SendMessageTool` 发送消息，通过 `readMailbox` / `writeToMailbox` 实现异步通信。这种设计让多个 Agent 可以**真正并行工作**，而不是串行等待。

#### 权限同步

多 Agent 场景下的权限管理是个难题。Claude Code 的解决方案是 **Leader Permission Bridge**：

- Worker 需要执行敏感操作时，请求会被转发给 Leader
- Leader 决定是否批准（可能需要询问用户）
- 批准结果同步回 Worker

这确保了即使有多个 Agent 并行工作，用户仍然对所有敏感操作保持控制。

---

### 七、Memory 系统：Claude 的"长期记忆"

Memory 系统解决了一个根本问题：**Claude 的对话上下文是有限的，但项目知识是持久的。**

#### CLAUDE.md：项目级记忆

`CLAUDE.md` 是 Claude Code 最重要的记忆载体。它是一个 Markdown 文件，包含了项目的规则、偏好和上下文信息。

```markdown
# CLAUDE.md

## 项目规范
- 使用 TypeScript strict 模式
- 所有 API 响应必须使用 Zod 校验
- 提交信息遵循 Conventional Commits

## 架构说明
- 前端使用 React + Tailwind
- 后端使用 Express + Prisma
- 数据库使用 PostgreSQL

## 注意事项
- 不要修改 migrations/ 目录下的已有文件
- 测试文件放在 __tests__/ 目录下
```

#### 六层记忆加载

CLAUDE.md 的加载遵循严格的层级：

```
1. Managed    — 托管配置（企业管理员设置）
2. User       — 用户全局（~/.claude/CLAUDE.md）
3. Project    — 项目级别（从根目录到 CWD 的所有 CLAUDE.md）
   ├── /project/CLAUDE.md
   ├── /project/.claude/CLAUDE.md
   └── /project/.claude/rules/*.md
4. Local      — 本地配置（CLAUDE.local.md，不提交到 Git）
5. AutoMem    — 自动记忆（MEMORY.md，AI 自动提取的记忆）
6. TeamMem    — 团队记忆（team/MEMORY.md，团队共享的记忆）
```

这个设计非常精妙：

- **Managed** 层让企业管理员可以强制所有项目遵循特定规范
- **User** 层存储个人偏好（比如"我喜欢函数式编程风格"）
- **Project** 层存储项目特定的规则
- **Local** 层存储不想提交到 Git 的个人配置
- **AutoMem** 层是 AI 自动学习的记忆
- **TeamMem** 层是团队共享的知识库

#### 自动记忆提取

Claude Code 有一个**后台记忆提取机制**：每次对话结束后，系统会启动一个 **Forked Agent**（分叉的子 Agent），分析对话内容，自动提取有价值的记忆：

```typescript
// 记忆提取 Agent 只能使用受限工具
function createAutoMemCanUseTool(memoryDir: string): CanUseToolFn {
  return async (tool, input) => {
    // ✅ 允许：Read, Grep, Glob, 只读 Bash
    // ✅ 允许：在 memoryDir 内的 Edit/Write
    // ❌ 禁止：其他所有写操作
  }
}
```

提取的记忆分为四种类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| **user** | 用户角色和偏好 | "用户是前端工程师，偏好 React" |
| **feedback** | 用户反馈的行为指导 | "不要在代码中使用 any 类型" |
| **project** | 项目上下文和进度 | "正在迁移到 Next.js 14" |
| **reference** | 外部资源指针 | "API 文档在 docs.example.com" |

#### 团队记忆同步

`teamMemorySync` 实现了团队级别的记忆共享：

- **Pull**：从服务器拉取团队记忆到本地
- **Push**：将本地记忆推送到服务器
- **冲突解决**：本地优先 + 乐观锁 + Delta 上传

这意味着团队成员可以共享项目知识——一个人发现的"这个 API 有 bug，需要加 retry"的经验，会自动同步给所有团队成员的 Claude。

---

### 补充：Task 系统——后台任务的"进程管理器"

Claude Code 有一个完整的后台任务管理系统，类似操作系统的进程管理。你可以把它理解为 Claude 的 `ps` 和 `kill` 命令。

#### 七种任务类型

```typescript
type TaskType =
  | 'local_bash'            // 后台 Shell 命令（如 npm run build）
  | 'local_agent'           // 本地子 Agent（AgentTool 生成的）
  | 'remote_agent'          // 远程 Agent（跨机器协作）
  | 'in_process_teammate'   // 同进程队友（TeamCreateTool 创建的）
  | 'local_workflow'        // 本地工作流脚本
  | 'monitor_mcp'           // MCP 监控任务
  | 'dream'                 // "做梦"任务（后台思考/预处理）
```

每种任务类型都有独立的实现文件和状态管理。比如 `LocalShellTask` 管理后台 Shell 命令，`LocalAgentTask` 管理子 Agent 的生命周期。

#### 五种任务状态

```
pending → running → completed
                  → failed
                  → killed
```

```typescript
// 判断任务是否已终结
function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'killed'
}
```

#### 任务 ID 设计

每个任务 ID 都有类型前缀，方便快速识别：

| 前缀 | 类型 | 示例 |
|------|------|------|
| `b` | local_bash | `b3k9m2x1` |
| `a` | local_agent | `a7f2n5p8` |
| `r` | remote_agent | `r1c4h6w3` |
| `t` | in_process_teammate | `t9d8e2q4` |
| `w` | local_workflow | `w5g1j7v6` |
| `m` | monitor_mcp | `m2b6k4r9` |
| `d` | dream | `d8f3n1x5` |

ID 使用 `randomBytes(8)` 生成，36^8 ≈ 2.8 万亿种组合，足以抵抗暴力猜测攻击。

#### 前台/后台切换

`LocalAgentTask` 支持前台/后台切换——类似终端的 `Ctrl+Z` 和 `fg`：

- Agent 运行时间过长时，UI 会显示 `BackgroundHint`，提示用户可以将其放到后台
- 后台任务通过 `pendingMessages` 队列接收新消息
- 用户可以随时通过 `/tasks` 命令查看所有后台任务的状态
- 任务完成后会通过通知系统告知用户

---

## 权限系统：安全的"守门人"

Claude Code 的权限系统是整个架构中最关键的安全层。每一次工具调用都要经过权限检查。

### 权限模式

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| **default** | 危险操作需要用户确认 | 日常使用 |
| **plan** | 只允许只读操作，写操作全部阻止 | 代码审查、分析 |
| **auto** | 自动批准大部分操作 | 信任环境下的自动化 |
| **bypassPermissions** | 跳过所有权限检查 | CI/CD 环境 |

### 权限检查流程

```
工具调用请求
  │
  ▼
1. validateInput()     ← 工具自身的输入校验
  │
  ▼
2. checkPermissions()  ← 工具自身的权限逻辑
  │
  ▼
3. PreToolUse Hooks    ← Plugin 注册的前置钩子
  │
  ▼
4. Permission Rules    ← 用户配置的权限规则
  │
  ▼
5. User Prompt         ← 如果以上都没有明确结论，询问用户
  │
  ▼
执行工具
```

### 权限规则示例

用户可以配置细粒度的权限规则：

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",           // 允许所有 git 命令
      "Bash(npm test)",        // 允许 npm test
      "FileRead",              // 允许所有文件读取
      "Grep"                   // 允许所有搜索
    ],
    "deny": [
      "Bash(rm *)",            // 禁止所有 rm 命令
      "mcp__production_db__*"  // 禁止生产数据库的所有操作
    ]
  }
}
```

---

## 性能优化：毫秒级的启动体验

Claude Code 在性能优化上下了很大功夫：

### 并行预取

```typescript
// main.tsx — 在其他 import 之前就开始预取
startMdmRawRead()        // 预读 MDM 配置
startKeychainPrefetch()  // 预读 Keychain
```

这些预取操作作为**副作用**在模块加载阶段就开始执行，不等其他模块加载完成。

### 懒加载

重量级模块（OpenTelemetry、gRPC、分析服务）通过动态 `import()` 延迟加载：

```typescript
// 只有真正需要时才加载 OpenTelemetry
const otel = await import('@opentelemetry/api')
```

### 编译时死代码消除

通过 Bun 的 `bun:bundle` feature flag，未启用的功能在编译时就被完全移除。这不是运行时的 `if/else`，而是编译器级别的代码剪枝——未激活的分支连 JavaScript 产物都不会出现。

从源码中可以识别出至少 **20+ 个 feature flag**，它们控制着 Claude Code 的功能边界：

| Flag | 控制的功能 |
|------|-----------|
| `PROACTIVE` | 主动模式（Claude 主动发起操作） |
| `KAIROS` | 后台会话 + 推送通知 + GitHub Webhook |
| `COORDINATOR_MODE` | 多 Agent 协调器模式 |
| `BRIDGE_MODE` | IDE 桥接模式 |
| `VOICE_MODE` | 语音输入 |
| `AGENT_TRIGGERS` | 定时触发器（Cron） |
| `MONITOR_TOOL` | MCP 监控工具 |
| `WORKFLOW_SCRIPTS` | 工作流脚本引擎 |
| `WEB_BROWSER_TOOL` | 浏览器操作工具 |
| `TERMINAL_PANEL` | 终端面板捕获 |
| `CONTEXT_COLLAPSE` | 上下文折叠（智能压缩） |
| `UDS_INBOX` | Unix Domain Socket 收件箱（进程间通信） |
| `HISTORY_SNIP` | 历史记录裁剪 |
| `BG_SESSIONS` | 后台会话管理 |
| `TOKEN_BUDGET` | Token 预算控制 |
| `CHICAGO_MCP` | Computer Use（屏幕操作） |
| `FORK_SUBAGENT` | 分叉子 Agent |
| `BUDDY` | 伴侣精灵（趣味功能） |
| `MCP_SKILLS` | MCP 技能发现 |
| `OVERFLOW_TEST_TOOL` | 溢出测试工具 |
| `DAEMON` | 守护进程模式 |

```typescript
// 示例：COORDINATOR_MODE 控制整个多 Agent 协调系统
const coordinatorModeModule = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null

// 示例：KAIROS 控制后台会话 + 推送通知 + GitHub Webhook
const PushNotificationTool = feature('KAIROS')
  ? require('./tools/PushNotificationTool/PushNotificationTool.js').PushNotificationTool
  : null
```

这种设计让 Anthropic 可以维护**一个代码库、多种产品形态**——面向普通用户的版本可能只有基础功能，而内部版本或企业版本可以开启更多高级特性。

### Prompt Cache 优化

工具池的排序策略经过精心设计，确保内置工具始终作为连续前缀出现，最大化 Anthropic API 的 prompt cache 命中率：

```typescript
// 内置工具排序后作为前缀，MCP 工具排序后追加
// 这样即使 MCP 工具变化，内置工具部分的 cache 仍然有效
return uniqBy(
  [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
  'name',
)
```

---

## 成本追踪：精确到美分的账单

Claude Code 内置了完整的成本追踪系统：

```typescript
// 追踪维度
- 总费用（USD）
- 按模型分类的 token 用量
- 输入/输出/缓存读取/缓存写入 token
- Web 搜索请求次数
- API 调用耗时
- 工具执行耗时
- 代码变更行数（新增/删除）
```

每次 API 调用后，系统会根据模型和 token 类型精确计算费用，并在会话结束时显示完整的费用报告。费用数据还会持久化到项目配置中，支持跨会话累计。

---

## Bridge 系统：IDE 集成的"桥梁"

Claude Code 不仅是一个独立的 CLI 工具，它还能与 VS Code、JetBrains 等 IDE 深度集成。这通过 **Bridge 系统**实现：

```
┌──────────────┐         ┌──────────────┐
│   VS Code    │◄───────►│  Claude Code │
│  Extension   │  Bridge │    CLI       │
└──────────────┘  (JWT)  └──────────────┘
```

- **bridgeMain.ts** — Bridge 主循环
- **bridgeMessaging.ts** — 消息协议（双向通信）
- **bridgePermissionCallbacks.ts** — 权限回调（IDE 中弹出确认对话框）
- **jwtUtils.ts** — JWT 认证（确保通信安全）

Bridge 让 Claude Code 可以：
- 在 IDE 中直接显示 Claude 的输出
- 通过 IDE 的 UI 进行权限确认
- 访问 IDE 的语言服务（LSP）获取更精确的代码理解

---

## 总结：Claude Code 的设计哲学

从源码中可以提炼出几个核心设计哲学：

### 1. 失败安全（Fail-Safe）
- 工具默认不可并发、默认非只读
- 权限默认需要确认
- 记忆提取 Agent 的工具集严格受限

### 2. 渐进式复杂度
- 简单任务：一个 Claude + 几个工具
- 中等任务：Claude + AgentTool 生成子 Agent
- 复杂任务：Coordinator + 多个 Worker 并行

### 3. 可扩展性优先
- Tool 系统：内置 + MCP + Plugin
- Command 系统：内置 + Skill + Plugin
- Memory 系统：6 层配置 + 自动提取 + 团队同步

### 4. 用户控制权
- 每一步都可以被用户拦截
- 权限规则支持细粒度配置
- 企业管理员可以强制策略

### 5. 性能意识
- 并行预取、懒加载、编译时死代码消除
- Prompt cache 优化
- ToolSearch 延迟加载

Claude Code 不是一个简单的"AI 套壳"，而是一个**精心设计的智能体操作系统**。它的每一个组件都经过深思熟虑，在安全性、可扩展性和性能之间取得了精妙的平衡。理解了这些设计，你就理解了当前 AI 编程工具的最前沿实践。

---

*本文基于公开可获取的源码快照进行分析，仅用于技术研究和学习目的。*
