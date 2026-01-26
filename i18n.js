// Internationalization configuration
const translations = {
  en: {
    title: "Ask All & Judge",
    nav: {
      features: "Features",
      demo: "Demo"
    },
    hero: {
      badge: "Chrome Extension v1.0",
      title1: "Ask All AIs.",
      title2: "Judge the Best.",
      description: "Query ChatGPT, Claude, Gemini, and other AI assistants simultaneously in a split-screen interface. Let an AI judge compare and evaluate their responses.",
      cta: {
        install: "Install from Chrome Store",
        github: "View on GitHub",
        demo: "Watch Demo"
      },
      features: {
        free: "100% Free",
        opensource: "Open Source",
        noapi: "No API Required"
      }
    },
    features: {
      subtitle: "Features",
      title: "Everything you need in one extension",
      description: "Built for power users who want the best AI responses.",
      parallel: {
        title: "Parallel Querying",
        description: "Ask multiple AI assistants the same question simultaneously. Save time and get diverse perspectives in one view."
      },
      judge: {
        title: "AI Judge & Compare",
        description: "Let another AI evaluate and compare all responses. Get unbiased analysis on which answer is most accurate and helpful."
      },
      library: {
        title: "Prompt Library",
        description: "Save and organize your frequently used prompts. Create shortcuts for instant access to your favorite queries."
      },
      export: {
        title: "Export & Transfer",
        description: "Export conversations to Markdown or transfer responses between AI services. Continue conversations across different platforms seamlessly."
      },
      multiple: {
        title: "Multiple AI Support",
        description: "Works with ChatGPT, Claude, Gemini, Qwen, and more. Easily switch between different AI models in each panel."
      },
      noapi: {
        title: "No API Required",
        description: "Use your existing AI subscriptions directly through browser sessions. No API keys needed, no extra costs, just your own accounts."
      }
    },
    demo: {
      subtitle: "See It In Action",
      title: "Experience the Power",
      description: "Watch how Ask All & Judge simplifies your AI workflow",
      askall: {
        title: "Query All AIs Simultaneously",
        description: "Send your question to multiple AI assistants at once. View all responses side-by-side in a clean, organized interface.",
        feature1: "Split-screen layout with 2-4 panels",
        feature2: "Real-time response streaming",
        feature3: "Easy panel customization"
      },
      judge: {
        title: "AI Judge Comparison",
        description: "Get an impartial AI to analyze and compare all responses. Discover which answer is most accurate, comprehensive, and helpful.",
        feature1: "Objective comparison analysis",
        feature2: "Detailed evaluation criteria",
        feature3: "Customizable judge prompts"
      },
      library: {
        title: "Prompt Library & Shortcuts",
        description: "Save your best prompts and create keyboard shortcuts. Access your prompt collection instantly whenever you need it.",
        feature1: "Save unlimited prompts",
        feature2: "Quick search and filtering",
        feature3: "Keyboard shortcuts for favorites"
      },
      export: {
        title: "Export & Transfer Conversations",
        description: "Seamlessly move conversations between AI platforms or save them as Markdown. Continue discussions where they make most sense.",
        feature1: "Transfer responses between AIs",
        feature2: "Export as Markdown format",
        feature3: "One-click conversation copy"
      }
    },
    cta: {
      title: "Ready to enhance your AI workflow?",
      description: "Install the extension and start getting better AI responses today.",
      button: "Install from Chrome Store"
    },
    footer: {
      copyright: "© 2026 Ask All & Judge. Open Source Project."
    }
  },
  zh: {
    title: "AI问个遍",
    nav: {
      features: "功能特性",
      demo: "功能演示"
    },
    hero: {
      badge: "Chrome 扩展 v1.0",
      title1: "一键问遍所有AI。",
      title2: "让AI来评判最佳答案。",
      description: "同时向 ChatGPT、Claude、Gemini 等多个 AI 助手提问，在分屏界面中查看所有回答。让 AI 评委比较和评估它们的响应。",
      cta: {
        install: "从 Chrome 商店安装",
        github: "在 GitHub 上查看",
        demo: "观看演示"
      },
      features: {
        free: "完全免费",
        opensource: "开源项目",
        noapi: "无需 API"
      }
    },
    features: {
      subtitle: "功能特性",
      title: "一个扩展满足所有需求",
      description: "为追求最佳 AI 响应的高级用户打造。",
      parallel: {
        title: "并行查询",
        description: "同时向多个 AI 助手提出相同问题。节省时间，在一个视图中获得多样化的观点。"
      },
      judge: {
        title: "AI 评委与对比",
        description: "让另一个 AI 评估和比较所有响应。获得关于哪个答案最准确、最有帮助的客观分析。"
      },
      library: {
        title: "提示词库",
        description: "保存和整理您常用的提示词。创建快捷方式，即时访问您喜爱的查询。"
      },
      export: {
        title: "导出与传递",
        description: "将对话导出为 Markdown 或在不同 AI 服务间传递回答。在不同平台间无缝继续对话。"
      },
      multiple: {
        title: "多 AI 支持",
        description: "支持 ChatGPT、Claude、Gemini、Qwen 等。轻松在每个面板中切换不同的 AI 模型。"
      },
      noapi: {
        title: "无需 API",
        description: "直接使用您现有的 AI 订阅账号，通过浏览器会话访问。无需 API 密钥，无额外费用，只需您自己的账号。"
      }
    },
    demo: {
      subtitle: "实际演示",
      title: "体验强大功能",
      description: "观看 AI问个遍 如何简化您的 AI 工作流程",
      askall: {
        title: "同时查询所有 AI",
        description: "一次性将您的问题发送给多个 AI 助手。在清晰、有序的界面中并排查看所有响应。",
        feature1: "2-4 面板的分屏布局",
        feature2: "实时响应流式传输",
        feature3: "轻松的面板自定义"
      },
      judge: {
        title: "AI 评委对比",
        description: "让一个公正的 AI 分析和比较所有响应。发现哪个答案最准确、最全面、最有帮助。",
        feature1: "客观的比较分析",
        feature2: "详细的评估标准",
        feature3: "可自定义的评委提示词"
      },
      library: {
        title: "提示词库与快捷方式",
        description: "保存您最好的提示词并创建键盘快捷键。随时即时访问您的提示词收藏。",
        feature1: "保存无限提示词",
        feature2: "快速搜索和筛选",
        feature3: "收藏的键盘快捷键"
      },
      export: {
        title: "导出与传递对话",
        description: "无缝地在 AI 平台间移动对话或将其保存为 Markdown。在最合适的地方继续讨论。",
        feature1: "在 AI 间传递回答",
        feature2: "导出为 Markdown 格式",
        feature3: "一键复制对话内容"
      }
    },
    cta: {
      title: "准备好增强您的 AI 工作流程了吗？",
      description: "立即安装扩展，开始获得更好的 AI 响应。",
      button: "从 Chrome 商店安装"
    },
    footer: {
      copyright: "© 2026 AI问个遍。开源项目。"
    }
  }
};

// Get browser language or default to English
let currentLang = localStorage.getItem('language') || (navigator.language.startsWith('zh') ? 'zh' : 'en');

// Function to update all text on the page
function updateTexts() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const keys = key.split('.');
    let value = translations[currentLang];

    for (const k of keys) {
      value = value?.[k];
    }

    if (value) {
      element.textContent = value;
    }
  });

  // Update lang button text
  const langText = document.getElementById('lang-text');
  if (langText) {
    langText.textContent = currentLang === 'en' ? 'EN' : '中文';
  }

  // Update HTML lang attribute
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateTexts();

  // Language toggle button
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'zh' : 'en';
      localStorage.setItem('language', currentLang);
      updateTexts();
    });
  }
});
