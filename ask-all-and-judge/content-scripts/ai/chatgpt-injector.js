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

    // ChatGPT structure:
    // Messages are in 'article' elements with 'data-turn' attribute or 'data-testid'
    const articles = document.querySelectorAll('article[data-turn]');

    if (articles.length === 0) {
      // Fallback to role-based selection if article structure changes
      return super.extractConversation();
    }

    for (const article of articles) {
      let role = 'UNKNOWN';
      let content = '';

      const turn = article.getAttribute('data-turn');
      
      if (turn === 'user') {
        role = 'USER';
        // Content: div.whitespace-pre-wrap
        const contentEl = article.querySelector('div.whitespace-pre-wrap');
        if (contentEl) content = contentEl.innerText || contentEl.textContent;
      } else if (turn === 'assistant') {
        role = 'CHATGPT';
        // Content: div.markdown
        const contentEl = article.querySelector('div.markdown');
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
