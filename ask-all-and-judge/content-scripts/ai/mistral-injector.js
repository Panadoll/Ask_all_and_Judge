// Mistral Content Script Injector

class MistralInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Mistral',
      inputSelectors: [
        'textarea',
        'div[contenteditable="true"]'
      ],
      submitSelectors: [
        'button[type="submit"]',
        'button[aria-label*="Send" i]'
      ],
      responseSelectors: [
        '[class*="markdown"]',
        '[class*="message"]',
        'div.prose'
      ],
      stopButtonSelectors: [
        'button[aria-label*="Stop" i]'
      ],
      inputType: 'textarea',
      loginIndicators: {
        loggedOut: ['a[href*="login"]'],
        loggedOutText: ['sign in', 'log in']
      }
    };
    super('mistral', config);
  }
}

const injector = new MistralInjector();
injector.initialize();
