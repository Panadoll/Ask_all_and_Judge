// Qwen Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class QwenInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Qwen',
      inputSelectors: [
        'textarea[placeholder*="输入" i]',
        'textarea[placeholder*="请输入" i]',
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="发送" i]',
        'button[title*="发送" i]',
        'button[type="submit"]',
        'button:has(span[class*="send"])',
        'button.send-button',
        'button[class*="send"]'
      ],
      responseSelectors: [
        '.message-content',
        '[class*="assistant-message"]',
        '[class*="bot-message"]',
        'div[class*="markdown"]'
      ],
      stopButtonSelectors: [
        'button[aria-label*="停止" i]',
        'button[title*="停止" i]'
      ],
      inputType: 'textarea',
      loginIndicators: {
        loggedOut: [
          'a[href*="login"]',
          'button[class*="login"]'
        ],
        loggedOutText: ['登录', '注册']
      },
      conversationSelectors: {
        userMessages: '[class*="user-message"]',
        assistantMessages: '[class*="assistant-message"]'
      }
    };
    super('qwen', config);
  }

  // Override extractConversation for Qwen
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Qwen structure:
    // User: div.qwen-chat-message-user
    // AI: div.qwen-chat-message-assistant
    // Common class: qwen-chat-message (often) or we just query both
    
    const messageElements = document.querySelectorAll('div.qwen-chat-message-user, div.qwen-chat-message-assistant');

    if (messageElements.length === 0) {
      return super.extractConversation();
    }

    for (const element of messageElements) {
      let role = 'UNKNOWN';
      let content = '';

      if (element.classList.contains('qwen-chat-message-user')) {
        role = 'USER';
        // Content: p.user-message-content
        const contentEl = element.querySelector('.user-message-content');
        if (contentEl) content = contentEl.innerText || contentEl.textContent;
      } else if (element.classList.contains('qwen-chat-message-assistant')) {
        role = 'QWEN';
        // Content: span.qwen-markdown-text or div.qwen-markdown
        const contentEl = element.querySelector('.qwen-markdown-text') || element.querySelector('.qwen-markdown');
        if (contentEl) content = contentEl.innerText || contentEl.textContent;
      }

      content = content ? content.trim() : '';

      if (content) {
        if (messages.length > 0 && messages[messages.length - 1].role === role) {
          messages[messages.length - 1].content += '\n\n' + content;
        } else {
          messages.push({ role, content });
        }
      }
    }

    for (const msg of messages) {
      markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
    }

    return markdown;
  }
}

// Initialize the injector
const injector = new QwenInjector();
injector.initialize();
