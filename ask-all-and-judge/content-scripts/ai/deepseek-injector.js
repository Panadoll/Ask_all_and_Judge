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

    // DeepSeek selectors from AI_DOM_STRUCTURE.md
    // User message container: div.dad65929
    // AI message container: div._4f9bf79
    // We select all direct children of the chat container to preserve order
    // Since we don't know the exact chat container class, we look for these specific message containers
    const allMessageContainers = document.querySelectorAll('div.dad65929, div._4f9bf79');

    if (allMessageContainers.length === 0) {
      console.warn('No messages found using DeepSeek specific selectors');
      // Fallback to default implementation if specific selectors fail
      return super.extractConversation();
    }

    for (const container of allMessageContainers) {
      let role = 'UNKNOWN';
      let content = '';

      if (container.classList.contains('dad65929')) {
        role = 'USER';
        // User content: div.fbb737a4
        const contentEl = container.querySelector('div.fbb737a4');
        if (contentEl) {
          content = contentEl.innerText || contentEl.textContent;
        }
      } else if (container.classList.contains('_4f9bf79')) {
        role = 'DEEPSEEK';
        // AI content: div.ds-markdown span
        // Or directly div.ds-markdown
        const contentEl = container.querySelector('div.ds-markdown');
        if (contentEl) {
          content = contentEl.innerText || contentEl.textContent;
        }
      }

      content = content ? content.trim() : '';

      if (content) {
        // Consolidate consecutive messages from the same role
        if (messages.length > 0 && messages[messages.length - 1].role === role) {
          messages[messages.length - 1].content += '\n\n' + content;
        } else {
          messages.push({ role, content });
        }
      }
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
