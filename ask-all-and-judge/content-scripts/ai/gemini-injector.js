// Gemini Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class GeminiInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Gemini',
      inputSelectors: [
        'textarea[aria-label*="message" i]',
        'rich-textarea textarea',
        'textarea[placeholder*="Ask" i]',
        'div[contenteditable="true"]',
        'textarea[placeholder*="Enter" i]',
        'textarea[aria-label*="prompt" i]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="Send message" i]',
        'button[aria-label*="Send prompt" i]',
        'button[aria-label*="Send" i]',
        'button[aria-label*="Submit" i]',
        'button[data-testid*="send" i]',
        'button[data-test-id*="send" i]',
        'button[mattooltip*="Send" i]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        '.model-response-text',
        'message-content model-response',
        '[class*="model-response"]',
        '[class*="response-container"]',
        'div[jsname] div.markdown'
      ],
      stopButtonSelectors: [
        'button[aria-label*="Stop" i]',
        'button[mattooltip*="Stop" i]'
      ],
      inputType: 'mixed',
      hasShadowDOM: true,
      shadowDOMSelector: 'rich-textarea',
      loginIndicators: {
        loggedOut: [
          'a[href*="accounts.google.com"]',
          'button',
          'a'
        ],
        loggedOutText: ['sign in', 'get started']
      },
      conversationSelectors: {
        userMessages: '[data-test-id*="user-message"]',
        assistantMessages: '[data-test-id*="model-response"]'
      }
    };
    super('gemini', config);
  }

  // Override extractConversation for Gemini
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Gemini structure:
    // User: user-query
    // AI: model-response
    // These are custom elements
    const messageElements = document.querySelectorAll('user-query, model-response');

    if (messageElements.length === 0) {
      return super.extractConversation();
    }

    for (const element of messageElements) {
      let role = 'UNKNOWN';
      let content = '';

      if (element.tagName.toLowerCase() === 'user-query') {
        role = 'USER';
        // Content: span.query-text > p or just .query-text
        const contentEl = element.querySelector('.query-text');
        if (contentEl) content = contentEl.innerText || contentEl.textContent;
      } else if (element.tagName.toLowerCase() === 'model-response') {
        role = 'GEMINI';
        // Content: message-content .markdown
        const contentEl = element.querySelector('.markdown');
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
const injector = new GeminiInjector();
injector.initialize();
