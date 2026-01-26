// Claude Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class ClaudeInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Claude',
      inputSelectors: [
        'div[contenteditable="true"][translate="no"]',
        'div[contenteditable="true"]',
        '.ProseMirror',
        'div[data-testid="chat-input"]'
      ],
      submitSelectors: [
        'button[aria-label="Send message"]',
        'button:has(svg)',
        'button[class*="Button_claude"]'
      ],
      responseSelectors: [
        '.font-claude-response',
        '.font-claude-response-body',
        'div[class*="font-claude-response"]'
      ],
      stopButtonSelectors: [
        'button[aria-label="Stop response"]'
      ],
      inputType: 'contenteditable',
      useExecCommand: true,
      loginIndicators: {
        loggedOut: [
          'a[href*="login"]',
          'a[href*="sign"]',
          'button[data-testid="login-button"]'
        ],
        loggedOutText: ['log in', 'sign up', 'continue with']
      },
      conversationSelectors: {
        userMessages: 'div[data-is-user-message="true"]',
        assistantMessages: 'div[data-is-user-message="false"]'
      }
    };
    super('claude', config);
  }

  // Override extractConversation for Claude
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Claude structure:
    // Messages are often grouped or in specific containers
    // We can look for the specific message bodies
    const userMessages = document.querySelectorAll('div[data-testid="user-message"]');
    const aiMessages = document.querySelectorAll('div.font-claude-response');
    
    // To preserve order, we need to find a common parent or iterate a main container
    // The chat container is usually a large div with many children
    // Let's try to select all potential message wrappers
    
    // A reliable way is to find all elements with data-testid="user-message" OR class "font-claude-response"
    // and sort them by position, or query a parent.
    
    // Trying to select all relevant nodes in document order
    // We can use a broad selector for the message content containers
    const allContentNodes = document.querySelectorAll('div[data-testid="user-message"], div.font-claude-response');

    if (allContentNodes.length === 0) {
      return super.extractConversation();
    }

    for (const node of allContentNodes) {
      let role = 'UNKNOWN';
      let content = '';

      if (node.getAttribute('data-testid') === 'user-message') {
        role = 'USER';
        content = node.innerText || node.textContent;
      } else if (node.classList.contains('font-claude-response')) {
        role = 'CLAUDE';
        content = node.innerText || node.textContent;
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
const injector = new ClaudeInjector();
injector.initialize();
