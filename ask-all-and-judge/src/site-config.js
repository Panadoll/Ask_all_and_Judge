// Centralized site configuration for all supported AI platforms
// Used by service-worker.js, main.js, and injectors

export const SUPPORTED_SITES = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    org: 'OpenAI',
    url: 'https://chatgpt.com',
    icon: 'icons/ai/chatgpt.png',
    urlFilters: ['||chatgpt.com/*', '||chat.openai.com/*'],
    hostPermissions: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
    enabled: true,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/chatgpt-injector.js',
    contentScriptMatches: ['https://chatgpt.com/*', 'https://chat.openai.com/*']
  },
  {
    id: 'claude',
    name: 'Claude',
    org: 'Anthropic',
    url: 'https://claude.ai',
    icon: 'icons/ai/claude.png',
    urlFilters: ['||claude.ai/*'],
    hostPermissions: ['https://claude.ai/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/claude-injector.js',
    contentScriptMatches: ['https://claude.ai/*']
  },
  {
    id: 'gemini',
    name: 'Gemini',
    org: 'Google',
    url: 'https://gemini.google.com',
    icon: 'icons/ai/gemini.png',
    urlFilters: ['||gemini.google.com/*'],
    hostPermissions: ['https://gemini.google.com/*'],
    enabled: true,
    tools: ['WebSearch', 'Thinking', 'DeepSearch'],
    injectionScript: 'content-scripts/ai/gemini-injector.js',
    contentScriptMatches: ['https://gemini.google.com/*']
  },
  {
    id: 'grok',
    name: 'Grok',
    org: 'xAI',
    url: 'https://grok.com',
    icon: 'icons/ai/grok.png',
    urlFilters: ['||grok.com/*', '||grokusercontent.com/*'],
    hostPermissions: ['https://grok.com/*'],
    enabled: true,
    tools: ['WebSearch', 'Thinking', 'DeepSearch'],
    injectionScript: 'content-scripts/ai/grok-injector.js',
    contentScriptMatches: ['https://grok.com/*']
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    org: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    icon: 'icons/ai/deepseek.png',
    urlFilters: ['||chat.deepseek.com/*'],
    hostPermissions: ['https://chat.deepseek.com/*'],
    enabled: true,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/deepseek-injector.js',
    contentScriptMatches: ['https://chat.deepseek.com/*']
  },
  {
    id: 'qwen',
    name: 'Qwen',
    org: 'Alibaba',
    url: 'https://chat.qwen.ai',
    icon: 'icons/ai/qwen.png',
    urlFilters: ['||chat.qwen.ai/*'],
    hostPermissions: ['https://chat.qwen.ai/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/qwen-injector.js',
    contentScriptMatches: ['https://chat.qwen.ai/*']
  },
  {
    id: 'doubao',
    name: 'Doubao',
    org: 'ByteDance',
    url: 'https://www.doubao.com',
    icon: 'icons/ai/doubao.png',
    urlFilters: ['||www.doubao.com/*', '||doubao.com/*'],
    hostPermissions: ['https://www.doubao.com/*', 'https://doubao.com/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/doubao-injector.js',
    contentScriptMatches: ['https://www.doubao.com/*', 'https://doubao.com/*']
  },
  {
    id: 'copilot',
    name: 'Copilot',
    org: 'Microsoft',
    url: 'https://copilot.microsoft.com',
    icon: 'icons/ai/copilot.png',
    urlFilters: ['||copilot.microsoft.com/*'],
    hostPermissions: ['https://copilot.microsoft.com/*'],
    enabled: false,
    tools: ['WebSearch'],
    injectionScript: 'content-scripts/ai/copilot-injector.js',
    contentScriptMatches: ['https://copilot.microsoft.com/*']
  },
  {
    id: 'kimi',
    name: 'Kimi',
    org: 'Moonshot',
    url: 'https://kimi.moonshot.cn',
    icon: 'icons/ai/kimi.png',
    urlFilters: ['||kimi.moonshot.cn/*'],
    hostPermissions: ['https://kimi.moonshot.cn/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/kimi-injector.js',
    contentScriptMatches: ['https://kimi.moonshot.cn/*']
  },
  {
    id: 'mistral',
    name: 'Mistral',
    org: 'Mistral AI',
    url: 'https://chat.mistral.ai',
    icon: 'icons/ai/mistral.png',
    urlFilters: ['||chat.mistral.ai/*'],
    hostPermissions: ['https://chat.mistral.ai/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/mistral-injector.js',
    contentScriptMatches: ['https://chat.mistral.ai/*']
  },
  {
    id: 'zhipu',
    name: 'ZhiPu',
    org: '智谱',
    url: 'https://chatglm.cn',
    icon: 'icons/ai/zhipu.png',
    urlFilters: ['||chatglm.cn/*'],
    hostPermissions: ['https://chatglm.cn/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/zhipu-injector.js',
    contentScriptMatches: ['https://chatglm.cn/*']
  },
  {
    id: 'yuanbao',
    name: 'YuanBao',
    org: 'Tencent',
    url: 'https://yuanbao.tencent.com',
    icon: 'icons/ai/yuanbao.png',
    urlFilters: ['||yuanbao.tencent.com/*'],
    hostPermissions: ['https://yuanbao.tencent.com/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/yuanbao-injector.js',
    contentScriptMatches: ['https://yuanbao.tencent.com/*']
  },
  {
    id: 'stepfun',
    name: 'StepFun',
    org: '阶跃星辰',
    url: 'https://yuewen.cn',
    icon: 'icons/ai/stepfun.png',
    urlFilters: ['||yuewen.cn/*'],
    hostPermissions: ['https://yuewen.cn/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/stepfun-injector.js',
    contentScriptMatches: ['https://yuewen.cn/*']
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    org: 'MiniMax',
    url: 'https://hailuoai.com',
    icon: 'icons/ai/minimax.png',
    urlFilters: ['||hailuoai.com/*'],
    hostPermissions: ['https://hailuoai.com/*'],
    enabled: false,
    tools: ['WebSearch', 'Thinking'],
    injectionScript: 'content-scripts/ai/minimax-injector.js',
    contentScriptMatches: ['https://hailuoai.com/*']
  }
];

// Default enabled sites (used when no user preference saved)
export const DEFAULT_ENABLED = ['chatgpt', 'gemini', 'grok', 'deepseek'];

// Get enabled sites from storage or defaults
export async function getEnabledSites() {
  return new Promise(resolve => {
    chrome.storage.local.get('enabledSites', result => {
      if (result.enabledSites) {
        resolve(result.enabledSites);
      } else {
        resolve(DEFAULT_ENABLED);
      }
    });
  });
}

// Save enabled sites to storage
export async function setEnabledSites(siteIds) {
  return new Promise(resolve => {
    chrome.storage.local.set({ enabledSites: siteIds }, resolve);
  });
}
