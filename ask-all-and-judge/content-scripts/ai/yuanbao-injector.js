// YuanBao (腾讯元宝) Content Script Injector

class YuanBaoInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'YuanBao',
      inputSelectors: [
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="发送"]',
        'button[type="submit"]',
        'div[class*="send"]'
      ],
      responseSelectors: [
        '[class*="markdown"]',
        '[class*="message-content"]',
        'div.prose'
      ],
      stopButtonSelectors: [
        'button[aria-label*="停止"]'
      ],
      inputType: 'contenteditable',
      loginIndicators: {
        loggedOut: [],
        loggedOutText: ['登录', '注册']
      }
    };
    super('yuanbao', config);
  }
}

const injector = new YuanBaoInjector();
injector.initialize();
