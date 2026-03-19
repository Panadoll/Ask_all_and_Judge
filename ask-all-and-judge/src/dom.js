export const DOM = {
  get sendButton() { return document.getElementById('send-button'); },
  get addPanelButton() { return document.getElementById('add-panel-button'); },
  get addPanelPopup() { return document.getElementById('add-panel-popup'); },
  get addPanelList() { return document.getElementById('add-panel-list'); },
  get queryInput() { return document.getElementById('query-input'); },
  get statusText() { return document.getElementById('status-text'); },
  get layoutButtons() { return Array.from(document.querySelectorAll('.layout-button')); },
  get layoutControls() { return document.querySelector('.layout-controls'); },
  get frameGrid() { return document.querySelector('.frame-grid'); },
  get composer() { return document.querySelector('.composer'); },
  get composerRow() { return document.querySelector('.composer-row'); },
  get composerResizer() { return document.querySelector('.composer-resizer'); },
  
  // Settings
  get settingsButton() { return document.getElementById('settings-button'); },
  get settingsPanel() { return document.getElementById('settings-panel'); },
  get settingsTitle() { return document.getElementById('settings-title'); },
  get settingsUiLabel() { return document.getElementById('settings-ui-label'); },
  get settingsThemeLabel() { return document.getElementById('settings-theme-label'); },
  get uiLanguageSelect() { return document.getElementById('ui-language'); },
  get uiThemeSelect() { return document.getElementById('ui-theme'); },
  get settingsLayoutOptions() { return document.getElementById('settings-layout-options'); },
  get settingsAiConfig() { return document.getElementById('settings-ai-config'); },
  get settingsAiList() { return document.getElementById('settings-ai-list'); },
  get settingsAiSelects() {
    return [
      document.getElementById('settings-ai-select-1'),
      document.getElementById('settings-ai-select-2'),
      document.getElementById('settings-ai-select-3'),
      document.getElementById('settings-ai-select-4')
    ];
  },
  get settingsSaveButton() { return document.getElementById('settings-save-button'); },

  // Prompt Library
  get promptLibraryToggle() { return document.getElementById('prompt-library-toggle'); },
  get promptLibraryPanel() { return document.getElementById('prompt-library-panel'); },
  get promptLibraryTitle() { return document.getElementById('prompt-library-title'); },
  get promptTitleLabel() { return document.getElementById('prompt-title-label'); },
  get promptShortcutLabel() { return document.getElementById('prompt-shortcut-label'); },
  get promptTextLabel() { return document.getElementById('prompt-text-label'); },
  get promptTitleInput() { return document.getElementById('prompt-title'); },
  get promptShortcutInput() { return document.getElementById('prompt-shortcut'); },
  get promptTextInput() { return document.getElementById('prompt-text'); },
  get promptSaveButton() { return document.getElementById('prompt-save'); },
  get promptCancelButton() { return document.getElementById('prompt-cancel'); },
  get promptLibrarySearch() { return document.getElementById('prompt-library-search'); },
  get promptLibraryList() { return document.getElementById('prompt-library-list'); },
  get promptLibraryEmpty() { return document.getElementById('prompt-library-empty'); },
  get promptLibraryHelp() { return document.getElementById('prompt-library-help'); },
  get promptTextExample() { return document.getElementById('prompt-text-example'); },
  get promptSuggestions() { return document.getElementById('prompt-suggestions'); },
  get promptSuggestionsList() { return document.getElementById('prompt-suggestions-list'); },
  get judgePromptTemplateTextarea() { return document.getElementById('judge-prompt-template'); },

  // Judge
  get judgeButton() { return document.getElementById('judge-button'); },
  get judgePanel() { return document.getElementById('judge-panel'); },
  get judgeBackButton() { return document.getElementById('judge-back-button'); },
  get judgeCollectButton() { return document.getElementById('judge-collect-button'); },
  get judgeResizer() { return document.querySelector('.judge-resizer'); },
  get judgeIframe() { return document.getElementById('judge-iframe'); },
  get judgeAiSelect() { return document.getElementById('judge-ai-select'); },
  get judgeAiSelectWrapper() { return document.getElementById('judge-ai-select-wrapper'); },
  get judgeModelSelectionPopup() { return document.getElementById('judge-model-selection-popup'); },
  get judgeModelSelectionList() { return document.getElementById('judge-model-selection-list'); },

  // Unified View
  get unifiedViewButton() { return document.getElementById('unified-view-button'); },
  get unifiedViewPanel() { return document.getElementById('unified-view-panel'); },
  get unifiedViewCloseButton() { return document.getElementById('unified-view-close-button'); },
  get unifiedViewCollectButton() { return document.getElementById('unified-view-collect-button'); },
  get unifiedViewContent() { return document.getElementById('unified-view-content'); },
  get unifiedViewResizer() { return document.querySelector('.unified-view-resizer'); },

  // Dynamic Elements Helpers
  getPanels() {
    return Array.from(document.querySelectorAll('.frame-panel')).map((panel, index) => ({
      panel,
      index: index + 1,
      iframe: panel.querySelector('iframe'),
      select: panel.querySelector('.ai-select'),
      selectWrapper: panel.querySelector('.ai-select-wrapper'),
      selectTrigger: panel.querySelector('.ai-select-trigger'),
      selectDropdown: panel.querySelector('.ai-select-dropdown'),
      title: panel.querySelector('.frame-title'),
      badge: panel.querySelector('.ai-mark'),
      dot: panel.querySelector('.status-dot'),
      refreshBtn: panel.querySelector('[data-action="refresh"]'),
      fullscreenBtn: panel.querySelector('[data-action="fullscreen"]'),
      closeBtn: panel.querySelector('[data-action="close"]'),
      exportBtn: panel.querySelector('[data-action="export"]')
    }));
  }
};
