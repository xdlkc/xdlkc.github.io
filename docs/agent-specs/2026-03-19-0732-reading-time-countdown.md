# Spec: 阅读时间倒计时

- 时间：2026-03-19 07:32 (Asia/Shanghai)
- 功能名：阅读时间倒计时

## 背景 / 问题

当前博客有阅读进度条，可以显示用户已经读了多少百分比，但读者可能更想知道：

1) "我还需要读多长时间才能读完这篇文章？"
2) "我现在读到一半了，还剩几分钟？"

阅读时间倒计时功能可以实时计算并显示用户还需要多长时间读完当前文章，提升阅读体验和进度感知。

## 需求

### R1. 倒计时显示
- 在文章页面的元信息区域或进度条附近显示阅读时间倒计时
- 显示格式：`剩余 X 分钟` / `Estimated: X min left`
- 实时更新：根据滚动位置动态计算剩余时间

### R2. 计算逻辑
- 基于阅读进度（0-100%）和总阅读时间（`reading_time` helper）
- 剩余时间 = 总阅读时间 × (1 - 当前进度百分比)
- 进度计算：与现有的 reading-progress.js 保持一致
- 最小显示单位：分钟（保留 1 位小数或整数）

### R3. 显示边界
- 当进度 > 90% 时，显示"即将读完"或"Almost done"
- 当进度 = 100% 时，显示"已读完"或"Done"
- 当没有进度数据时，不显示倒计时

### R4. 性能优化
- 使用与 reading-progress.js 相同的滚动优化机制（节流或 requestAnimationFrame）
- 避免频繁的 DOM 操作和计算
- 与现有阅读进度条共享滚动事件

### R5. 国际化支持
- 中文：`剩余 X 分钟` / `即将读完` / `已读完`
- 英文：`X min left` / `Almost done` / `Done`
- 根据当前语言模式自动切换

### R6. 可访问性
- 添加适当的 ARIA 标签
- 倒计时区域有清晰的语义结构
- 使用 `aria-live` 或适当的更新通知机制

## 验收标准

1. 文章页面加载时，正确显示剩余阅读时间
2. 滚动时，剩余时间实时更新
3. 当进度接近完成时，显示友好的提示（即将读完/已读完）
4. 中英文模式下，显示正确的文本
5. 性能良好，不影响页面滚动流畅性
6. 与现有阅读进度条协同工作
7. 新增测试文件 `tests/reading-time-countdown.test.js`
8. `npm test` 全部通过

## 边界 / 不做

- 不实现精确到秒的倒计时（分钟即可）
- 不考虑用户阅读速度的动态调整（假设平均阅读速度）
- 不修改现有的 reading-progress.js 功能，仅增强
- 不在非文章页面显示（如首页、归档页）

## 技术细节

### 文件变更
- `themes/evan/layout/post.ejs` - 添加倒计时显示元素
- `themes/evan/source/js/reading-time-countdown.js` - 新建，核心逻辑
- `themes/evan/source/css/reading-time-countdown.css` - 新建，样式（可选）
- `tests/reading-time-countdown.test.js` - 新建，测试

### 实现逻辑

1. 从 DOM 获取总阅读时间（data-reading-minutes）
2. 从现有的 reading-progress.js 获取或计算当前进度
3. 计算剩余时间：`remainingMinutes = totalMinutes × (1 - progress)`
4. 格式化显示：根据语言和剩余时间显示不同文本
5. 滚动时实时更新

### 与现有代码的集成

可以复用 reading-progress.js 中的滚动事件，或者监听同一个滚动事件。示例：

```javascript
// 在 reading-progress.js 的滚动回调中
const totalMinutes = parseFloat(document.querySelector('[data-reading-minutes]').dataset.readingMinutes);
const remaining = calculateRemainingTime(progress, totalMinutes);
updateCountdownDisplay(remaining);
```

或者在 post.ejs 中单独引入 reading-time-countdown.js：

```ejs
<script src="<%- url_for('/js/reading-time-countdown.js') %>" defer></script>
```

### 风险
- 低风险：纯前端功能，不影响现有行为
- 需要确保滚动事件不会重复绑定
- 需要处理进度为 0 或 100% 的边界情况

## 显示效果示例

进度 30%，总阅读时间 10 分钟：
- 中文：`剩余 7.0 分钟`
- 英文：`7.0 min left`

进度 95%，总阅读时间 10 分钟：
- 中文：`即将读完`
- 英文：`Almost done`

进度 100%：
- 中文：`已读完`
- 英文：`Done`
