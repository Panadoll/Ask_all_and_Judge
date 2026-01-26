import { DOM } from './dom.js';
import { state } from './state.js';
import { loadSettings, setupSettings, applyTheme, applyLanguage } from './settings.js';
import { setupPanels, handleAddPanel, setLayout, setPanelAI, ensureUniqueSelections, syncSelectOptions, syncPanelsWithDom } from './panels.js';
import { setupPromptLibrary, maybeReplacePromptShortcut } from './prompt-library.js';
import { updatePromptSuggestions, handlePromptSuggestionKey } from './prompt-suggestions.js';
import { setupJudgePanelResizer, setupJudgeAISelector, showJudgeModelSelection, toggleJudgePanel, closeJudgePanel, handleJudgeCollectAndSend } from './judge.js';
import { setupMessaging, registerExtensionTab, requestStatus } from './messaging.js';
import { handleTextareaResize } from './utils.js';
import { AI_CATALOG } from './constants.js';
import { FocusManager } from './ui-behaviors/focus-manager.js';
import { ComposerResizer } from './ui-behaviors/composer-resizer.js';
import { QueryHandler } from './query-handler.js';
import { setupOnboarding } from './onboarding.js';

function initialize() {
  if (!DOM.sendButton || !DOM.queryInput) return;

  // Initial State Setup
  state.panels = DOM.getPanels();
  loadSettings();
  setupSettings();
  setupPromptLibrary();

  // Create UI behavior managers
  const focusManager = new FocusManager(DOM.queryInput, state, DOM);
  const composerResizer = new ComposerResizer(DOM.composer, DOM.composerResizer, handleTextareaResize);
  const queryHandler = new QueryHandler({ DOM, state });

  // Event Listeners
  DOM.sendButton.addEventListener('click', () => queryHandler.send());
  if (DOM.addPanelButton) {
    DOM.addPanelButton.addEventListener('click', handleAddPanel);
  }
  DOM.queryInput.addEventListener('input', handleQueryInput);
  DOM.queryInput.addEventListener('compositionend', handleQueryInput);
  DOM.queryInput.addEventListener('keydown', (e) => handleKeyDown(e, queryHandler));

  // Judge Feature - clicking judge button now shows model selection popup or toggles panel
  if (DOM.judgeButton) {
    DOM.judgeButton.addEventListener('click', () => {
      // If user has already selected a judge AI, just toggle the panel
      if (state.selectedJudgeAI) {
        toggleJudgePanel();
      } else {
        showJudgeModelSelection();
      }
    });
  }
  if (DOM.judgeBackButton) {
    DOM.judgeBackButton.addEventListener('click', closeJudgePanel);
  }
  if (DOM.judgeCollectButton) {
    DOM.judgeCollectButton.addEventListener('click', () => {
      // Get the currently selected judge AI
      const aiKey = state.selectedJudgeAI || (DOM.judgeAiSelect ? DOM.judgeAiSelect.value : 'chatgpt');
      handleJudgeCollectAndSend(aiKey);
    });
  }
  if (DOM.judgeResizer) {
    setupJudgePanelResizer();
  }
  if (DOM.judgePanel) {
    setupJudgeAISelector();
  }

  setupMessaging();

  setupPanels();
  syncPanelsWithDom();
  setupLayoutControls();
  composerResizer.initialize();

  // Apply saved default layout
  setLayout(state.settings.defaultLayout);
  applyLanguage();
  applyTheme();

  // Apply saved default panel AIs for 4-panel layout
  if (state.settings.defaultLayout === 4) {
    state.panels.forEach((panelObj, index) => {
      const aiKey = state.settings.defaultPanelAIs[index];
      if (aiKey && AI_CATALOG[aiKey]) {
        setPanelAI(panelObj, aiKey);
      }
    });
    ensureUniqueSelections();
    syncSelectOptions();
  }

  registerExtensionTab();
  requestStatus();
  handleTextareaResize();

  state.initializationComplete = true;
  focusManager.startProtection();

  // Check and show onboarding for first-time users
  setupOnboarding();
}

function setupLayoutControls() {
  DOM.layoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const count = Number(button.dataset.layout || 3);
      setLayout(count);
    });
  });
}

function handleQueryInput(event) {
  maybeReplacePromptShortcut(event);
  handleTextareaResize();
  updatePromptSuggestions(event);
}

function handleKeyDown(event, queryHandler) {
  if (handlePromptSuggestionKey(event)) return;
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    queryHandler.send();
  }
}

// Start Initialization
initialize();
