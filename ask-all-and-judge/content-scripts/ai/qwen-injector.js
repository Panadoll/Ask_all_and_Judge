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

    // Strategy 1: Qwen specific class names
    let messageElements = document.querySelectorAll('div.qwen-chat-message-user, div.qwen-chat-message-assistant');

    // Strategy 2: Try chat-user/assistant wrapper classes
    if (messageElements.length === 0) {
      messageElements = document.querySelectorAll('.chat-user-message-wrapper, .chat-assistant-message-wrapper');
    }

    // Strategy 3: Try data attributes or generic chat message classes
    if (messageElements.length === 0) {
      messageElements = document.querySelectorAll('[data-role="user"], [data-role="assistant"], [class*="chat-message"]');
    }

    if (messageElements.length === 0) {
      return super.extractConversation();
    }

    for (const element of messageElements) {
      let role = 'UNKNOWN';
      let content = '';

      const classList = element.classList?.toString()?.toLowerCase() || '';
      const dataRole = element.getAttribute?.('data-role');

      if (classList.includes('qwen-chat-message-user') || classList.includes('chat-user') || dataRole === 'user') {
        role = 'USER';
        // Content: multiple fallback selectors
        const contentEl = element.querySelector('.user-message-content') ||
                          element.querySelector('[class*="message-content"]') ||
                          element.querySelector('p');
        if (contentEl) {
          content = contentEl.innerText || contentEl.textContent;
        } else {
          content = element.innerText || element.textContent;
        }
      } else if (classList.includes('qwen-chat-message-assistant') || classList.includes('chat-assistant') || dataRole === 'assistant') {
        role = 'QWEN';
        // Content: multiple fallback selectors
        const contentEl = element.querySelector('.qwen-markdown-text') ||
                          element.querySelector('.qwen-markdown') ||
                          element.querySelector('[class*="markdown"]') ||
                          element.querySelector('.message-content');
        if (contentEl) {
          content = contentEl.innerText || contentEl.textContent;
        } else {
          content = element.innerText || element.textContent;
        }
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
