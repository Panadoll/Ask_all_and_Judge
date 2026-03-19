// MiniMax (海螺AI) Content Script Injector

class MiniMaxInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'MiniMax',
      inputSelectors: [
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="发送"]',
        'button[aria-label*="Send" i]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        '[class*="markdown"]',
        '[class*="message"]',
        'div.prose'
      ],
      stopButtonSelectors: [
        'button[aria-label*="停止"]',
        'button[aria-label*="Stop" i]'
      ],
      inputType: 'contenteditable',
      loginIndicators: {
        loggedOut: [],
        loggedOutText: ['登录', '注册']
      }
    };
    super('minimax', config);
  }
}

const injector = new MiniMaxInjector();
injector.initialize();
