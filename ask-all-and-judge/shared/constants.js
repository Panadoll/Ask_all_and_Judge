// Shared AI Catalog - Single source of truth
// This file is imported by both src/constants.js and content-scripts/constants.js

export const AI_CATALOG = {
  chatgpt: {
    id: 'chatgpt',
    label: 'ChatGPT',
    url: 'https://chatgpt.com',
    icon: 'icons/ai/chatgpt.svg',
    exportFormat: 'markdown'
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    url: 'https://claude.ai/new',
    icon: 'icons/ai/claude-color.svg',
    exportFormat: 'markdown'
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    url: 'https://gemini.google.com/app',
    icon: 'icons/ai/gemini-color.svg',
    exportFormat: 'markdown'
  },
  qwen: {
    id: 'qwen',
    label: 'Qwen',
    url: 'https://chat.qwen.ai/',
    icon: 'icons/ai/qwen-color.svg',
    exportFormat: 'markdown'
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    icon: 'icons/ai/deepseek-color.svg',
    exportFormat: 'markdown'
  },
  doubao: {
    id: 'doubao',
    label: 'Doubao',
    url: 'https://www.doubao.com/',
    icon: 'icons/ai/doubao.png',
    exportFormat: 'markdown'
  },
  grok: {
    id: 'grok',
    label: 'Grok',
    url: 'https://grok.com/',
    icon: 'icons/ai/grok-color.svg',
    exportFormat: 'markdown'
  },
  copilot: {
    id: 'copilot',
    label: 'Copilot',
    url: 'https://copilot.microsoft.com/',
    icon: 'icons/ai/copilot.svg',
    exportFormat: 'markdown'
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi',
    url: 'https://kimi.moonshot.cn/',
    icon: 'icons/ai/kimi-color.svg',
    exportFormat: 'markdown'
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    url: 'https://chat.mistral.ai/',
    icon: 'icons/ai/mistral.svg',
    exportFormat: 'markdown'
  },
  zhipu: {
    id: 'zhipu',
    label: 'ZhiPu',
    url: 'https://chatglm.cn/',
    icon: 'icons/ai/zhipu.svg',
    exportFormat: 'markdown'
  },
  yuanbao: {
    id: 'yuanbao',
    label: 'YuanBao',
    url: 'https://yuanbao.tencent.com/',
    icon: 'icons/ai/yuanbao.svg',
    exportFormat: 'markdown'
  },
  stepfun: {
    id: 'stepfun',
    label: 'StepFun',
    url: 'https://yuewen.cn/',
    icon: 'icons/ai/stepfun.svg',
    exportFormat: 'markdown'
  },
  minimax: {
    id: 'minimax',
    label: 'MiniMax',
    url: 'https://hailuoai.com/',
    icon: 'icons/ai/minimax.svg',
    exportFormat: 'markdown'
  }
};

export const DEFAULT_SELECTIONS = ['chatgpt', 'gemini', 'deepseek', 'grok'];

export const EXTRA_AI_SERVICES = {
  qwen: { hostname: 'chat.qwen.ai' },
  doubao: { hostname: 'www.doubao.com' },
  deepseek: { hostname: 'chat.deepseek.com' },
  grok: { hostname: 'grok.com' },
  copilot: { hostname: 'copilot.microsoft.com' },
  kimi: { hostname: 'kimi.moonshot.cn' },
  mistral: { hostname: 'chat.mistral.ai' },
  zhipu: { hostname: 'chatglm.cn' },
  yuanbao: { hostname: 'yuanbao.tencent.com' },
  stepfun: { hostname: 'yuewen.cn' },
  minimax: { hostname: 'hailuoai.com' }
};
