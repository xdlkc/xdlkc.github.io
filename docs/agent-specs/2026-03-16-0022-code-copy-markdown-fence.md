# Spec: 代码块复制支持 Alt+点击复制 Markdown fenced 代码块

- 时间：2026-03-16 00:22 (Asia/Shanghai)
- 目标：在文章页的代码块复制按钮上新增一个“可感知、低学习成本”的增强：**按住 Alt/Option 再点击复制按钮时，复制内容会被包裹成 Markdown fenced code block（```lang ... ```）**，便于直接粘贴到 Markdown/Issue/评论区。

## 用户故事

作为读者/作者，我在博客里看到一段代码时：
- 普通点击：复制纯代码文本（保持现有行为）
- **Alt/Option + 点击**：复制成 Markdown fenced code block（可直接粘贴到 Markdown）

## 需求

1) 触发方式
- 当用户点击 `.code-copy-button` 时：
  - `event.altKey === true` → 复制 fenced 版本
  - 否则 → 保持现有复制纯文本逻辑不变

2) fenced 格式
- 复制文本格式：

```text
```<lang?>
<code>
```
```

- `<code>` 使用既有的代码提取逻辑（pre/code 或 figure.highlight）
- `<lang?>`：若能从 DOM 推断语言则填入，否则省略语言（即只有 ```）

3) 语言推断（最小可用）
- `<pre><code class="language-js">` / `lang-js` → `js`
- `<figure class="highlight js">` → `js`
- 推断失败则不写语言

4) 反馈（用户可感知）
- Alt 复制时 toast 文案应明确是 Markdown：
  - zh: `已复制 Markdown`
  - en: `Copied as Markdown`

## 验收标准
- [ ] 新增 Node/JSDOM 测试：Alt+点击时 `navigator.clipboard.writeText` 收到 fenced 文本（包含三反引号，且语言可从 class 推断）
- [ ] 普通点击行为不变（现有测试继续通过）
- [ ] `npm test` 全绿

## 边界/不做
- 不新增 UI 下拉菜单/右键菜单
- 不尝试解析复杂语言映射（只做 class 中的常见前缀提取）
- 不改变现有快捷键复制（仍复制纯文本；后续可考虑 Alt+Shift+Ctrl/Cmd+C）
