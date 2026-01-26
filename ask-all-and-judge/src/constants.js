// Import shared AI catalog from single source of truth
export { AI_CATALOG, DEFAULT_SELECTIONS } from '../shared/constants.js';
export const DEFAULT_SELECTIONS_2 = ['chatgpt', 'gemini'];
export const SETTINGS_KEY = 'parallel_query_settings';
export const PROMPT_LIBRARY_KEY = 'parallel_query_prompt_library';
export const ONBOARDING_KEY = 'parallel_query_onboarding_completed';

// Get browser language for default setting
const browserLang = (typeof navigator !== 'undefined' && navigator.language.startsWith('zh')) ? 'zh' : 'en';

// Default Judge Prompt Templates by language
const DEFAULT_JUDGE_PROMPTS = {
  en: 'You are a professional AI response analyzer. Below are conversations from different AI models on the same topic. Please analyze and compare them, highlighting key similarities, differences, and unique insights.\n\n{conversations}\n\nProvide a comprehensive analysis in a clear, structured format.',
  zh: '你是一位专业的 AI 回答分析师。以下是不同 AI 模型针对同一主题的对话。请分析并比较它们，重点说明关键的相似之处、差异和独特见解。\n\n{conversations}\n\n请以清晰、结构化的格式提供全面的分析。'
};

export const DEFAULT_SETTINGS = {
  uiLanguage: browserLang,
  theme: 'auto',
  defaultLayout: 3,
  defaultPanelAIs: ['chatgpt', 'gemini', 'claude', 'qwen'],
  judgePromptTemplate: DEFAULT_JUDGE_PROMPTS[browserLang]
};

