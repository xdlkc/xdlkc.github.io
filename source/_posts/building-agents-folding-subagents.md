---
title: "构建智能体：何时将子智能体并入主智能体循环"
date: "2026-10-28 23:30:57"
permalink: 2026/10/28/building-agents-folding-subagents/
tags:
  - Agent
  - Subagents
  - Skills
  - Claude
categories:
  - Agent 工程
description: "在 Claude Platform 中构建智能体时，减少子智能体（Subagents）的数量、转而采用渐进式披露（Progressive Disclosure）的上下文与工具，不仅能提升输出质量，还能降低成本与延迟。本文将介绍何时以及如何进行迁移。"
excerpt: "在 Claude Platform 中构建智能体时，减少子智能体（Subagents）的数量、转而采用渐进式披露（Progressive Disclosure）的上下文与工具，不仅能提升输出质量，还能降低成本与延迟。本文将介绍何时以及如何进行迁移。"
---

{% raw %}
<link rel="stylesheet" href="/uploads/building-agents-folding-subagents/article-v2.css?v=single-column-2">
<div class="folding-v2" id="folding-article">

    <!-- Hero Title & Deck -->
    <header class="hero-section">

      <p class="en-sub hero-en-subtitle"><a href="https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop" rel="noopener noreferrer" target="_blank">Building agents: When to fold subagents into your main agent loop</a></p>
      <p class="hero-deck">
        在 Claude Platform 中构建智能体时，减少子智能体（Subagents）的数量、转而采用渐进式披露（Progressive Disclosure）的上下文与工具，不仅能提升输出质量，还能降低成本与延迟。本文将介绍何时以及如何进行迁移。
      </p>
    </header>

    <!-- Single-column article body -->
    <div class="article-grid">

