# Spec: 代码块复制按钮与复制成功提示

## 需求 (Requirement)
为所有代码块添加复制按钮，点击后复制代码内容到剪贴板，并显示复制成功或失败的视觉反馈。

## 验收标准 (Acceptance Criteria)
1. 所有代码块（`figure.highlight` 和 `pre.highlight`）的右上角应该显示一个复制按钮
2. 复制按钮默认显示为 📋 图标
3. 点击复制按钮后：
   - 成功：按钮显示 ✓ 图标（持续 2 秒），然后恢复为 📋
   - 失败：按钮显示 ✗ 图标（持续 2 秒），然后恢复为 📋
4. 复制按钮应有明确的 aria-label 和 title 属性
5. 复制内容应该是纯代码文本（不包含行号）
6. 兼容现代浏览器（使用 Clipboard API，降级到 execCommand）
7. 复制按钮的样式应该：
   - 定位在代码块右上角
   - 不遮挡代码内容
   - 有 hover 效果
   - 在复制成功/失败时有明显的视觉变化

## 边界与约束 (Boundaries)
- 只对 Hexo 生成的代码块添加复制按钮（`figure.highlight` 和 `pre.highlight`）
- 不对非代码块的 `<pre>` 元素添加按钮
- 如果代码块已经包含复制按钮，不重复添加
- 复制成功提示时长为 2 秒
- 使用被动事件监听器优化性能

## 技术细节
- 复制按钮类名：`code-copy-button`
- 成功状态类名：`copied`
- 失败状态类名：`error`
- 使用 `navigator.clipboard.writeText` 作为首选方法
- 降级到 `document.execCommand('copy')` 作为备用方法
