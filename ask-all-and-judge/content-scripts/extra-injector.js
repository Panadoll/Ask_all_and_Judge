// Generic Content Script Injector for additional AI sites

// Detect AI name from hostname
function detectAiName() {
  const host = window.location.hostname;

  if (host.endsWith('chat.qwen.ai')) return 'qwen';
  if (host.endsWith('doubao.com')) return 'doubao';
  if (host.endsWith('chat.deepseek.com')) return 'deepseek';

  return null;
}

class ExtraAIInjector extends AIInjector {
  constructor(aiName) {
    super(aiName);

    // Generic selectors for extra AI sites
    this.inputSelectors = [
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Message" i]',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="提问"]',
      'textarea[placeholder*="发送"]',
      'div[role="textbox"]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    this.submitSelectors = [
      'button[aria-label*="Send" i]',
      'button[aria-label*="Send message" i]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="发送"]',
      'button[aria-label*="提交"]',
      'button[type="submit"]',
      'button[data-testid*="send" i]',
      'button[data-test-id*="send" i]'
    ];

    this.responseSelectors = [
      '[data-message-author-role="assistant"]',
      'div[class*="assistant"]',
      'div[class*="message"]',
      'div[class*="answer"]',
      'div[class*="response"]'
    ];

    this.stopButtonSelectors = [
      'button[aria-label*="Stop" i]',
      'button[aria-label*="停止"]'
    ];
  }

  isLoggedIn() {
    const inputField = this.findInputElement();
    return !!inputField;
  }

  findInputInShadow() {
    const candidates = document.querySelectorAll('rich-textarea, chat-textarea, c-textarea');
    for (const candidate of candidates) {
      if (!candidate.shadowRoot) continue;
      const input = candidate.shadowRoot.querySelector('textarea, [contenteditable="true"]');
      if (input) return input;
    }
    return null;
  }

  findInputElement() {
    return this.findElement(this.inputSelectors) || this.findInputInShadow();
  }

