// ChatGPT Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class ChatGPTInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'ChatGPT',
      inputSelectors: [
        '#prompt-textarea',
        'textarea[data-id="root"]',
        'textarea[placeholder*="Message" i]',
        'textarea[placeholder*="Send a message" i]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea'
      ],
      submitSelectors: [
        'button[data-testid="send-button"]',
        'button[data-testid="fruitjuice-send-button"]',
        'button[aria-label*="Send" i]',
        'button svg[class*="send"]',
        'form button[type="submit"]'
      ],
      responseSelectors: [
        '[data-message-author-role="assistant"]',
        '.agent-turn',
        '.markdown.prose',
        'div[class*="markdown"]'
      ],
      stopButtonSelectors: [
        'button[aria-label*="Stop" i]',
        'button[data-testid="stop-button"]'
      ],
      inputType: 'mixed',
      loginIndicators: {
        loggedOut: [
          'button:not([disabled])',
          'a[href*="login"]',
          'a[href*="auth"]'
        ],
        loggedOutText: ['log in', 'sign in', 'sign up']
      },
      conversationSelectors: {
        userMessages: '[data-message-author-role="user"]',
        assistantMessages: '[data-message-author-role="assistant"]'
      }
    };
    super('chatgpt', config);
  }

  // Override extractConversation for ChatGPT
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Strategy 1: New ChatGPT structure with data-testid
    let articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');

    // Strategy 2: Old structure with data-turn attribute
    if (articles.length === 0) {
      articles = document.querySelectorAll('article[data-turn]');
    }

    // Strategy 3: Use data-message-author-role directly
    if (articles.length === 0) {
      const roleElements = document.querySelectorAll('[data-message-author-role]');
      if (roleElements.length > 0) {
        for (const el of roleElements) {
          const dataRole = el.getAttribute('data-message-author-role');
          let role = 'UNKNOWN';
          let content = '';

          if (dataRole === 'user') {
            role = 'USER';
            const contentEl = el.querySelector('div.whitespace-pre-wrap') || el;
            content = contentEl.innerText || contentEl.textContent;
          } else if (dataRole === 'assistant') {
            role = 'CHATGPT';
            const contentEl = el.querySelector('div.markdown') ||
                              el.querySelector('div[class*="markdown"]') || el;
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

        for (const msg of messages) {
          markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
        }
        return markdown;
      }

      // Final fallback
      return super.extractConversation();
    }

    for (const article of articles) {
      let role = 'UNKNOWN';
      let content = '';

      // Try new data-testid format first, then data-turn
      const turn = article.getAttribute('data-turn');
      const roleEl = article.querySelector('[data-message-author-role]');
      const detectedRole = roleEl?.getAttribute('data-message-author-role') || turn;
      
      if (detectedRole === 'user') {
        role = 'USER';
        // Content: div.whitespace-pre-wrap (multiple fallbacks)
        const contentEl = article.querySelector('div.whitespace-pre-wrap') ||
                          article.querySelector('[data-message-author-role="user"]');
        if (contentEl) content = contentEl.innerText || contentEl.textContent;
      } else if (detectedRole === 'assistant') {
        role = 'CHATGPT';
        // Content: div.markdown (multiple fallbacks)
        const contentEl = article.querySelector('div.markdown') ||
                          article.querySelector('div[class*="markdown"]') ||
                          article.querySelector('.prose') ||
                          article.querySelector('[data-message-author-role="assistant"]');
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
const injector = new ChatGPTInjector();
injector.initialize();
