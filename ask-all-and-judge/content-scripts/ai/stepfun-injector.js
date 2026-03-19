// StepFun (阶跃星辰/跃问) Content Script Injector

class StepFunInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'StepFun',
      inputSelectors: [
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label*="发送"]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        '[class*="markdown"]',
        '[class*="message"]',
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
    super('stepfun', config);
  }
}

const injector = new StepFunInjector();
injector.initialize();