  async waitForInputElement(timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const input = this.findInputElement();
      if (input) return input;
      await this.sleep(100);
    }
    return null;
  }

  async injectQuery(query) {
    console.log(`${this.aiName}: Injecting query`, query);

    const inputElement = await this.waitForInputElement(6000);
    if (!inputElement) {
      throw new Error('Could not find input field');
    }

    inputElement.focus();
    await this.sleep(150);

    if (inputElement.tagName === 'TEXTAREA') {
      inputElement.value = '';
      this.triggerInputEvent(inputElement, query);
    } else {
      inputElement.textContent = '';
      this.triggerContentEditableInput(inputElement, query);
    }

    await this.sleep(300);
    return true;
  }

  async submitQuery() {
    console.log(`${this.aiName}: Submitting query...`);

    const submitButton = await this.waitForElement(this.submitSelectors, 3000);
    if (submitButton) {
      if (!submitButton.disabled) {
        submitButton.click();
        await this.sleep(500);
        return true;
      }
    }

    const inputElement = await this.waitForInputElement(2000);
    if (!inputElement) {
      throw new Error('Could not submit query');
    }

    inputElement.focus();
    ['keydown', 'keypress', 'keyup'].forEach((eventType) => {
      const enterEvent = new KeyboardEvent(eventType, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputElement.dispatchEvent(enterEvent);
    });

    await this.sleep(500);
    return true;
  }

  extractLatestResponse() {
    const responseElements = this.findElements(this.responseSelectors);
    if (responseElements.length === 0) return null;

    const lastResponse = responseElements[responseElements.length - 1];
    const text = (lastResponse.textContent || lastResponse.innerText || '').trim();
    return text || null;
  }

  isGenerating() {
    const stopButton = this.findElement(this.stopButtonSelectors);
    return !!stopButton;
  }

  // Determine the role of a message element (override for AI-specific detection)
  getMessageRole(element) {
    const classList = element.classList?.toString()?.toLowerCase() || '';
    const outerHTML = element.outerHTML?.toLowerCase() || '';
    const dataRole = element.getAttribute?.('data-message-author-role');
    const style = element.getAttribute?.('style') || '';

    // Check data attribute first
    if (dataRole) {
      return dataRole.toLowerCase() === 'assistant' ? this.aiName.toUpperCase() : dataRole.toUpperCase();
    }

    // Qwen specific: user messages have "user-message" class
    if (classList.includes('user-message') || classList.includes('chat-user')) {
      return 'USER';
    }

    // Qwen specific: assistant messages have "assistant" class
    if (classList.includes('assistant') || classList.includes('chat-assistant')) {
      return this.aiName.toUpperCase();
    }

    // Doubao specific: user messages have justify-end, assistant have justify-start
    if (classList.includes('justify-end')) {
      return 'USER';
    }
    if (classList.includes('justify-start')) {
      return this.aiName.toUpperCase();
    }

    // DeepSeek specific: check align-items style
    if (style.includes('align-items: flex-end') || style.includes('align-items:flex-end')) {
      return 'USER';
    }
    if (style.includes('align-items: flex-start') || style.includes('align-items:flex-start')) {
      return this.aiName.toUpperCase();
    }

    // Generic checks
    if (classList.includes('user') || classList.includes('human') || outerHTML.includes('user-message')) {
      return 'USER';
    }
    if (classList.includes('assistant') || classList.includes('claude') || classList.includes('gpt') ||
        outerHTML.includes('assistant-message') || outerHTML.includes('model-response')) {
      return this.aiName.toUpperCase();
    }

    return 'UNKNOWN';
  }

  // Get conversation selectors for generic AI sites
  getConversationSelectors() {
    return [
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      'div[class*="user-message"]',
      'div[class*="assistant-message"]',
      'div[class*="message"]',
      'div[class*="conversation"]',
      // Qwen specific
      '.chat-user-message-wrapper',
      '.chat-assistant-message-wrapper',
      // Doubao specific
      '[data-testid="message_content"]',
      // DeepSeek specific
      '.ds-message'
    ];
  }

  // Extract full conversation as markdown (generic implementation)
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Qwen specific: use dedicated selectors
    if (this.aiName === 'qwen') {
      const userMessages = document.querySelectorAll('.chat-user-message-wrapper');
      const assistantMessages = document.querySelectorAll('.chat-assistant-message-wrapper');

      // Process user messages
      for (const msg of userMessages) {
        const content = this.extractMessageContent(msg);
        if (content && content.length > 5) {
          if (messages.length > 0 && messages[messages.length - 1].role === 'USER') {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role: 'USER', content });
          }
        }
      }

      // Process assistant messages
      for (const msg of assistantMessages) {
        const content = this.extractMessageContent(msg);
        if (content && content.length > 5) {
          if (content.includes('Sign in') && content.includes('Create an account')) continue;
          if (messages.length > 0 && messages[messages.length - 1].role === this.aiName.toUpperCase()) {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role: this.aiName.toUpperCase(), content });
          }
        }
      }
    }

    // Doubao specific: use data-testid selectors
    if (this.aiName === 'doubao' && messages.length === 0) {
      const messageContents = document.querySelectorAll('[data-testid="message_content"]');

      for (const msg of messageContents) {
        const role = this.getMessageRole(msg);
        if (role === 'UNKNOWN') continue;

        // Get the actual text content
        const textContentEl = msg.querySelector('[data-testid="message_text_content"]');
        const content = textContentEl ? textContentEl.textContent.trim() : msg.textContent.trim();

        if (content && content.length > 5) {
          // Skip footer/disclaimer text
          if (content.includes('Sign in') && content.includes('Create an account')) continue;

          // Consolidate consecutive messages from the same role
          if (messages.length > 0 && messages[messages.length - 1].role === role) {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role, content });
          }
        }
      }
    }

    // DeepSeek specific: use ds-message class
    if (this.aiName === 'deepseek' && messages.length === 0) {
      const dsMessages = document.querySelectorAll('.ds-message');

      for (const msg of dsMessages) {
        const role = this.getMessageRole(msg);
        if (role === 'UNKNOWN') continue;

        const content = this.extractMessageContent(msg);

        if (content && content.length > 5) {
          // Skip footer/disclaimer text
          if (content.includes('Sign in') && content.includes('Create an account')) continue;

          // Consolidate consecutive messages from the same role
          if (messages.length > 0 && messages[messages.length - 1].role === role) {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role, content });
          }
        }
      }
    }

    // Fallback: use common selectors if above didn't work
    if (messages.length === 0) {
      const messageSelectors = this.getConversationSelectors();
      const messageElements = this.findElements(messageSelectors);

      for (const element of messageElements) {
        const role = this.getMessageRole(element);
        if (role === 'UNKNOWN') continue;

        const content = this.extractMessageContent(element);

        if (content && content.length > 5) {
          // Skip footer/disclaimer text
          if (content.includes('Sign in') && content.includes('Create an account')) continue;

          // Consolidate consecutive messages from the same role
          if (messages.length > 0 && messages[messages.length - 1].role === role) {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role, content });
          }
        }
      }
    }

    // Build markdown
    for (const msg of messages) {
      markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
    }

    return markdown;
  }

  // Wait for response to complete
  async waitForResponseComplete(timeout = 120000) {
    console.log(`${this.aiName}: Waiting for response to complete...`);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.cleanup();
        reject(new Error('Timeout waiting for response'));
      }, timeout);

      const onResponseReady = (response) => {
        clearTimeout(timeoutId);
        console.log(`${this.aiName}: Response complete, length:`, response.length);
        resolve(response);
      };

      this.setupResponseUpdateStream(1000);
      this.setupResponseObserver(onResponseReady, 2000);

      setTimeout(() => {
        this.setupResponsePolling(onResponseReady, 1000);
      }, 5000);

      const checkGenerating = setInterval(() => {
        if (!this.isGenerating()) {
          const response = this.extractLatestResponse();
          if (response && response.length > 20) {
            clearInterval(checkGenerating);
            clearTimeout(timeoutId);
            this.cleanup();
            console.log(`${this.aiName}: Response complete`);
            resolve(response);
          }
        }
      }, 2000);
    });
  }

  async handleQuery(query, options = {}) {
    const waitForResponse = options.waitForResponse === true;

    if (this.isProcessing) {
      throw new Error('Already processing a query');
    }

    this.isProcessing = true;
    this.currentQuery = query;
    this.cleanup();

    try {
      await this.injectQuery(query);
      await this.submitQuery();

      if (!waitForResponse) {
        this.isProcessing = false;
        return true;
      }

      const response = await this.waitForResponseComplete();
      await this.sendToBackground({
        type: 'RESPONSE_READY',
        aiName: this.aiName,
        response: response,
        query: query
      });

      this.isProcessing = false;
      return response;
    } catch (error) {
      console.error(`${this.aiName}: Error handling query:`, error);
      this.isProcessing = false;

      await this.sendToBackground({
        type: 'ERROR',
        aiName: this.aiName,
        error: error.message
      });

      throw error;
    }
  }
}

// Initialize if AI is detected
const aiName = detectAiName();

if (aiName) {
  const injector = new ExtraAIInjector(aiName);
  injector.initialize().then(() => {
    injector.notifyReady();
  });
}

console.log('Extra AI injector loaded');