export const UI_STRINGS = {
  en: {
    send: 'Send',
    layoutLabel: 'Layout',
    layoutTitle: (count) => `${count} panels`,
    selectLabel: (index) => `Select AI for panel ${index}`,
    placeholderReady: 'Enter for newline, Ctrl/Cmd+Enter to send. Type / to browse prompts.',
    placeholderLoading: 'Loading AI panels...',
    statusErrorQuestion: 'Please enter a question.',
    statusErrorNoPanels: 'No active AI panels selected.',
    statusErrorNotReady: 'No selected AI is ready yet.',
    statusSent: (successCount, total) => `Sent to ${successCount} of ${total} selected.`, 
    statusSendFailed: (message) => `Send failed: ${message}`,
    statusErrorFrom: (aiLabel, error) => `Error from ${aiLabel}: ${error}`,
    settingsTitle: 'Settings',
    settingsUiLabel: 'Interface language',
    settingsThemeLabel: 'Theme',
    settingsThemeAuto: 'Auto',
    settingsThemeLight: 'Light',
    settingsThemeDark: 'Dark',
    settingsDefaultLayout: 'Default layout on open',
    settingsDefaultLayoutDesc: 'Choose how many panels to show when the app opens',
    settingsPanel: (index) => `Panel ${index}`,
    settingsJudgeTemplateLabel: 'Customize AI Judge Prompt',
    promptLibraryTitle: 'Prompt library',
    promptLibraryToggleTitle: 'Prompt library',
    promptLibraryTitleLabel: 'Title',
    promptLibraryTitlePlaceholder: 'Optional name',
    promptLibraryShortcutLabel: 'Shortcut',
    promptLibraryShortcutPlaceholder: 'Type a shortcut word. (Optional)',
    promptLibraryTextLabel: 'Prompt',
    promptLibraryTextPlaceholder: 'Write the full prompt',
    promptLibrarySearchPlaceholder: 'Search prompts',
    promptLibrarySave: 'Add',
    promptLibraryUpdate: 'Update',
    promptLibraryCancel: 'Cancel',
    promptLibraryInsert: 'Insert',
    promptLibraryEdit: 'Edit',
    promptLibraryDelete: 'Delete',
    promptLibraryMoveToFront: 'Move to top',
    promptLibraryEmpty: 'No prompts yet.',
    promptLibraryDuplicate: 'Shortcut already exists.',
    promptLibraryMissing: 'Prompt text is required.',
    promptLibraryShortcutInvalid: 'Shortcut cannot include spaces.',
    promptLibraryDeleteConfirm: 'Delete this prompt?',
    promptLibraryHelp: 'Tip: Shortcuts (e.g., "$sum") expand into the full prompt when typed. Use "/" to browse all prompts.',
    promptLibraryTextExample: 'Example: "$sum" -> "Summarize the following content..."',
    exportMarkdown: 'Export as Markdown',
    exportTo: (aiName) => `Export conversation to ${aiName}`,
    exportToMarkdown: 'Export conversation as Markdown',
    exportToJudge: 'Export to Judge',
    judgeImportButton: 'Import and Judge',
    statusErrorNoJudgeSelected: 'Please select a Judge AI first.',
    aiSelectReminder: 'Note: Please authenticate in a separate tab before selecting an AI.',
    settingsSaved: 'Configuration saved.',

    // Onboarding
    onboardingWelcomeTitle: 'Welcome to Ask All & Judge!',
    onboardingWelcomeDescription: 'Let\'s take a quick tour to help you get started with the key features.',
    onboardingWelcomeStart: 'Start Tour',
    onboardingWelcomeClose: 'Close',
    onboardingNext: 'Next',
    onboardingPrevious: 'Previous',
    onboardingFinish: 'Finish',
    onboardingProgress: (current, total) => `Step ${current} of ${total}`,
    onboardingRestartTutorial: 'Restart Tutorial',
    onboardingCompleteTitle: 'All set!',
    onboardingCompleteMessage: 'You\'re ready to start using Ask All & Judge. Enjoy!',
    viewSourceCode: 'View Source Code'
  },
  zh: {
    send: '发送',
    layoutLabel: '布局',
    layoutTitle: (count) => `${count} 个面板`,
    selectLabel: (index) => `为第 ${index} 个面板选择 AI`,
    placeholderReady: 'Enter 换行，Ctrl/Cmd+Enter 发送。输入 / 浏览提示词。',
    placeholderLoading: '正在加载 AI 面板...', 
    statusErrorQuestion: '请输入问题。',
    statusErrorNoPanels: '没有可用的 AI 面板。',
    statusErrorNotReady: '选中的 AI 仍在加载。',
    statusSent: (successCount, total) => `已发送给 ${total} 个中的 ${successCount} 个。`,
    statusSendFailed: (message) => `发送失败：${message}`,
    statusErrorFrom: (aiLabel, error) => `来自 ${aiLabel} 的错误：${error}`,
    settingsTitle: '设置',
    settingsUiLabel: '界面语言',
    settingsThemeLabel: '外观主题',
    settingsThemeAuto: '跟随系统',
    settingsThemeLight: '浅色模式',
    settingsThemeDark: '深色模式',
    settingsDefaultLayout: '打开时的默认布局',
    settingsDefaultLayoutDesc: '选择打开应用时显示的面板数量',
    settingsPanel: (index) => `面板 ${index}`,
    settingsJudgeTemplateLabel: '自定义 AI 评判提示词',
    promptLibraryTitle: '提示词库',
    promptLibraryToggleTitle: '提示词库',
    promptLibraryTitleLabel: '标题',
    promptLibraryTitlePlaceholder: '可选名称',
    promptLibraryShortcutLabel: '替换词',
    promptLibraryShortcutPlaceholder: '输入替换词 (可选)',
    promptLibraryTextLabel: '提示词',
    promptLibraryTextPlaceholder: '输入完整提示词',
    promptLibrarySearchPlaceholder: '搜索提示词',
    promptLibrarySave: '新增',
    promptLibraryUpdate: '更新',
    promptLibraryCancel: '取消',
    promptLibraryInsert: '插入',
    promptLibraryEdit: '编辑',
    promptLibraryDelete: '删除',
    promptLibraryMoveToFront: '置顶',
    promptLibraryEmpty: '暂时没有提示词。',
    promptLibraryDuplicate: '替换词已存在。',
    promptLibraryMissing: '提示词不能为空。',
    promptLibraryShortcutInvalid: '替换词不能包含空格。',
    promptLibraryDeleteConfirm: '确认删除该提示词吗？',
    promptLibraryHelp: '小贴士：输入替换词（如 "$sum"）可快速展开。输入 "/" 可浏览所有提示词。',
    promptLibraryTextExample: '例如："$sum" -> "请总结以下内容..."',
    exportMarkdown: '导出为 Markdown',
    exportTo: (aiName) => `导出对话至 ${aiName}`,
    exportToMarkdown: '导出对话为 Markdown',
    exportToJudge: '导出至评判 AI',
    judgeImportButton: '导入并评判',
    statusErrorNoJudgeSelected: '请先选择评判 AI。',
    aiSelectReminder: '说明：请先在其他标签页完成认证再选择对应 AI。',
    settingsSaved: '配置已保存。',

    // Onboarding
    onboardingWelcomeTitle: '欢迎使用 Ask All & Judge！',
    onboardingWelcomeDescription: '让我们快速浏览一下核心功能，帮助您快速上手。',
    onboardingWelcomeStart: '开始导览',
    onboardingWelcomeClose: '关闭',
    onboardingNext: '下一步',
    onboardingPrevious: '上一步',
    onboardingFinish: '完成',
    onboardingProgress: (current, total) => `第 ${current} 步，共 ${total} 步`,
    onboardingRestartTutorial: '重新查看教程',
    onboardingCompleteTitle: '全部完成！',
    onboardingCompleteMessage: '您已准备好开始使用 Ask All & Judge。祝您使用愉快！',
    viewSourceCode: '查看源代码'
  }
};

