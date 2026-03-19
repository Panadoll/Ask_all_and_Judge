// DeepSeek Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class DeepSeekInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'DeepSeek',
      inputSelectors: [
        'textarea[placeholder*="输入" i]',
        'textarea[placeholder*="Message" i]',
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="发送" i]',
        'button[aria-label*="Send" i]',
        'button[type="submit"]',
        'div.ds-icon-button svg path[d*="8.3125"]',
        'div._7436101'
      ],
      responseSelectors: [
        '.ds-markdown',
        'div._4f9bf79 .ds-markdown',
        '[class*="assistant"]'
      ],
      stopButtonSelectors: [
        'button[aria-label*="停止" i]',
        'button[aria-label*="Stop" i]'
      ],
      inputType: 'textarea',
      loginIndicators: {
        loggedOut: [
          'a[href*="login"]',
          'button[class*="login"]'
        ],
        loggedOutText: ['登录', 'log in']
      },
      conversationSelectors: {
        userMessages: '[class*="user-message"]',
        assistantMessages: '[class*="bot-message"]'
      }
    };
    super('deepseek', config);
  }

  // Override submitQuery to handle div elements (DeepSeek uses div for send button)
  async submitQuery() {
    const submitButton = await this.waitForElement(this.submitSelectors, 3000);

    if (!submitButton) {
      throw new Error(`Could not find ${this.aiName} submit button`);
    }

    // Check if button is enabled
    if (submitButton.disabled) {
      console.warn(`${this.aiName}: Submit button is disabled, trying anyway`);
    }

    // DeepSeek's send button is a div, use dispatchEvent instead of click()
    if (typeof submitButton.click === 'function') {
      submitButton.click();
    } else {
      // Fallback for div elements
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      submitButton.dispatchEvent(clickEvent);
    }

    console.log(`${this.aiName}: Query submitted`);

    // Wait a bit for response to start
    await this.sleep(1000);

    return true;
  }

  // Override extractConversation to handle DeepSeek's specific DOM structure
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Strategy 1: Use stable class names and structure
    // DeepSeek uses div.ds-markdown for AI responses - this is very stable
    // Try to find message turn containers
    const turnContainers = document.querySelectorAll('[class*="chat-message"], [class*="message-item"], [data-role]');
    
    if (turnContainers.length > 0) {
      for (const container of turnContainers) {
        let role = 'UNKNOWN';
        let content = '';

        const dataRole = container.getAttribute('data-role');
        const classList = container.classList?.toString()?.toLowerCase() || '';

        if (dataRole === 'user' || classList.includes('user')) {
          role = 'USER';
          content = container.innerText || container.textContent;
        } else if (dataRole === 'assistant' || classList.includes('assistant') || classList.includes('bot')) {
          role = 'DEEPSEEK';
          const contentEl = container.querySelector('div.ds-markdown') || container;
          content = contentEl.innerText || contentEl.textContent;
        }

        content = content ? content.trim() : '';
        if (content && role !== 'UNKNOWN') {
          if (messages.length > 0 && messages[messages.length - 1].role === role) {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role, content });
          }
        }
      }
    }

    // Strategy 2: Legacy hash class names (may still work in some versions)
    if (messages.length === 0) {
      const allMessageContainers = document.querySelectorAll('div.dad65929, div._4f9bf79');

      if (allMessageContainers.length > 0) {
        for (const container of allMessageContainers) {
          let role = 'UNKNOWN';
          let content = '';

          if (container.classList.contains('dad65929')) {
            role = 'USER';
            const contentEl = container.querySelector('div.fbb737a4') || container;
            content = contentEl.innerText || contentEl.textContent;
          } else if (container.classList.contains('_4f9bf79')) {
            role = 'DEEPSEEK';
            const contentEl = container.querySelector('div.ds-markdown') || container;
            content = contentEl.innerText || contentEl.textContent;
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
    }

    // Strategy 3: Find ds-markdown elements and walk up to find user messages
    if (messages.length === 0) {
      // Get all ds-markdown (AI responses) and try to reconstruct conversation
      const aiResponses = document.querySelectorAll('div.ds-markdown');
      if (aiResponses.length > 0) {
        // Walk the chat container to find alternating user/AI messages
        // Find a common ancestor that contains both user and AI messages
        const chatContainer = aiResponses[0].closest('[class*="chat"], [class*="conversation"], main, [role="main"]') || document.body;
        
        // Get direct children or message-level containers
        const allChildren = chatContainer.querySelectorAll(':scope > div > div, :scope > div');
        
        for (const child of allChildren) {
          const hasDsMarkdown = child.querySelector('div.ds-markdown');
          if (hasDsMarkdown) {
            const content = hasDsMarkdown.innerText || hasDsMarkdown.textContent;
            if (content?.trim()) {
              messages.push({ role: 'DEEPSEEK', content: content.trim() });
            }
          } else if (child.textContent?.trim().length > 5 && !child.querySelector('textarea') && !child.querySelector('button[type="submit"]')) {
            // Potential user message - check it's not a UI element
            const text = child.textContent.trim();
            if (text.length < 10000) { // Skip if too long (probably a container)
              messages.push({ role: 'USER', content: text });
            }
          }
        }
      }
    }

    // Fallback to base class
    if (messages.length === 0) {
      return super.extractConversation();
    }

    // Build markdown
    for (const msg of messages) {
      markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
    }

    return markdown;
  }
}

// Initialize the injector
const injector = new DeepSeekInjector();
injector.initialize();
