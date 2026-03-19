// Kimi Content Script Injector

class KimiInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Kimi',
      inputSelectors: [
        'div[contenteditable="true"]',
        'div.ProseMirror',
        'textarea'
      ],
      submitSelectors: [
        'button[data-testid="send-button"]',
        'button[aria-label*="发送"]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        '[class*="markdown"]',
        '[class*="message-content"]',
        'div.prose'
      ],
      stopButtonSelectors: [
        'button[aria-label*="停止"]',
        'button[aria-label*="Stop" i]'
      ],
      inputType: 'contenteditable',
      loginIndicators: {
        loggedOut: ['a[href*="login"]'],
        loggedOutText: ['登录', '注册']
      }
    };
    super('kimi', config);
  }
}

const injector = new KimiInjector();
injector.initialize();