export const MODEL_NAME_TRANSLATIONS = {
  doubao: { zh: '豆包' },
  qwen: { zh: '通义千问' }
};

export const ONBOARDING_STEPS = {
  en: [
    {
      id: 'ai-selector',
      target: '.ai-select-trigger',
      title: 'Switch Between AI Models',
      description: 'Click on the AI icon at the top of any panel to switch between different AI models like ChatGPT, Claude, Gemini, and more.',
      position: 'bottom',
      highlightPadding: 8
    },
    {
      id: 'export',
      target: '[data-action="export"]',
      title: 'Export Conversations',
      description: 'Export AI responses to other panels for comparison or verification. For example, send ChatGPT\'s answer to Gemini to get a second opinion.',
      position: 'bottom',
      highlightPadding: 8
    },
    {
      id: 'prompt-library',
      target: '.prompt-library-toggle',
      title: 'Prompt Library',
      description: 'Save and reuse your favorite prompts. Create shortcuts like "$sum" that expand into full prompts when you type them.',
      position: 'right',
      highlightPadding: 8
    },
    {
      id: 'query-input',
      target: '#query-input',
      title: 'Quick Access to Prompts',
      description: 'Type "/" in the input field to browse all saved prompts. Use arrow keys (↑↓) to navigate and press Enter to select. This gives you quick access to your prompt library without clicking.',
      position: 'top',
      highlightPadding: 8
    },
    {
      id: 'judge-button',
      target: '.judge-button',
      title: 'AI Judge',
      description: 'Use an AI to analyze and compare responses from multiple models. Perfect for getting an objective evaluation of different answers.',
      position: 'left',
      highlightPadding: 8
    },
    {
      id: 'collect-button',
      target: '.judge-collect-button',
      title: 'Import and Judge',
      description: 'After opening the Judge AI panel, click here to import responses from all panels and send them to the Judge AI for comprehensive analysis using your custom prompt template.',
      position: 'left',
      highlightPadding: 8,
      requiresJudgePanelOpen: true
    },
    {
      id: 'judge-prompt-template',
      target: '#judge-prompt-template',
      title: 'Customize AI Judge Prompt',
      description: 'Here you can customize the AI Judge Prompt Template to control how the Judge AI analyzes and compares responses. Use {conversations} as a placeholder where collected AI conversations will be inserted. Tailor the analysis style to your needs.',
      position: 'top',
      highlightPadding: 8,
      requiresSettingsOpen: true
    }
  ],
  zh: [
    {
      id: 'ai-selector',
      target: '.ai-select-trigger',
      title: '切换 AI 模型',
      description: '点击面板顶部的 AI 图标，可以在 ChatGPT、Claude、Gemini 等不同 AI 模型之间切换。',
      position: 'bottom',
      highlightPadding: 8
    },
    {
      id: 'export',
      target: '[data-action="export"]',
      title: '导出对话',
      description: '将 AI 的回答导出到其他面板进行对比或验证。例如，将 ChatGPT 的回答发送给 Gemini 进行二次验证。',
      position: 'bottom',
      highlightPadding: 8
    },
    {
      id: 'prompt-library',
      target: '.prompt-library-toggle',
      title: '提示词库',
      description: '保存并重复使用您最喜欢的提示词。创建像 "$sum" 这样的替换词，输入时会自动展开为完整提示词。',
      position: 'right',
      highlightPadding: 8
    },
    {
      id: 'query-input',
      target: '#query-input',
      title: '快速访问提示词',
      description: '在输入框中输入 "/" 可以浏览所有已保存的提示词。使用方向键（↑↓）导航，按 Enter 选择。无需点击即可快速访问您的提示词库。',
      position: 'top',
      highlightPadding: 8
    },
    {
      id: 'judge-button',
      target: '.judge-button',
      title: 'AI 评判',
      description: '使用 AI 来分析和比较多个模型的回答。非常适合获得对不同答案的客观评估。',
      position: 'left',
      highlightPadding: 8
    },
    {
      id: 'collect-button',
      target: '.judge-collect-button',
      title: '导入并评判',
      description: '打开评判 AI 面板后，点击这里导入所有面板的回答，并使用您的自定义提示词模板发送给评判 AI 进行全面分析。',
      position: 'left',
      highlightPadding: 8,
      requiresJudgePanelOpen: true
    },
    {
      id: 'judge-prompt-template',
      target: '#judge-prompt-template',
      title: '自定义 AI 评判提示词',
      description: '在这里您可以自定义 AI 评判提示词模板，控制评判 AI 如何分析和比较回答。使用 {conversations} 作为占位符，收集到的 AI 对话将插入此处。根据您的需求定制分析风格。',
      position: 'top',
      highlightPadding: 8,
      requiresSettingsOpen: true
    }
  ]
};