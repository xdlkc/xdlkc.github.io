# Spec: 点击阅读进度条回到顶部

- Date: 2026-03-08 02:34 (Asia/Shanghai)
- Slug: reading-progress-scroll-top

## 背景 / 动机
文章较长时，用户读到中后段想快速回到顶部（导航/搜索/目录），通常需要滚动很久。
站点已提供阅读进度条（顶部细条），这是一个天然的“回到顶部”触发区。

## 需求
在文章页的阅读进度条（`.reading-progress`）上增加点击行为：点击后平滑滚动回到页面顶部。

## 验收标准 (Acceptance Criteria)
1. `initReadingProgress()` 初始化后，`.reading-progress` 容器具有可点击行为。
2. 点击 `.reading-progress` 时调用 `window.scrollTo`，目标滚动到 `top: 0`；优先使用 `{ top: 0, behavior: 'smooth' }`，不支持时允许降级为 `window.scrollTo(0, 0)`。
3. 不影响现有进度条百分比计算与渲染；滚动监听逻辑保持不变。
4. 样式上给进度条增加 `cursor: pointer`，让用户可感知可点击。

## 边界 / 非目标
- 不新增“回到底部”“拖拽进度”等复杂交互。
- 不在非文章页强制插入进度条（仍由模板决定）。

## 测试计划 (TDD)
- 新增 Node 单元测试（jsdom）：
  - 构造包含 `.reading-progress` 与 `.reading-progress-bar` 的 DOM。
  - stub `window.scrollTo` 并调用 `initReadingProgress()`。
  - 触发 click 事件，断言 `scrollTo` 被调用且参数包含 top=0（允许两种调用形式）。