<!-- Main article content -->
      <article class="article-body">

        <!-- 1:1 Original Anthropic Callout Box: Pure italic paragraph, NO bulleted header -->
        <div class="anthropic-callout">
          如果你已在 Claude Platform 中构建了包含多个子智能体的智能体系统，可以使用我们的<a href="https://github.com/anthropics/claude-cookbooks" rel="noopener noreferrer" target="_blank">迁移工具包（Migration Kit）</a>来评估哪些子智能体适合并入主智能体循环。该工具包会运行一套引导式工作流，用于识别现有架构模式、评估替代方案并验证最佳路径，同时还附带一个可在接入真实智能体前先行试用的模拟系统演示（Demo）。
          <span class="en-sub" style="display:block;margin-top:8px;font-size:13.5px;color:#6E6C65;">
            If you have built an agent with subagents in the Claude Platform, you can use our Migration Kit to evaluate which subagents to fold into your main agent loop. It runs a guided workflow to identify patterns, evaluate alternatives, and validate the best path, with a demo on a mock system you can try before running it on your own agent.
          </span>
        </div>

        <p>
          子智能体（Subagents）——即拥有独立上下文窗口、专属工具集和指令，并由协调器（Coordinator）统一编排的智能体——是智能体架构设计的核心组件。它们在结果验证、并行任务处理以及模块化权限控制方面表现出色。我们在使用 Claude Platform 构建的诸多内部智能体中也广泛采用了子智能体，例如我们的多智能体研究系统（Multi-agent Research System）。
        </p>
        <p>
          然而，近期我们的应用 AI（Applied AI）团队在多个企业级智能体部署案例中发现了一种普遍趋势：将路由器（Routers）、规划器（Planners）以及各领域子智能体（Domain Subagents）并入主智能体循环（Main Agent Loop）往往能带来显著收益。在对多个企业部署进行的对比评测中，<strong>搭载技能（Skills）的单智能体架构</strong>在输出质量上频繁优于“单提示词包揽一切（One-prompt-for-everything）”设计和“多子智能体（Subagent）”设计，且单次任务的成本与延迟通常更低。
        </p>
        <p>
          例如，某家企业发现其面向客户的智能体内部包含了十几个专家子智能体，这不仅导致难以维持一致的品牌体验与沟通语调，还引入了明显损害用户体验的响应延迟。
        </p>
        <p>
          此外，我们也经常看到许多拟议的智能体设计方案遵循着一套似曾相识的演进路径：底层是意图分类器、固定的多步推理流水线、用户分群桶（User-segment buckets）以及各自独立的推荐分支，顶层再架设一个多智能体编排器（Multi-agent Orchestrator）。
        </p>
        <p>
          在这些案例中，实践反馈往往表明：上述绝大部分架构结构都在替模型做它如今早已不再需要外部代劳的工作；实际上，仅需<strong>一份清晰的系统提示词（System Prompt）、4 至 5 个轻量级数据工具（Thin Data Tools）以及明确的输出护栏（Output Guardrails）</strong>，就足以覆盖绝大多数业务场景。
        </p>

        <!-- ====================================================================== -->
        <!-- DIAGRAM 1: Clean Card (NO Extra Toolbar Header), Locked SVG            -->
        <!-- ====================================================================== -->
        <figure class="diagram-figure">
          <div class="diagram-card">
            <svg aria-label="5 layers vs 1 loop architecture animation" style="width:100%;height:auto;display:block;user-select:none;" viewBox="0 0 1080 535">
              <defs>
                <marker id="arrowGrey" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="8" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#9E9C94"></path>
                </marker>
              </defs>

              <!-- Center Vertical Divider -->
              <line stroke="#DCDAD2" stroke-width="1.2" x1="530" x2="530" y1="18" y2="515"></line>

              <!-- ==================== LEFT HALF: 5 LAYERS ==================== -->
              <text class="mono-svg" fill="#6E6C65" font-size="11.5" x="28" y="34">COMMON PATTERN · 常见模式</text>
              <text fill="#4A4945" font-size="25" font-weight="700" text-anchor="end" x="502" y="64">5 层架构 (5 layers)</text>
              <text fill="#6E6C65" font-size="12.5" text-anchor="end" x="502" y="90">围绕模型构建的外部结构 (of structure around the model)</text>

              <!-- REQUEST -->
              <text class="mono-svg" fill="#6E6C65" font-size="11.5" text-anchor="middle" x="265" y="122">REQUEST · 请求</text>

              <!-- ALL LEFT CONNECTING LINES & ARROWS -->
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="265" x2="265" y1="130" y2="152"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="98" x2="98" y1="196" y2="226"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="168" x2="204" y1="250" y2="250"></line>
              <line stroke="#9E9C94" stroke-width="1.4" x1="208" x2="495" y1="250" y2="250"></line>

              <!-- Step 5 bottom -> Branching horizontal bus -> 3 User-segment buckets -->
              <path d="M 475 272 L 475 292 L 98 292" fill="none" stroke="#9E9C94" stroke-width="1.4"></path>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="98" x2="98" y1="292" y2="310"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="265" x2="265" y1="292" y2="310"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="432" x2="432" y1="292" y2="310"></line>

              <!-- 3 User-segment buckets -> 3 Recommendation branches -->
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="98" x2="98" y1="364" y2="386"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="265" x2="265" y1="364" y2="386"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="432" x2="432" y1="364" y2="386"></line>

              <!-- Bottom merge U-bus -> ANSWER -->
              <path d="M 98 440 L 98 458 L 432 458 L 432 440" fill="none" stroke="#9E9C94" stroke-width="1.4"></path>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="265" x2="265" y1="440" y2="482"></line>

              <!-- Animated Coral Packet on Left Side (Underneath boxes) -->
              <path d="M 265 130 L 265 175 L 98 175 L 98 250 L 475 250 L 475 292 L 265 292 L 265 482" fill="none" id="leftFlowPath" stroke="none"></path>
              <rect fill="#C6532D" height="10" width="10" x="-5" y="-5">
                <animateMotion dur="5.6s" repeatCount="indefinite" rotate="none">
                  <mpath href="#leftFlowPath"></mpath>
                </animateMotion>
              </rect>

              <!-- ALL LEFT OPAQUE NODE BOXES & LABELS -->
              <rect fill="#CCC9C0" height="42" width="474" x="28" y="154"></rect>
              <rect fill="#C6532D" height="9" width="9" x="93" y="170"></rect>
              <text fill="#191918" font-size="13.5" font-weight="600" text-anchor="middle" x="272" y="180">多智能体编排器 (Multi-agent orchestrator)</text>

              <rect fill="#E3E1D8" height="44" width="140" x="28" y="228"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="98" y="247">意图分类器</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="98" y="263">Intent classifier</text>

              <text class="mono-svg" fill="#6E6C65" font-size="10" text-anchor="middle" x="355" y="217">FIXED MULTI-STEP REASONING PIPELINE · 固定多步推理流水线</text>

              <rect fill="#DBD8CF" height="44" width="46" x="208" y="228"></rect>
              <text fill="#191918" font-size="14" font-weight="600" text-anchor="middle" x="231" y="255">1</text>

              <rect fill="#DBD8CF" height="44" width="46" x="268" y="228"></rect>
              <text fill="#191918" font-size="14" font-weight="600" text-anchor="middle" x="291" y="255">2</text>

              <rect fill="#DBD8CF" height="44" width="46" x="328" y="228"></rect>
              <text fill="#191918" font-size="14" font-weight="600" text-anchor="middle" x="351" y="255">3</text>

              <rect fill="#DBD8CF" height="44" width="46" x="388" y="228"></rect>
              <text fill="#191918" font-size="14" font-weight="600" text-anchor="middle" x="411" y="255">4</text>

              <rect fill="#DBD8CF" height="44" width="54" x="448" y="228"></rect>
              <text fill="#191918" font-size="14" font-weight="600" text-anchor="middle" x="475" y="255">5</text>

              <!-- Layer 3: 3 User-segment bucket boxes -->
              <rect fill="#E3E1D8" height="52" width="140" x="28" y="312"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="98" y="334">用户分群桶</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="98" y="352">User-segment bucket</text>

              <rect fill="#E3E1D8" height="52" width="140" x="195" y="312"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="265" y="334">用户分群桶</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="265" y="352">User-segment bucket</text>

              <rect fill="#E3E1D8" height="52" width="140" x="362" y="312"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="432" y="334">用户分群桶</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="432" y="352">User-segment bucket</text>

              <!-- Layer 4: 3 Recommendation branch boxes -->
              <rect fill="#E3E1D8" height="52" width="140" x="28" y="388"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="98" y="410">推荐分支</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="98" y="428">Recommendation branch</text>

              <rect fill="#E3E1D8" height="52" width="140" x="195" y="388"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="265" y="410">推荐分支</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="265" y="428">Recommendation branch</text>

              <rect fill="#E3E1D8" height="52" width="140" x="362" y="388"></rect>
              <text fill="#191918" font-size="12.5" font-weight="600" text-anchor="middle" x="432" y="410">推荐分支</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="432" y="428">Recommendation branch</text>

              <text class="mono-svg" fill="#6E6C65" font-size="11.5" text-anchor="middle" x="265" y="502">ANSWER · 回答</text>


              <!-- ==================== RIGHT HALF: 1 LOOP ==================== -->
              <text class="mono-svg" fill="#6E6C65" font-size="11.5" x="558" y="34">WHAT WE OFTEN RECOMMEND · 我们通常推荐的方案</text>
              <text fill="#C6532D" font-size="25" font-weight="700" text-anchor="end" x="1052" y="64">1 个主循环 (1 loop)</text>
              <text fill="#6E6C65" font-size="12.5" text-anchor="end" x="1052" y="90">一份提示词、4–5 个工具、输出护栏 (one prompt, 4–5 tools, guardrails)</text>

              <text class="mono-svg" fill="#6E6C65" font-size="11.5" text-anchor="middle" x="720" y="122">REQUEST · 请求</text>

              <!-- Pale Peach Container: Single agent loop -->
              <rect fill="#F4DFD5" height="256" width="494" x="558" y="154"></rect>
              <text fill="#191918" font-size="14" font-weight="700" x="578" y="182">单智能体循环 (Single agent loop)</text>

              <!-- ALL RIGHT CONNECTING LINES & ARROWS -->
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="720" x2="720" y1="130" y2="272"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="642" x2="642" y1="252" y2="272"></line>

              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="748" x2="892" y1="290" y2="290"></line>
              <text class="mono-svg" fill="#6E6C65" font-size="10" text-anchor="middle" x="822" y="279">TOOL CALLS · 工具调用</text>

              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="896" x2="752" y1="312" y2="312"></line>
              <text class="mono-svg" fill="#6E6C65" font-size="10" text-anchor="middle" x="822" y="329">RESULTS · 返回结果</text>

              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="720" x2="720" y1="328" y2="348"></line>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.4" x1="720" x2="720" y1="390" y2="482"></line>

              <!-- Animated Coral Packet on Right Side -->
              <path d="M 756 290 L 886 290 L 886 312 L 756 312 Z" fill="none" id="rightFlowPath" stroke="none"></path>
              <rect fill="#C6532D" height="9" width="9" x="-4.5" y="-4.5">
                <animateMotion dur="2.4s" repeatCount="indefinite" rotate="none">
                  <mpath href="#rightFlowPath"></mpath>
                </animateMotion>
              </rect>

              <!-- ALL RIGHT OPAQUE NODE BOXES & LABELS -->
              <rect fill="#FFFFFF" height="54" width="136" x="578" y="198"></rect>
              <text fill="#191918" font-size="12" font-weight="600" text-anchor="middle" x="646" y="221">一份清晰的系统提示词</text>
              <text fill="#6E6C65" font-size="10.2" text-anchor="middle" x="646" y="239">One clear system prompt</text>

              <rect fill="#FFFFFF" height="54" width="170" x="578" y="274"></rect>
              <text fill="#191918" font-size="15" font-weight="700" text-anchor="middle" x="663" y="306">模型 (Model)</text>

              <text fill="#191918" font-size="12" font-weight="600" text-anchor="middle" x="967" y="256">4–5 个轻量级数据工具</text>
              <text fill="#6E6C65" font-size="10.2" text-anchor="middle" x="967" y="272">(4–5 thin data tools)</text>
              <rect fill="#C96F53" height="28" width="22" x="900" y="285"></rect>
              <rect fill="#C96F53" height="28" width="22" x="928" y="285"></rect>
              <rect fill="#C96F53" height="28" width="22" x="956" y="285"></rect>
              <rect fill="#C96F53" height="28" width="22" x="984" y="285"></rect>
              <rect fill="none" height="28" stroke="#C6532D" stroke-dasharray="3,3" stroke-width="1.4" width="22" x="1012" y="285"></rect>

              <rect fill="#FFFFFF" height="40" width="456" x="578" y="350"></rect>
              <text fill="#191918" font-size="13.5" font-weight="600" text-anchor="middle" x="806" y="375">明确的输出护栏 (Firm output guardrails)</text>

              <text class="mono-svg" fill="#6E6C65" font-size="11.5" text-anchor="middle" x="720" y="502">ANSWER · 回答</text>
            </svg>
          </div>
        </figure>

        <p>
          需要明确的是，子智能体依然有其不可替代的用武之地（包括在前沿研究领域）。在以下场景中，仍应使用子智能体：
        </p>
        <ul>
          <li>单智能体循环因上下文膨胀（Context Bloat）而出现可量化的性能退化；或</li>
          <li>需要使用独立的全新上下文窗口并行处理多项任务，且这些窗口在任务完成后即可直接丢弃；或</li>
          <li>单个智能体难以从大量工具中准确选择合适工具，或系统提示词中存在相互冲突的指令。</li>
        </ul>
        <p>
          但我们在实践中过于频繁地看到，许多企业为每个团队或每类问题都单独分配一个子智能体，最终导致智能体架构完全演变成企业组织架构图的翻版（即“康威定律 Conway's Law”在智能体设计中的体现）。
        </p>
        <p>
          本文将结合我们在大型组织中构建智能体所积累的最佳实践，详细阐述何时应考虑将子智能体并入主智能体循环。
        </p>

        <!-- Section 1 -->
        <h2 class="serif-heading" id="folding-section-1">
          大型组织构建智能体的常见失效模式
          <span class="en-sub">Agent building failure modes for large organizations</span>
        </h2>
        <p>
          企业通常希望构建一个能够将多项产品与业务能力整合到单一客户交互界面中的统一智能体。
        </p>
        <p>
          通常情况下，每项业务能力归属于不同的团队，因此企业最初往往让各个团队分别构建自己的专属智能体，随后再由中央平台团队在顶层构建一个编排器（Orchestrator）。这种做法可以衍生出多种架构形态，包括“编排器-子智能体（Orchestrator-Subagent）”架构，或将特定智能体封装为 MCP 工具暴露给单个主智能体。
        </p>
        <p>
          这看似是最简单直接的解决方案，但会立刻在以下几个维度引入严重的复杂性：
        </p>
        <ul>
          <li><strong>上下文管理（Context management）</strong>：你必须决定在智能体之间交换哪些上下文信息，而在多轮往返传递中往往会丢失关键细节。</li>
          <li><strong>子智能体泛滥（Subagent sprawl）</strong>：每个团队都发布自己的子智能体，导致企业最终堆积了数百个功能重叠的子智能体，既缺乏强制执行的统一标准，也没有明确的端到端负责人。</li>
          <li><strong>拼凑式提示词（The Frankenprompt）</strong>：每个团队都往系统提示词里添加一句话，最终导致规则相互冲突，且丧失了统一的沟通语调。</li>
          <li><strong>缺乏审核且过度局部的评测（Unvetted, overly localized evals）</strong>：每个人都添加仅针对自身子任务过度优化的评测集（Evals）。没有人拥有或维护全局评测集，管理层只能依据被稀释的、过度局部化的评分做出决策。</li>
          <li><strong>高延迟（Latency）</strong>：多智能体架构的复杂性显著增加了响应延迟。某位客户在将其多智能体运行框架（Multi-agent Harness）与单智能体循环进行对比评测时发现，后者的运行速度大约快了 <strong>2 倍</strong>。</li>
        </ul>

        <!-- Section 2 -->
        <h2 class="serif-heading" id="folding-section-2">
          采用具备渐进式披露能力的单智能体循环
          <span class="en-sub">Using an agent loop with progressive disclosure</span>
        </h2>
        <p>
          上述“编排器-子智能体”设计确实是跨团队协调专家模块的一种合理思路，但往往更高效的方案是：<strong>通过技能（Skills）渐进式披露上下文，并通过工具搜索（Tool Search）渐进式披露工具</strong>。换言之，智能体在初始状态下仅看到技能与工具的简短描述，唯有在实际需要时才会完整加载其详细内容。
        </p>
        <p>这一方案之所以行之有效，主要有以下三点原因：</p>
        <ul>
          <li><strong>共享上下文能够产出更优质的回答（Shared context produces better answers）</strong>：对于长周期运行的智能体而言，我们希望来自不同子任务的上下文能够留存在同一个主上下文窗口中。一个亲历了前面每一步执行结果的智能体能够将这些信息串联起来，从而产出比各子智能体传回的摘要汇总更加丰富、更具洞察力的结果。同时，这也意味着更少的上下文窗口切换和更少的有损交接（Lossy Handoffs）。</li>
          <li><strong>渐进式披露可防止上下文膨胀（Progressive disclosure prevents context bloat）</strong>：借助这一技术，团队可以构建出能够胜任广泛任务的单一智能体，而无需将所有上下文立刻加载到一段冗长的系统提示词中。这彻底消除了此前各团队不得不将工作拆分给多个子智能体的核心动因。事实上，针对更先进的模型，我们将 Claude Code 的系统提示词精简了 <strong>80% 以上</strong>，其中就包括将大量内容改为通过技能和工具进行渐进式披露。</li>
          <li><strong>模型能力显著增强（Models are more capable）</strong>：从 Opus 4.5 开始，模型在单一循环中能够自主管理的复杂度远超大多数团队的预期。在 Opus 5.5 和 Fable 5.1 中，思考（Thinking）模式已不可关闭，且新一代模型越来越擅长在执行过程中主动叙述进度并自检工作成果，这使得运行框架（Harness）中的许多外部控制组件变得冗余。每一次模型升级，都允许你将更多的决策逻辑从外部框架移交回模型自身。此外，更精简的循环也更容易平滑升级到下一代模型——在我们协助客户完成的多次迁移中，僵化的多智能体结构往往正是阻碍新模型承担更多工作的瓶颈。</li>
        </ul>
        <p>
          当然，单智能体循环设计需要严格的工程纪律：精心管理的系统提示词、能够在恰当时机精准触发的技能与工具描述，以及对上下文窗口、记忆（Memory）与笔记记录（Note-taking）的审慎处理。本文将在后续章节深入探讨迁移步骤与设计考量。
        </p>
        <p>
          应当由<strong>一个中央团队</strong>统一负责端到端质量和系统提示词，并在每个新工具和评测集上线前进行严格把关。保持该中央团队精简有助于加快迭代速度，并降低大型组织内部的跨团队协调成本。
        </p>
        <p>
          如果你确实需要采用多智能体路线，请从能够奏效的最简模式（如“生成器-验证器 Generator-Verifier”、“编排器-子智能体 Orchestrator-Subagent”或其他模式）起步。<strong>通过按上下文划分来有效解耦边界</strong>：为每个子智能体分配几乎不需要依赖系统其余部分的独立工作单元，并让其仅返回一个紧凑的结果（理想的候选场景包括：独立的研究路径、具备清晰接口的独立组件，或黑盒验证）。相反，当智能体按“问题类型”拆分时，它们就会陷入一场“传话游戏（Telephone Game）”，在反复的信息传递中每经过一次交接就会损耗一次保真度。
        </p>

        <!-- ====================================================================== -->
        <!-- DIAGRAM 2: Clean Card, Pure Locked SVG                                 -->
        <!-- ====================================================================== -->
        <figure class="diagram-figure">
          <div class="diagram-card">
            <svg aria-label="Split by problem type vs split by context" style="width:100%;height:auto;display:block;user-select:none;" viewBox="0 0 1080 415">
              <!-- ==================== TOP HALF: SPLIT BY PROBLEM TYPE ==================== -->
              <text class="mono-svg" fill="#6E6C65" font-size="11.5" x="28" y="32">SPLIT BY PROBLEM TYPE · 按问题类型拆分</text>

              <!-- Handoff Arrow 1 (x=288 to x=402) -->
              <text class="mono-svg" fill="#6E6C65" font-size="10.5" text-anchor="middle" x="345" y="78">HANDOFF · 交接</text>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.5" x1="288" x2="402" y1="92" y2="92"></line>
              <path d="M 294 92 L 392 92" fill="none" id="d2Handoff1" stroke="none"></path>
              <rect fill="#C6532D" height="9" width="9" x="-4.5" y="-4.5">
                <animateMotion dur="2.2s" repeatCount="indefinite" rotate="none">
                  <mpath href="#d2Handoff1"></mpath>
                </animateMotion>
              </rect>

              <!-- Handoff Arrow 2 (x=666 to x=780) -->
              <text class="mono-svg" fill="#6E6C65" font-size="10.5" text-anchor="middle" x="723" y="78">HANDOFF · 交接</text>
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.5" x1="666" x2="780" y1="92" y2="92"></line>
              <path d="M 672 92 L 770 92" fill="none" id="d2Handoff2" stroke="none"></path>
              <rect fill="#C6532D" height="9" opacity="0.65" width="9" x="-4.5" y="-4.5">
                <animateMotion dur="2.6s" repeatCount="indefinite" rotate="none">
                  <mpath href="#d2Handoff2"></mpath>
                </animateMotion>
              </rect>

              <!-- Agent 1 Box -->
              <rect fill="#E9E5DC" height="84" rx="8" width="260" x="28" y="50"></rect>
              <text fill="#191918" font-size="14.5" font-weight="700" text-anchor="middle" x="158" y="84">智能体 1 (Agent 1)</text>
              <text fill="#6E6C65" font-size="12.5" text-anchor="middle" x="158" y="111">编写功能代码 (Writes the feature)</text>

              <!-- Agent 2 Box -->
              <rect fill="#E9E5DC" height="84" rx="8" width="260" x="406" y="50"></rect>
              <text fill="#191918" font-size="14.5" font-weight="700" text-anchor="middle" x="536" y="84">智能体 2 (Agent 2)</text>
              <text fill="#6E6C65" font-size="12.5" text-anchor="middle" x="536" y="111">编写测试代码 (Writes the tests)</text>

              <!-- Agent 3 Box -->
              <rect fill="#E9E5DC" height="84" rx="8" width="268" x="784" y="50"></rect>
              <text fill="#191918" font-size="14.5" font-weight="700" text-anchor="middle" x="918" y="84">智能体 3 (Agent 3)</text>
              <text fill="#6E6C65" font-size="12.5" text-anchor="middle" x="918" y="111">审查代码 (Reviews the code)</text>

              <!-- Caption 1 -->
              <text fill="#6E6C65" font-size="12.5" font-style="italic" x="28" y="162">每次交接都会丢失上下文。编写测试的智能体并不知道当初为什么做出这些实现决策。</text>
              <text fill="#6E6C65" font-size="11.5" font-style="italic" x="28" y="182">(Each handoff loses context. The test-writing agent doesn't know why implementation decisions were made.)</text>

              <!-- Divider Line -->
              <line stroke="#DCDAD2" stroke-width="1.2" x1="28" x2="1052" y1="208" y2="208"></line>

              <!-- ==================== BOTTOM HALF: SPLIT BY CONTEXT ==================== -->
              <text class="mono-svg" fill="#6E6C65" font-size="11.5" x="28" y="240">SPLIT BY CONTEXT · 按上下文拆分</text>

              <!-- Arrow from One agent to Verifier (x=666 to x=780) -->
              <line marker-end="url(#arrowGrey)" stroke="#9E9C94" stroke-width="1.5" x1="666" x2="780" y1="302" y2="302"></line>
              <path d="M 672 302 L 770 302" fill="none" id="d2ContextArrow" stroke="none"></path>
              <rect fill="#C6532D" height="9" width="9" x="-4.5" y="-4.5">
                <animateMotion dur="2.0s" repeatCount="indefinite" rotate="none">
                  <mpath href="#d2ContextArrow"></mpath>
                </animateMotion>
              </rect>

              <!-- One agent Wide Pale Peach Box (x=28 to x=666) -->
              <rect fill="#F4DFD5" height="88" rx="8" stroke="#E5C3B2" stroke-width="1.2" width="638" x="28" y="258"></rect>
              <text fill="#191918" font-size="15" font-weight="700" text-anchor="middle" x="347" y="286">单一智能体 (One agent)</text>
              <text fill="#191918" font-size="13" text-anchor="middle" x="347" y="311">同时编写功能代码及其测试，因为它已经掌握了完整上下文</text>
              <text fill="#6E6C65" font-size="11.5" text-anchor="middle" x="347" y="331">(Writes the feature and its tests, because it already has the context)</text>

              <!-- Verifier Box (x=784 to x=1052) -->
              <rect fill="#E9E5DC" height="88" rx="8" width="268" x="784" y="258"></rect>
              <text fill="#191918" font-size="14.5" font-weight="700" text-anchor="middle" x="918" y="294">验证器 (Verifier)</text>
              <text fill="#6E6C65" font-size="12.5" text-anchor="middle" x="918" y="321">运行测试 (Runs the tests)</text>

              <!-- Caption 2 -->
              <text fill="#6E6C65" font-size="12.5" font-style="italic" x="28" y="372">仅负责运行测试并报告结果的验证器不需要了解具体的实现上下文。</text>
              <text fill="#6E6C65" font-size="11.5" font-style="italic" x="28" y="392">(A verifier that only runs tests and reports results doesn't need implementation context.)</text>
            </svg>
          </div>
        </figure>

        <!-- Section 3 -->
        <h2 class="serif-heading" id="folding-section-3">
          如何将子智能体并入主智能体循环
          <span class="en-sub">How to fold subagents into the main agent loop</span>
        </h2>
        <p>
          许多团队在生产环境中已经运行着一套由编排器和若干专家智能体组成的系统。以下是我们建议逐步演进的目标<strong>单循环设计（Single Loop Design）</strong>：
        </p>
        <ul>
          <li><strong>单一模型与单一上下文窗口</strong>：运行一个开放式的工具调用循环（Open-ended Tool Loop），并在运行框架（Harness）中设置限制条件（如轮次预算、成本预算、写入门控 Write Gates）。</li>
          <li><strong>并行工具调用与自主决策</strong>：在每一轮（Turn）中，模型发出一批工具调用。运行框架并行执行这些调用，并将原始结果返回给同一个模型，由模型自主决定下一步行动：发起新一轮批量调用、向用户提问澄清，或是直接给出回答。当模型给出回答或触及预算上限时，循环终止。在给出回答后，还可以选择性地运行一次目标检查或验证器检查（Goal / Verifier Check）。</li>
          <li><strong>上下文内动态规划与即时修正</strong>：模型在第一轮将计划直接写入上下文中，并在收到执行结果时随时修正计划。这是相比“编排器+专家智能体”架构最核心的改变：<strong>制定计划的模型与执行计划的模型是同一个</strong>，因此它可以在执行中途随时调整计划。</li>
          <li>
            <strong>上下文依然按需加载，但由智能体自主管理</strong>：
            <ul>
              <li>不再需要专门编写代码步骤去根据规则目录重写计划，因为模型会自主决定每一步行动。</li>
              <li>执行顺序与领域操作规程（Domain Procedure）全部迁移至<strong>技能（Skills）</strong>中。</li>
              <li>硬性限制（如数据校验、审批门控 Approval Gates）以及对话中途出现的动态需求（如记忆检索 Memory Lookup）全部迁移至<strong>工具（Tools）</strong>中。</li>
              <li>依然可以使用传统代码来预加载开销极低且几乎总是相关的信息（例如实体解析步骤 Entity Resolution），并在循环所调用的工具内部处理机械性工作（如构建请求载荷、解析流式输出、恢复澄清对话等）。</li>
            </ul>
          </li>
        </ul>
        <p>
          这种单循环设计同样有助于实现许多团队正在追求的终极状态（即构建一个能够理解用户高层级目标并代表用户自主行动的智能体），因为它将智能体所学到的一切都保留在同一个上下文中。
        </p>
        <p>
          以下建议展示了团队如何分阶段从多智能体系统演进至单智能体循环，以及多个团队如何在这一过程中持续向该智能体贡献力量。
        </p>

        <h3 class="serif-heading" id="folding-section-4">
          任务完成度评测 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;font-style:italic;">(Task-completion evals)</span>
        </h3>
        <p>
          第一步是创建一个评测集（Eval Set），帮助你判断某个子智能体是否应当并入主智能体循环。在我们的实践中，行之有效的评测结构是：<strong>由中央团队拥有一套共享的端到端评测集，同时由各业务团队随其负责的每项技能（Skill）附带交付小型评测集</strong>。即便最初只有 10 个黄金样本（Golden Examples），也足以起步。
        </p>
        <p>
          对照评分量表（Rubric）对智能体的最终消息进行打分，是追踪回答质量的良好起点。在系统仍保留编排器时，你还应当追踪<strong>路由准确率</strong>（它是否选对了子智能体？）。而一旦某个子智能体被并入主循环，则应改为检查<strong>智能体是否加载了正确的技能或调用了正确的工具</strong>。随着时间推移，逐步建立起“任务完成度评测（Task-completion Evals）”非常有帮助，因为在对比不同架构时，这一点最为关键。
        </p>
        <p>
          在内部系统难以重放（Replay）、用户交互难以模拟的环境中，这项工作可能较为复杂。我们在内部行之有效的一种方法是在重要事件上记录时间戳（Timestamps），以便后续能够回放这些事件并作为定向评测来运行。
        </p>

        <h3 class="serif-heading" id="folding-section-5">
          逐步精简子智能体 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;font-style:italic;">(Reducing subagents over time)</span>
        </h3>
        <p>
          向单智能体循环演进的过程，本质上是将子智能体逐步转化为工具与技能的过程。这可以通过三种方式实现：<strong>合并领域子智能体</strong>、<strong>将子智能体作为工具调用</strong>，或<strong>用技能与工具替换子智能体</strong>。
        </p>

        <!-- ====================================================================== -->
        <!-- DIAGRAM 3: Clean Card, Pure Locked SVG with Smooth Animated Morphing   -->
        <!-- ====================================================================== -->
        <figure class="diagram-figure">
          <div class="diagram-card">

            <svg aria-label="Folding in subagents 3-column animated diagram" style="width:100%;height:auto;display:block;user-select:none;" viewBox="0 0 1080 375">
              <!-- Column Dividers -->
              <line stroke="#DCDAD2" stroke-width="1.2" x1="364" x2="364" y1="16" y2="358"></line>
              <line stroke="#DCDAD2" stroke-width="1.2" x1="722" x2="722" y1="16" y2="358"></line>

              <!-- ==================== COLUMN 1: MERGE SUBAGENTS (x=24..340) ==================== -->
              <text fill="#191918" font-size="15.5" font-weight="700" x="24" y="34">合并子智能体 (Merge subagents)</text>

              <!-- Top Main agent box (constant in Col 1) -->
              <rect fill="#E9E5DC" height="48" rx="6" width="316" x="24" y="58"></rect>
              <text fill="#191918" font-size="14" font-weight="700" text-anchor="middle" x="182" y="87">主智能体 (Main agent)</text>

              <!-- Col 1 STATE BEFORE: 4 separate subagent boxes A, B, C, D -->
              <g class="svg-stage-group" id="col1StateBefore" opacity="0" style="opacity: 0;">
                <line stroke="#9E9C94" stroke-width="1.5" x1="58" x2="58" y1="106" y2="152"></line>
                <line stroke="#9E9C94" stroke-width="1.5" x1="141" x2="141" y1="106" y2="152"></line>
                <line stroke="#9E9C94" stroke-width="1.5" x1="223" x2="223" y1="106" y2="152"></line>
                <line stroke="#9E9C94" stroke-width="1.5" x1="306" x2="306" y1="106" y2="152"></line>

                <rect fill="#E9E5DC" height="82" rx="6" width="68" x="24" y="152"></rect>
                <text fill="#191918" font-size="16" font-weight="700" text-anchor="middle" x="58" y="198">A</text>

                <rect fill="#E9E5DC" height="82" rx="6" width="68" x="107" y="152"></rect>
                <text fill="#191918" font-size="16" font-weight="700" text-anchor="middle" x="141" y="198">B</text>

                <rect fill="#E9E5DC" height="82" rx="6" width="68" x="189" y="152"></rect>
                <text fill="#191918" font-size="16" font-weight="700" text-anchor="middle" x="223" y="198">C</text>

                <rect fill="#E9E5DC" height="82" rx="6" width="68" x="272" y="152"></rect>
                <text fill="#191918" font-size="16" font-weight="700" text-anchor="middle" x="306" y="198">D</text>
              </g>

              <!-- Col 1 STATE AFTER: 2 merged subagent boxes A+B and C+D -->
              <g class="svg-stage-group" id="col1StateAfter" opacity="1" style="opacity: 1;">
                <line stroke="#9E9C94" stroke-width="1.5" x1="99" x2="99" y1="106" y2="152"></line>
                <line stroke="#9E9C94" stroke-width="1.5" x1="265" x2="265" y1="106" y2="152"></line>

                <rect fill="#E9E5DC" height="82" rx="6" stroke="#D5CFC2" stroke-width="1.2" width="150" x="24" y="152"></rect>
                <text fill="#191918" font-size="15" font-weight="700" text-anchor="middle" x="99" y="178">A + B</text>
                <text fill="#6E6C65" font-size="12" text-anchor="middle" x="99" y="201">一个子智能体</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="99" y="218">(one subagent)</text>

                <rect fill="#E9E5DC" height="82" rx="6" stroke="#D5CFC2" stroke-width="1.2" width="150" x="190" y="152"></rect>
                <text fill="#191918" font-size="15" font-weight="700" text-anchor="middle" x="265" y="178">C + D</text>
                <text fill="#6E6C65" font-size="12" text-anchor="middle" x="265" y="201">一个子智能体</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="265" y="218">(one subagent)</text>
              </g>

              <text fill="#6E6C65" font-size="12.5" x="24" y="298">合并共享上下文的子智能体，从而减少数量。</text>
              <text fill="#6E6C65" font-size="11" x="24" y="318">(Combine subagents that share context,</text>
              <text fill="#6E6C65" font-size="11" x="24" y="335">so there are fewer.)</text>


              <!-- ==================== COLUMN 2: CALL THEM AS TOOLS (x=386..700) ==================== -->
              <text fill="#191918" font-size="15.5" font-weight="700" x="386" y="34">作为工具调用 (Call them as tools)</text>

              <rect fill="#E9E5DC" height="48" rx="6" width="314" x="386" y="58"></rect>
              <text fill="#191918" font-size="14" font-weight="700" text-anchor="middle" x="543" y="87">主智能体 (Main agent)</text>

              <line stroke="#9E9C94" stroke-width="1.5" x1="461" x2="461" y1="106" y2="160"></line>
              <line stroke="#9E9C94" stroke-width="1.5" x1="625" x2="625" y1="106" y2="160"></line>

              <!-- Animated coral packets traveling down/up the two tool call lines -->
              <path d="M 461 108 L 461 156 L 461 108" fill="none" id="col2ToolCall1" stroke="none"></path>
              <rect fill="#C6532D" height="8" width="8" x="-4" y="-4">
                <animateMotion dur="2.2s" repeatCount="indefinite" rotate="none">
                  <mpath href="#col2ToolCall1"></mpath>
                </animateMotion>
              </rect>
              <path d="M 625 156 L 625 108 L 625 156" fill="none" id="col2ToolCall2" stroke="none"></path>
              <rect fill="#C6532D" height="8" width="8" x="-4" y="-4">
                <animateMotion dur="2.2s" repeatCount="indefinite" rotate="none">
                  <mpath href="#col2ToolCall2"></mpath>
                </animateMotion>
              </rect>

              <rect fill="#F3F1EB" height="22" width="134" x="476" y="121"></rect>
              <text class="mono-svg" fill="#6E6C65" font-size="10.5" text-anchor="middle" x="543" y="136">TOOL CALLS · 工具调用</text>

              <rect fill="#E9E5DC" height="82" rx="6" width="150" x="386" y="160"></rect>
              <text fill="#191918" font-size="13.5" font-weight="700" text-anchor="middle" x="461" y="186">子智能体 (Subagent)</text>
              <text fill="#6E6C65" font-size="12" text-anchor="middle" x="461" y="209">返回结果</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="461" y="226">(returns a result)</text>

              <rect fill="#E9E5DC" height="82" rx="6" width="150" x="550" y="160"></rect>
              <text fill="#191918" font-size="13.5" font-weight="700" text-anchor="middle" x="625" y="186">子智能体 (Subagent)</text>
              <text fill="#6E6C65" font-size="12" text-anchor="middle" x="625" y="209">返回结果</text>
              <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="625" y="226">(returns a result)</text>

              <text fill="#6E6C65" font-size="12.5" x="386" y="298">主智能体将每个子智能体作为工具调用并掌控对话。</text>
              <text fill="#6E6C65" font-size="11" x="386" y="318">(The main agent calls each one as a tool</text>
              <text fill="#6E6C65" font-size="11" x="386" y="335">and keeps the conversation.)</text>


              <!-- ==================== COLUMN 3: FOLD INTO SKILLS & TOOLS (x=744..1056) ==================== -->
              <text fill="#191918" font-size="15.5" font-weight="700" x="744" y="34">并入为技能与工具 (Fold into skills &amp; tools)</text>

              <!-- Col 3 STATE BEFORE: Main agent + 2 separate Subagent boxes below -->
              <g class="svg-stage-group" id="col3StateBefore" opacity="0" style="opacity: 0;">
                <rect fill="#E9E5DC" height="48" rx="6" width="312" x="744" y="58"></rect>
                <text fill="#191918" font-size="14" font-weight="700" text-anchor="middle" x="900" y="87">主智能体 (Main agent)</text>

                <line stroke="#9E9C94" stroke-width="1.5" x1="818" x2="818" y1="106" y2="152"></line>
                <line stroke="#9E9C94" stroke-width="1.5" x1="982" x2="982" y1="106" y2="152"></line>

                <rect fill="#E9E5DC" height="82" rx="6" width="148" x="744" y="152"></rect>
                <text fill="#191918" font-size="13.5" font-weight="700" text-anchor="middle" x="818" y="198">子智能体 (Subagent)</text>

                <rect fill="#E9E5DC" height="82" rx="6" width="148" x="908" y="152"></rect>
                <text fill="#191918" font-size="13.5" font-weight="700" text-anchor="middle" x="982" y="198">子智能体 (Subagent)</text>
              </g>

              <!-- Col 3 STATE AFTER: Expanded Pale Peach Main agent container holding 3 skill pills & 3 tool pills -->
              <g class="svg-stage-group" id="col3StateAfter" opacity="1" style="opacity: 1;">
                <rect fill="#F4DFD5" height="184" rx="10" stroke="#E5C3B2" stroke-width="1.4" width="312" x="744" y="58"></rect>
                <text fill="#191918" font-size="14.5" font-weight="700" text-anchor="middle" x="900" y="90">主智能体 (Main agent)</text>

                <!-- Row 1: 3 White Rounded Skill Pills -->
                <rect fill="#FFFFFF" height="44" rx="22" stroke="#E5C3B2" stroke-width="1" width="84" x="762" y="110"></rect>
                <text fill="#191918" font-size="12" font-weight="700" text-anchor="middle" x="804" y="130">技能</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="804" y="145">skill</text>

                <rect fill="#FFFFFF" height="44" rx="22" stroke="#E5C3B2" stroke-width="1" width="84" x="858" y="110"></rect>
                <text fill="#191918" font-size="12" font-weight="700" text-anchor="middle" x="900" y="130">技能</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="900" y="145">skill</text>

                <rect fill="#FFFFFF" height="44" rx="22" stroke="#E5C3B2" stroke-width="1" width="84" x="954" y="110"></rect>
                <text fill="#191918" font-size="12" font-weight="700" text-anchor="middle" x="996" y="130">技能</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="996" y="145">skill</text>

                <!-- Row 2: 3 White Rounded Tool Pills -->
                <rect fill="#FFFFFF" height="44" rx="22" stroke="#E5C3B2" stroke-width="1" width="84" x="762" y="170"></rect>
                <text fill="#191918" font-size="12" font-weight="700" text-anchor="middle" x="804" y="190">工具</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="804" y="205">tool</text>

                <rect fill="#FFFFFF" height="44" rx="22" stroke="#E5C3B2" stroke-width="1" width="84" x="858" y="170"></rect>
                <text fill="#191918" font-size="12" font-weight="700" text-anchor="middle" x="900" y="190">工具</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="900" y="205">tool</text>

                <rect fill="#FFFFFF" height="44" rx="22" stroke="#E5C3B2" stroke-width="1" width="84" x="954" y="170"></rect>
                <text fill="#191918" font-size="12" font-weight="700" text-anchor="middle" x="996" y="190">工具</text>
                <text fill="#6E6C65" font-size="10.5" text-anchor="middle" x="996" y="205">tool</text>
              </g>

              <text fill="#6E6C65" font-size="12.5" x="744" y="298">它们的提示词转化为技能，API 调用转化为工具。</text>
              <text fill="#6E6C65" font-size="11" x="744" y="318">(Their prompts become skills and their</text>
              <text fill="#6E6C65" font-size="11" x="744" y="335">API calls become tools.)</text>
            </svg>
          </div>
        </figure>

        <h4 id="folding-section-6">
          1. 合并领域智能体 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;">(Combining domain agents)</span>
        </h4>
        <p>
          在进行第一次合并前，先构建一个小型端到端评测集。随后，从调用频率最高的子智能体开始，按照共享上下文（Shared Context）的原则进行合并。
        </p>
        <p>
          优先合并那些在输出上彼此串联、访问相同数据，或经常被一起调用的专家智能体。例如，如果生产环境中有相当大比例的流量表现为“先调用某一个专家智能体，紧接着调用第二个专家智能体”，这就属于强耦合配对，是合并为单一领域智能体的理想候选。
        </p>

        <h4 id="folding-section-7">
          2. 将子智能体作为工具调用 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;">(Subagents called as tools)</span>
        </h4>
        <p>
          当前述需要保留子智能体的三个条件之一成立、且你决定保留某个子智能体时，一种行之有效的做法是让主智能体<strong>将子智能体作为工具来调用</strong>，以便主智能体能够继续保持与用户的直接对话。
        </p>
        <p>
          我们仅在子智能体确需直接与用户交谈时，才建议采用完全交接（Full Handoff，即由子智能体接管整个会话）。除此之外的所有情况，都可以作为主循环中的“技能 + 工具”来实现。
        </p>
        <p>
          这种模式允许你为子智能体定义统一的响应数据结构（Shared Response Schema），利用主智能体对照真实数据验证结论，并在进入最终综合步骤前精简输入内容。这是极佳的第一步，因为你无需重写现有的子智能体；同时，它还能在你决定是否将任何子智能体并入主智能体之前，为你提供任务完成度评测上的基准线（Baseline）。
        </p>
        <p>不过，这种模式下仍会残留一些失效模式：</p>
        <ul>
          <li>每个专家子智能体依然拥有各自独立的提示词、上下文、归属团队和评测集；</li>
          <li>每次调用依然只传回一份有损摘要（Lossy Summary）；</li>
          <li>每次调用都是一个嵌套的模型循环（Nested Model Loop），依然会增加延迟。</li>
        </ul>

        <h4 id="folding-section-8">
          3. 通过技能与工具将子智能体并入主智能体 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;">(Folding subagents into the main agent via skills and tools)</span>
        </h4>
        <p>
          每次将一个子智能体并入主智能体：将其提示词转化为<strong>技能（Skills）</strong>，并将其 API 调用转化为 <strong>MCP 工具</strong>。对比保留该子智能体与移除该子智能体时的评测表现，然后再决定保留哪些、并入哪些。
        </p>
        <p>
          在进行对比时，不要只看最终总分，务必仔细查看<strong>哪些具体任务的结果发生了翻转（Flipped）</strong>。当我们在一个示例客服智能体上测试这一操作时发现：将一个子智能体并入另一个智能体虽然降低了延迟，但却破坏了一个原本能够通过测试的流程——主智能体因为自己持有订单查询工具，便直接自行回答了用户，而没有再去向物流专家询问预计送达日期。
        </p>
        <p>
          因此，在每次变更之前，请确保你的评测集中包含了针对生产环境中每一条协同运行的智能体调用链的测试任务，以及针对智能体绝不能违反的每一条规则的测试任务；并且<strong>每个任务都要运行不止一次</strong>，因为像上面提到的这种流程断裂，在两次运行中往往只会出现一次。
        </p>

        <!-- Section 4 -->
        <h2 class="serif-heading" id="folding-section-9">
          多团队如何协同共建单一智能体
          <span class="en-sub">How several teams can contribute to a single agent</span>
        </h2>
        <p>
          领域推理能力可以从知识库（Knowledge Bases）、技能（Skills）和 MCP 工具中获取。各个独立团队可以将自己的所有权从“维护智能体”转移到“维护技能与工具”上，同时由一个小型中央团队保留对系统提示词和端到端质量的所有权——包括在新技能、新工具和新评测发布上线前对其进行审核把关。
        </p>

        <h3 class="serif-heading" id="folding-section-10">
          MCP 工具 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;font-style:italic;">(MCP tools)</span>
        </h3>
        <p>
          当智能体需要执行动作、从系统读取实时数据，或以固定格式返回结果时，<strong>工具（Tools）</strong>是最合适的选择。在迁移期间，你也可以把工具作为继续调用现有子智能体的一种过渡方式。我们建议<strong>按用户意图（User Intent）对工具进行分组</strong>（而不是每个 API 对应一个工具），因为一旦系统提示词中的工具定义超过 30 到 50 个，模型的工具选择能力往往就会下降。
        </p>
        <p>
          建议使用带有延迟加载（Deferred Loading）机制的工具搜索，减少硬性前置条件，并将任何必要的前置条件移入工具内部。例如，如果 Y 需要 X 的输出，那么 Y 的工具应当自行检查该输出是否存在，并在缺失时返回一条模型能够理解并据此采取行动的指令。按用户划分的权限控制（Per-user Permissions）也以同样的方式运作：每个工具负责检查当前调用用户可以查看或执行哪些操作，并在权限不足时返回模型可读的明确拒绝信息。这样一来，同一个主循环就能服务具有不同访问权限的用户，而无需为每个权限级别单独设置一个智能体。
        </p>

        <h3 class="serif-heading" id="folding-section-11">
          技能 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;font-style:italic;">(Skills)</span>
        </h3>
        <p>
          当智能体需要了解某个团队具体如何开展工作时——例如过去保存在专家子智能体提示词中的操作步骤、业务规则和判断准则——<strong>技能（Skills）</strong>是最契合的载体。
        </p>
        <p>
          我们在扩展技能库时的做法是，将维护工作交还给编写这些技能的人。Claude 可以借助那些能够构建、测试和修剪其他技能的技能（元技能）来承担繁重的工作。
        </p>
        <p>
          为了防止技能泛滥（Skill Sprawl），你可以让每个团队的直接负责人（DRI）各自负责本团队的技能，确保它们制作精良、职责清晰，并随附适当的评测集一起发布：
        </p>
        <ul>
          <li><code class="inline-code">/skill-creator</code>：允许你编写从一开始就格式规范的新技能，并对现有技能进行审计，以对其进行精简、去重和结构重组。</li>
          <li><code class="inline-code">/skill-doctor</code>：允许你查看技能库中每项技能的成本开销以及实际使用频率，并清理掉毫无用处的冗余部分（Dead Weight）。</li>
        </ul>

        <h3 class="serif-heading" id="folding-section-12">
          知识库 <span class="en-sub" style="font-size:14px;font-weight:400;color:#6E6C65;font-style:italic;">(Knowledge bases)</span>
        </h3>
        <p>
          对于智能体仅在部分时间需要用到的参考资料，<strong>知识库（Knowledge Bases）</strong>是最合适的选择。事实与参考资料（如公司政策、指标定义、产品规格）可以放置在供模型调用的搜索或查询工具背后，或者作为参考文件（Reference Files）随附在技能内部发布。请避免使用外部代码机械地检索这些上下文并将其直接粘贴到提示词中。
        </p>

        <!-- Section 5 -->
        <h2 class="serif-heading" id="folding-section-13">
          加速迁移工作的工具
          <span class="en-sub">Tools to accelerate this work</span>
        </h2>
        <p>
          我们近期发布了一组 Claude API 技能，可以帮助完成上文提到的大部分工作。我们的迁移工具包（Migration Kit）将这些技能串联成一个引导式工作流，用于评估多智能体系统并将其迁移至单智能体循环。其中包含一个你可以在接入真实系统前先行试用的演示（Demo）：
        </p>
        <ul>
          <li><code class="inline-code">/claude-api build-eval</code>：可帮助创建由中央团队拥有的第一套端到端评测集，或由各个团队随其技能附带发布的小型评测集。</li>
          <li><code class="inline-code">/claude-api prompt-audit</code>：可自动标记出提示词、技能和工具描述中针对旧版模型编写的指令，并以差异对比（Diff）形式提出修复建议。你可以在系统提示词上运行它，找出那些曾为早期模型添加、如今却让智能体变得更慢或更僵化的规则；每个团队的 DRI 也可以在自己的技能和工具描述上运行它。</li>
          <li><code class="inline-code">/claude-api hillclimb</code>：可对照现有评测集对应用进行迭代式自动优化。这可以用于“并入主循环 vs 保留子智能体”的对比评测（在将某个子智能体转化为“技能 + 工具”后，让它自动迭代优化技能和工具描述，检验并入后的版本是否能持平或超越原版子智能体），同样也可用于优化你的系统提示词。</li>
          <li><code class="inline-code">/claude-api cost-optimize</code>：可剖析你的调用开销去向，并从提示词缓存（Prompt Caching）、裁剪非必要的输入与输出 Token、推理努力程度（Effort）以及模型选型等选项中，每次针对一项变更提出节省成本的建议。这有助于在给定架构设计下显著降低成本与延迟。</li>
        </ul>
        <p>
          随着模型的演进，我们对如何最好地使用它们的理解以及围绕最佳实践的指导也在不断演进。这使得任何单一的架构都不如其背后的基本原则重要：<strong>量化评测，每次只改变一个变量，并保留经受住检验的方案（Measure, change one thing at a time, and keep what holds up）</strong>。
        </p>
        <p>
          子智能体的去留正是这一原则的体现。随着模型能力越来越强、智能体运行周期越来越长，你现有的更多子智能体都可以转化为技能和工具。不过，你完全不必一步到位地完成这一迁移：先构建一个小型端到端评测集，每次并入一个子智能体，仅在并入后的版本得分更差时才将其保留为子智能体，然后周而复始、持续迭代。
        </p>

</article>
    </div>
  </div>
<script src="/uploads/building-agents-folding-subagents/article-auto.js" defer></script>
{% endraw %}
