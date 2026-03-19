// ZhiPu (智谱清言) Content Script Injector

class ZhiPuInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'ZhiPu',
      inputSelectors: [
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[data-testid="send"]',
        'button[aria-label*="发送"]',
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
        loggedOut: ['a[href*="login"]'],
        loggedOutText: ['登录', '注册']
      }
    };
    super('zhipu', config);
  }
}

const injector = new ZhiPuInjector();
injector.initialize();
