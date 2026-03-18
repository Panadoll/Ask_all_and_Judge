/**
 * Configuration-driven AI injector definitions
 * Centralizes selectors and behavior flags to reduce boilerplate code
 */

export const INJECTOR_CONFIGS = {
  chatgpt: {
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
    inputType: 'mixed', // Can be textarea or contenteditable
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
  },

  claude: {
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
    useExecCommand: true, // Claude works well with execCommand
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
  },

  gemini: {
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
    inputType: 'textarea',
    hasShadowDOM: true, // Gemini uses Shadow DOM for rich-textarea
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
  },

  qwen: {
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
      'button:has(svg[class*="send"])'
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
  },

  deepseek: {
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
      'button[type="submit"]'
    ],
    responseSelectors: [
      '.message-content',
      '[class*="bot-message"]',
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
  },

  doubao: {
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
      'button[type="submit"]'
    ],
    responseSelectors: [
      '.message-content',
      '[class*="assistant-message"]',
      '[class*="bot-message"]'
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
  },

  grok: {
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
  }
};
/**
 * Get configuration for a specific AI
 */
export function getConfig(aiName) {
  const config = INJECTOR_CONFIGS[aiName];
  if (!config) {
    throw new Error(`No configuration found for AI: ${aiName}`);
  }
  return config;
}
