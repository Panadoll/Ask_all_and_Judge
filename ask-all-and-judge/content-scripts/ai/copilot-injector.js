// Copilot Content Script Injector

class CopilotInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Copilot',
      inputSelectors: [
        'textarea#searchbox',
        'textarea[name="searchbox"]',
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="Submit" i]',
        'button[aria-label*="Send" i]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        '[class*="response"]',
        '[class*="answer"]',
        'div[class*="markdown"]'
      ],
      stopButtonSelectors: [
        'button[aria-label*="Stop" i]'
      ],
      inputType: 'textarea',
      loginIndicators: {
        loggedOut: ['a[href*="login"]', 'a[href*="signin"]'],
        loggedOutText: ['sign in', 'log in', '登录']
      }
    };
    super('copilot', config);
  }
}

const injector = new CopilotInjector();
injector.initialize();
