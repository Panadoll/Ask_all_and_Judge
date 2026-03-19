# 自定义渲染故障排查指南

当某个 AI 面板在渲染模式下无法正常显示回复时，按以下流程排查。

---

## 快速定位：哪一层出了问题？

```
用户发消息 → iframe 内 AI 回复 → fetch 拦截层 → content script 转发 → 主页面渲染
                                   ↑              ↑                    ↑
                                 问题 A          问题 B              问题 C
```

| 问题分类 | 表现 | 定位 |
|---------|------|------|
| **A: 拦截层失败** | 控制台无 `FETCH_INTERCEPT_CHUNK` 消息 | AI 平台更新了 API endpoint 或请求方式 |
| **B: 解析层失败** | 有拦截消息但 text 为空/乱码 | SSE/JSON 响应格式变化 |
| **C: DOM 兜底失败** | 轮询获取到空文本 | `responseSelectors` 过时 |

---

## 问题 A：Fetch 拦截不到数据

### 诊断方法

1. 打开扩展页面 → F12 → 选择 AI 的 iframe 上下文
2. 在 Console 中输入：
   ```js
   // 确认 fetch 已被 patch
   window.__fetchInterceptorActive
   ```
   - 如果返回 `undefined` → 拦截脚本没有注入
   - 如果返回 `true` → 拦截脚本已注入但没匹配到 URL

3. 在 Network 面板中查看 AI 回复时的请求 URL

### 修复步骤

**情况 1：拦截脚本没注入**

检查 `manifest.json` 中 MAIN world content script 配置：
```json
{
  "matches": ["*://chatgpt.com/*"],
  "js": ["content-scripts/fetch-interceptor.js"],
  "world": "MAIN",
  "run_at": "document_start"
}
```
- 确认 `matches` 的域名和 AI 实际域名一致
- 确认 `"world": "MAIN"` 存在

**情况 2：URL 匹配规则过时**

打开 `fetch-interceptor.js`，找到 URL 匹配配置：
```js
const INTERCEPT_PATTERNS = {
  chatgpt: { urlPattern: /backend-api\/conversation/, ... },
  gemini:  { urlPattern: /batchexecute/, ... },
  qwen:    { urlPattern: /api\/chat\/completions/, ... }
};
```
更新 `urlPattern` 为在 Network 面板中观察到的新 URL。

**情况 3：AI 改用 WebSocket**

如果 AI 平台从 fetch/SSE 切换到 WebSocket，需要额外 patch `WebSocket`：
```js
const OrigWebSocket = window.WebSocket;
window.WebSocket = function(...args) {
  const ws = new OrigWebSocket(...args);
  ws.addEventListener('message', (e) => {
    // 处理 WebSocket 消息...
    window.postMessage({ type: 'WS_INTERCEPT_CHUNK', ... }, '*');
  });
  return ws;
};
```

---

## 问题 B：SSE 解析失败

### 诊断方法

在 iframe 的控制台中添加临时日志：
```js
window.addEventListener('message', (e) => {
  if (e.data?.type?.startsWith('FETCH_INTERCEPT')) {
    console.log('拦截到的原始数据:', e.data);
  }
});
```

检查 `text` 字段是否为空或包含异常格式。

### 修复步骤

**ChatGPT SSE 格式变化**

打开 `ai-response-parsers.js`，找到 `parseChatGPTSSE`。

当前期望格式：
```
data: {"message":{"content":{"parts":["回复文本"]}}}
```

如果格式变了，在 Network 面板中找到实际的 EventStream 数据，更新解析路径：
```js
function parseChatGPTSSE(line) {
  if (!line.startsWith('data: ')) return null;
  const json = JSON.parse(line.slice(6));
  // ↓ 根据实际 JSON 结构修改这个路径
  return json?.message?.content?.parts?.[0] || null;
}
```

**Gemini 特殊格式**

Gemini 不使用标准 SSE，而是自定义的 streaming JSON。如果格式变化，需要：
1. 在 Network 面板中 Copy Response
2. 分析新的 JSON 结构
3. 更新 `parseGeminiStream()` 函数

**通用调试技巧**

在 `fetch-interceptor.js` 中临时启用原始数据日志：
```js
// 在读取 stream chunk 的位置添加
console.log('[FetchInterceptor] Raw chunk:', new TextDecoder().decode(chunk));
```

---

## 问题 C：DOM 选择器失效（兜底层）

### 诊断方法

1. 在 AI iframe 的控制台中手动测试选择器：
   ```js
   // 查看当前配置的选择器能否找到元素
   document.querySelectorAll('.font-claude-response')  // Claude
   document.querySelectorAll('[data-message-author-role="assistant"]')  // ChatGPT
   ```

2. 用 Elements 面板找到 AI 回复的 DOM 节点，记录其 class/attribute

### 修复步骤

打开对应的 injector 文件（如 `chatgpt-injector.js`），更新 `responseSelectors`：

```js
responseSelectors: [
  // ↓ 替换为在 DevTools Elements 面板中观察到的新选择器
  'article[data-testid^="conversation-turn-"] div.markdown',
  '[data-message-author-role="assistant"]',
  '.agent-turn'
]
```

> [!TIP]
> 选择器优先级：优先使用 `data-*` 属性和语义化的 class（如 `data-message-author-role`），这些比随机生成的 class 名更稳定。

---

## 新增 AI 平台指南

如果要添加对一个新 AI 平台的网络拦截支持：

1. **找到 API endpoint**：用 DevTools Network 面板观察聊天时的请求
2. **确认响应格式**：记录是 SSE(`text/event-stream`) 还是普通 JSON
3. **在 `fetch-interceptor.js` 的 `INTERCEPT_PATTERNS` 中添加规则**：
   ```js
   newai: {
     urlPattern: /api\/chat/,
     parser: 'parseNewAISSE'
   }
   ```
4. **在 `ai-response-parsers.js` 中添加 parser**
5. **在 `manifest.json` 中为新域名添加 MAIN world 注入**
6. **测试**：发送消息，确认渲染视图能显示回复

---

## 紧急回退

如果拦截层出现严重问题导致 AI 页面无法正常工作：

1. 点击视图切换按钮回到 **iframe 原生模式** — 与拦截层无关
2. 如果 AI 页面本身被破坏，在 `manifest.json` 中临时移除该 AI 的 MAIN world content script 配置，重新加载扩展
3. 拦截脚本设计上不会修改原始 Response，只 clone 读取，理论上不影响页面功能
