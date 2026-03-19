// Doubao Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class DoubaoInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Doubao',
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
        '[data-testid="chat_input_send_button"]',
        '#flow-end-msg-send'
      ],
      responseSelectors: [
        '.flow-markdown-body',
        '[data-testid="receive_message"] [data-testid="message_text_content"]',
        '.paragraph-pP9ZLC'
      ],
      stopButtonSelectors: [
        'button[aria-label*="停止" i]'
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
    super('doubao', config);
  }

  // Override extractConversation for Doubao
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Strategy 1: data-testid selectors (relatively stable)
    const messageContainers = document.querySelectorAll('div[data-testid="send_message"], div[data-testid="receive_message"]');
    
    if (messageContainers.length > 0) {
      for (const container of messageContainers) {
        let role = 'UNKNOWN';
        let content = '';

        const testId = container.getAttribute('data-testid');
        
        if (testId === 'send_message') {
          role = 'USER';
          // Content: multiple fallback selectors
          const contentEl = container.querySelector('.message_text_content') ||
                            container.querySelector('[data-testid="message_text_content"]') ||
                            container.querySelector('[class*="message-content"]');
          if (contentEl) {
            content = contentEl.innerText || contentEl.textContent;
          } else {
            content = container.innerText || container.textContent;
          }
        } else if (testId === 'receive_message') {
          role = 'DOUBAO';
          // Content: multiple fallback selectors
          const contentEl = container.querySelector('.flow-markdown-body') ||
                            container.querySelector('[data-testid="message_text_content"]') ||
                            container.querySelector('[class*="markdown"]');
          if (contentEl) {
            content = contentEl.innerText || contentEl.textContent;
          } else {
            content = container.innerText || container.textContent;
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
    }

    // Strategy 2: Class-based containers
    if (messages.length === 0) {
      const classContainers = document.querySelectorAll('[class*="message-item"], [class*="chat-message"]');
      
      for (const container of classContainers) {
        let role = 'UNKNOWN';
        let content = '';
        const classList = container.classList?.toString()?.toLowerCase() || '';

        if (classList.includes('send') || classList.includes('user') || classList.includes('right')) {
          role = 'USER';
        } else if (classList.includes('receive') || classList.includes('assistant') || classList.includes('left') || classList.includes('bot')) {
          role = 'DOUBAO';
        }

        if (role !== 'UNKNOWN') {
          const contentEl = container.querySelector('.flow-markdown-body') ||
                            container.querySelector('[class*="markdown"]') ||
                            container.querySelector('[class*="content"]');
          content = contentEl ? (contentEl.innerText || contentEl.textContent) : (container.innerText || container.textContent);
          content = content ? content.trim() : '';

          if (content && content.length > 5) {
            if (messages.length > 0 && messages[messages.length - 1].role === role) {
              messages[messages.length - 1].content += '\n\n' + content;
            } else {
              messages.push({ role, content });
            }
          }
        }
      }
    }

    if (messages.length === 0) {
      return super.extractConversation();
    }

    for (const msg of messages) {
      markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
    }

    return markdown;
  }
}

// Initialize the injector
const injector = new DoubaoInjector();
injector.initialize();
