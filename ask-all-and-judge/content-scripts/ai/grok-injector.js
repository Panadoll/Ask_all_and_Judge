// Grok Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class GrokInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Grok',
      inputSelectors: [
        'div.tiptap.ProseMirror',
        'div[contenteditable="true"].ProseMirror',
        'div[role="textbox"][contenteditable="true"]',
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="Submit" i]',
        'button[aria-label*="提交"]',
        'button[aria-label*="Send" i]',
        'button[aria-label*="发送"]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        'div.message-bubble',
        '[class*="response"]',
        '[class*="assistant"]',
        'div[class*="markdown"]',
        'div.prose'
      ],
      stopButtonSelectors: [
        'button[aria-label*="Stop" i]',
        'button[aria-label*="停止"]'
      ],
      inputType: 'contenteditable',
      useExecCommand: true,
      loginIndicators: {
        loggedOut: [
          'a[href*="sign-in"]',
          'a[href*="sign-up"]',
          'a[href*="/login"]'
        ],
        loggedOutText: ['sign in', 'sign up', 'log in', '登录']
      },
      conversationSelectors: {
        userMessages: '[class*="user"]',
        assistantMessages: '[class*="assistant"]'
      }
    };
    super('grok', config);
  }

  // Override extractConversation for Grok
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Strategy 1: Try data-role or message-bubble containers
    let messageContainers = document.querySelectorAll(
      '[data-role="user"], [data-role="assistant"], div.message-bubble'
    );

    // Strategy 2: Try class-based turn containers
    if (messageContainers.length === 0) {
      messageContainers = document.querySelectorAll(
        '[class*="turn"], [class*="message-row"], [class*="chat-message"]'
      );
    }

    // Strategy 3: Wider class-based search
    if (messageContainers.length === 0) {
      messageContainers = document.querySelectorAll(
        '[class*="message"], [class*="response"]'
      );
    }

    if (messageContainers.length === 0) {
      return super.extractConversation();
    }

    for (const container of messageContainers) {
      let role = 'UNKNOWN';
      let content = '';

      const classList = container.classList?.toString()?.toLowerCase() || '';
      const dataRole = container.getAttribute?.('data-role');

      // Determine role using multiple signals
      if (dataRole === 'user' || classList.includes('user')) {
        role = 'USER';
      } else if (dataRole === 'assistant' || classList.includes('assistant') ||
                 classList.includes('grok') || classList.includes('bot')) {
        role = 'GROK';
      }

      if (role === 'UNKNOWN') continue;

      // Extract content - try structured content selectors first
      const contentEl = container.querySelector('.markdown') ||
                        container.querySelector('.prose') ||
                        container.querySelector('[class*="markdown"]') ||
                        container.querySelector('[class*="content"]');
      if (contentEl) {
        content = contentEl.innerText || contentEl.textContent;
      } else {
        content = container.innerText || container.textContent;
      }

      content = content ? content.trim() : '';

      // Filter out very short content (likely UI elements) and very long content (likely containers)
      if (content && content.length > 5 && content.length < 50000) {
        // Consolidate consecutive messages from the same role
        if (messages.length > 0 && messages[messages.length - 1].role === role) {
          messages[messages.length - 1].content += '\n\n' + content;
        } else {
          messages.push({ role, content });
        }
      }
    }

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
const injector = new GrokInjector();
injector.initialize();
