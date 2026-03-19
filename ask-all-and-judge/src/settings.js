import { SETTINGS_KEY, DEFAULT_SETTINGS, AI_CATALOG, UI_STRINGS, DEFAULT_SELECTIONS, DEFAULT_SELECTIONS_2 } from './constants.js';
import { state } from './state.js';
import { DOM } from './dom.js';
import { getUIText, getModelLabel, showToast } from './utils.js';
import { setLayout, ensureUniqueSelections, syncSelectOptions, setPanelAI, buildCustomDropdown, closeDropdown } from './panels.js';
import { closePromptLibrary, applyPromptLibraryLanguage } from './prompt-library.js';
import { updateReadyState } from './messaging.js';
import { restartOnboarding } from './onboarding.js';

export function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function applyTheme() {
  const theme = state.settings.theme || 'auto';
  if (theme === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } else if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function applyLanguage() {
  const lang = state.settings.uiLanguage || 'en';
  
  // Update static UI elements
  if (DOM.sendButton) DOM.sendButton.textContent = getUIText('send');
  if (DOM.settingsTitle) DOM.settingsTitle.textContent = getUIText('settingsTitle');
  if (DOM.settingsUiLabel) DOM.settingsUiLabel.textContent = getUIText('settingsUiLabel');
  if (DOM.settingsThemeLabel) DOM.settingsThemeLabel.textContent = getUIText('settingsThemeLabel');
  
  const layoutLabel = document.getElementById('settings-layout-label');
  if (layoutLabel) layoutLabel.textContent = getUIText('settingsDefaultLayout');

  // Update Judge Template Label
  const judgeTemplateLabel = document.getElementById('settings-judge-template-label');
  if (judgeTemplateLabel) judgeTemplateLabel.textContent = getUIText('settingsJudgeTemplateLabel');

  // Update Restart Tutorial button
  const tutorialButton = document.getElementById('show-tutorial-button');
  if (tutorialButton) tutorialButton.textContent = getUIText('onboardingRestartTutorial');

  // Update View Source Code button
  const viewSourceButton = document.querySelector('[data-i18n="viewSourceCode"]');
  if (viewSourceButton) viewSourceButton.textContent = getUIText('viewSourceCode');

  // Update Judge Import button
  const judgeImportButton = document.getElementById('judge-collect-button');
  if (judgeImportButton) {
    const span = judgeImportButton.querySelector('span');
    if (span) span.textContent = getUIText('judgeImportButton');
  }

  // Update Settings Panel Labels (Panel 1, Panel 2...)
  const panelLabels = document.querySelectorAll('.settings-ai-row-label');
  panelLabels.forEach((label, index) => {
      label.textContent = getUIText('settingsPanel', index + 1);
  });

  // Update Theme Options
  if (DOM.uiThemeSelect) {
      Array.from(DOM.uiThemeSelect.options).forEach(opt => {
          if (opt.value === 'auto') opt.textContent = getUIText('settingsThemeAuto');
          if (opt.value === 'light') opt.textContent = getUIText('settingsThemeLight');
          if (opt.value === 'dark') opt.textContent = getUIText('settingsThemeDark');
      });
      populateCustomSelect(DOM.uiThemeSelect, document.getElementById('settings-theme-wrapper'));
  }

  // Update AI Selects in Settings (to reflect translated model names if any)
  if (DOM.settingsAiSelects) {
      DOM.settingsAiSelects.forEach((select, index) => {
          if (!select) return;
          Array.from(select.options).forEach(opt => {
              opt.textContent = getModelLabel(opt.value);
          });
          populateCustomSelect(select, document.getElementById(`settings-ai-wrapper-${index + 1}`));
      });
  }

  // Update Main Panels
  state.panels.forEach(panel => {
    if (panel.title) {
       panel.title.textContent = getModelLabel(panel.select.value);
    }
    if (panel.select) {
        panel.select.setAttribute('aria-label', getUIText('selectLabel', panel.index));
    }
    // Rebuild dropdown to update "Note: Please authenticate..." and options
    buildCustomDropdown(panel);
  });

  // Update placeholders
  const anyReady = true; 
  if (DOM.queryInput) {
      // Logic to update placeholder if needed
  }

  applyPromptLibraryLanguage();
}

// Update visible AI config rows based on layout count
function updateVisibleAiConfigRows(layoutCount) {
  if (!DOM.settingsAiConfig || !DOM.settingsAiList) return;

  const rows = DOM.settingsAiList.querySelectorAll('.settings-ai-row');
  rows.forEach((row, index) => {
      row.hidden = index >= layoutCount;
  });
}

export function setupSettings() {
  if (!DOM.settingsButton || !DOM.settingsPanel) return;

  DOM.settingsButton.addEventListener('click', toggleSettings);
  
  const closeBtn = document.getElementById('settings-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSettings);
  }

  DOM.settingsSaveButton?.addEventListener('click', () => {
    closeSettings();
  });

  setupCustomSelect(DOM.uiLanguageSelect, document.getElementById('settings-language-wrapper'));
  setupCustomSelect(DOM.uiThemeSelect, document.getElementById('settings-theme-wrapper'));
  
  if (DOM.settingsAiSelects) {
      DOM.settingsAiSelects.forEach((select, index) => {
          setupCustomSelect(select, document.getElementById(`settings-ai-wrapper-${index + 1}`));
      });
  }

  // Auto-save listeners for selects
  const autoSaveSelects = [
      DOM.uiLanguageSelect,
      DOM.uiThemeSelect,
      ...(DOM.settingsAiSelects || [])
  ];

  autoSaveSelects.forEach(select => {
      if (select) {
          select.addEventListener('change', () => saveConfigFromUI(true));
      }
  });
  
  // Setup layout options in settings
  const layoutBtns = document.querySelectorAll('.settings-layout-button');
  layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
          layoutBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          // Update visible AI config rows based on selected layout
          updateVisibleAiConfigRows(Number(btn.dataset.layout));
          saveConfigFromUI(true);
      });
  });

  if (DOM.judgePromptTemplateTextarea) {
      DOM.judgePromptTemplateTextarea.addEventListener('blur', () => saveConfigFromUI(true));
  }

  // Restart Tutorial button
  const tutorialButton = document.getElementById('show-tutorial-button');
  if (tutorialButton) {
      tutorialButton.addEventListener('click', () => {
          closeSettings();
          restartOnboarding();
      });
  }

  // Site configuration grid
  setupSiteGrid();
}

// Build the site enable/disable grid in settings
function setupSiteGrid() {
  const grid = document.getElementById('settings-site-grid');
  if (!grid) return;

  // Load enabled sites from chrome.storage.local
  chrome.storage.local.get('enabledSites', (result) => {
    const enabledSites = result.enabledSites || DEFAULT_SELECTIONS;
    buildSiteGrid(grid, enabledSites);
  });
}

function buildSiteGrid(grid, enabledSites) {
  grid.innerHTML = '';
  
  Object.entries(AI_CATALOG).forEach(([key, config]) => {
    const isEnabled = enabledSites.includes(key);
    const item = document.createElement('div');
    item.className = `settings-site-item${isEnabled ? ' is-enabled' : ''}`;
    item.dataset.siteId = key;
    
    item.innerHTML = `
      <div class="settings-site-item-icon">
        <img src="${config.icon}" alt="" onerror="this.style.display='none'">
      </div>
      <span class="settings-site-item-name">${getModelLabel(key)}</span>
      <div class="settings-site-item-toggle"></div>
    `;
    
    item.addEventListener('click', () => {
      item.classList.toggle('is-enabled');
      saveSiteConfig(grid);
    });
    
    grid.appendChild(item);
  });
}

function saveSiteConfig(grid) {
  const enabledSites = [];
  grid.querySelectorAll('.settings-site-item.is-enabled').forEach(item => {
    enabledSites.push(item.dataset.siteId);
  });
  
  chrome.storage.local.set({ enabledSites }, () => {
    showToast(getUIText('settingsSaved'), 'success');
  });
}

function setupCustomSelect(nativeSelect, wrapper) {
    if (!nativeSelect || !wrapper) return;
    
    const trigger = wrapper.querySelector('.settings-select-trigger');
    const dropdown = wrapper.querySelector('.settings-select-dropdown');
    
    populateCustomSelect(nativeSelect, wrapper);

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close others
        document.querySelectorAll('.settings-custom-select.is-open').forEach(el => {
            if (el !== wrapper) {
                el.classList.remove('is-open');
                el.querySelector('.settings-select-dropdown').classList.remove('is-open');
            }
        });
        
        wrapper.classList.toggle('is-open');
        dropdown.classList.toggle('is-open');
    });
}

function populateCustomSelect(nativeSelect, wrapper) {
    if (!nativeSelect || !wrapper) return;

    const label = wrapper.querySelector('.settings-select-label');
    const iconContainer = wrapper.querySelector('.settings-select-icon');
    const dropdown = wrapper.querySelector('.settings-select-dropdown');
    
    // Clear existing options
    dropdown.innerHTML = '';
    
    Array.from(nativeSelect.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'settings-select-option';
        
        // Check if this option corresponds to an AI with an icon
        const aiConfig = AI_CATALOG[opt.value];
        if (aiConfig && aiConfig.icon) {
            item.innerHTML = `
                <div class="settings-select-option-icon">
                    <img src="${aiConfig.icon}" alt="">
                </div>
                <span class="settings-select-option-text">${opt.textContent}</span>
            `;
            item.classList.add('has-icon');
        } else {
            item.textContent = opt.textContent;
        }

        item.dataset.value = opt.value;
        if (opt.selected) item.classList.add('is-selected');
        
        item.addEventListener('click', () => {
            nativeSelect.value = opt.value;
            label.textContent = opt.textContent;

            // Update Icon in Trigger if it exists
            if (iconContainer) {
                if (aiConfig && aiConfig.icon) {
                     iconContainer.innerHTML = `<img src="${aiConfig.icon}" alt="">`;
                     iconContainer.hidden = false;
                } else {
                     iconContainer.innerHTML = '';
                }
            }
            
            // Visual update
            Array.from(dropdown.children).forEach(child => child.classList.remove('is-selected'));
            item.classList.add('is-selected');
            
            dropdown.classList.remove('is-open');
            wrapper.classList.remove('is-open');
            
            // Trigger change event on native select
            nativeSelect.dispatchEvent(new Event('change'));
        });
        
        dropdown.appendChild(item);
    });
    
    // Update label to match selected option
    const selectedOption = nativeSelect.options[nativeSelect.selectedIndex];
    if (selectedOption) {
        label.textContent = selectedOption.textContent;
        // Update Icon in Trigger on Init
        const aiConfig = AI_CATALOG[selectedOption.value];
        if (iconContainer) {
             if (aiConfig && aiConfig.icon) {
                 iconContainer.innerHTML = `<img src="${aiConfig.icon}" alt="">`;
                 iconContainer.hidden = false;
             } else {
                 iconContainer.innerHTML = '';
             }
        }
    }
}


export function toggleSettings() {
  if (DOM.settingsPanel.classList.contains('is-open')) {
    closeSettings();
  } else {
    openSettings();
  }
}

export function openSettings() {
  closePromptLibrary();
  state.panels.forEach(p => closeDropdown(p));
  
  // Sync UI with current settings
  if (DOM.uiLanguageSelect) DOM.uiLanguageSelect.value = state.settings.uiLanguage;
  if (DOM.uiThemeSelect) DOM.uiThemeSelect.value = state.settings.theme;
  
  // Sync layout buttons
  const layoutBtns = document.querySelectorAll('.settings-layout-button');
  layoutBtns.forEach(btn => {
      btn.classList.toggle('is-active', Number(btn.dataset.layout) === state.settings.defaultLayout);
  });
  
  // Sync Default Panel AIs
  if (DOM.settingsAiConfig) {
      DOM.settingsAiConfig.hidden = false;

      // Update visible rows based on selected layout
      const layoutCount = state.settings.defaultLayout || 3;
      updateVisibleAiConfigRows(layoutCount);

      // Get defaults based on layout count
      const defaultSelections = DEFAULT_SELECTIONS;

      if (DOM.settingsAiSelects) {
          DOM.settingsAiSelects.forEach((select, index) => {
              if (!select) return;

              // Populate options if empty
              if (select.options.length === 0) {
                  Object.entries(AI_CATALOG).forEach(([key, config]) => {
                      const opt = document.createElement('option');
                      opt.value = key;
                      opt.textContent = getModelLabel(key); // Translate here
                      select.appendChild(opt);
                  });
              } else {
                   // Ensure labels are up to date even if options exist
                   Array.from(select.options).forEach(opt => {
                       opt.textContent = getModelLabel(opt.value);
                   });
              }
              // Use saved setting or default for this layout
              const savedValue = state.settings.defaultPanelAIs[index];
              select.value = savedValue || defaultSelections[index];
              // Populate and Update custom select UI
              populateCustomSelect(select, document.getElementById(`settings-ai-wrapper-${index + 1}`));
          });
      }
  }

  if (DOM.judgePromptTemplateTextarea) {
      DOM.judgePromptTemplateTextarea.value = state.settings.judgePromptTemplate;
  }

  DOM.settingsPanel.classList.add('is-open');
  DOM.settingsPanel.setAttribute('aria-hidden', 'false');
  DOM.settingsButton.setAttribute('aria-expanded', 'true');
  
  // Focus the close button for accessibility
  document.getElementById('settings-close')?.focus();
}

export function closeSettings() {
  if (!DOM.settingsPanel) return;

  // Move focus back to the settings button before hiding the panel
  // to avoid aria-hidden on focused element warning.
  DOM.settingsButton?.focus();

  DOM.settingsPanel.classList.remove('is-open');
  DOM.settingsPanel.setAttribute('aria-hidden', 'true');
  DOM.settingsButton.setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.settings-custom-select.is-open').forEach(el => {
      el.classList.remove('is-open');
      el.querySelector('.settings-select-dropdown').classList.remove('is-open');
  });
}

function saveConfigFromUI(showNotification = true) {
  const newSettings = { ...state.settings };

  if (DOM.uiLanguageSelect) newSettings.uiLanguage = DOM.uiLanguageSelect.value;
  if (DOM.uiThemeSelect) newSettings.theme = DOM.uiThemeSelect.value;

  const activeLayoutBtn = document.querySelector('.settings-layout-button.is-active');
  if (activeLayoutBtn) {
      newSettings.defaultLayout = Number(activeLayoutBtn.dataset.layout);
  }

  // Only save visible AI selections based on layout count
  const layoutCount = newSettings.defaultLayout;
  if (DOM.settingsAiSelects) {
      newSettings.defaultPanelAIs = DOM.settingsAiSelects
          .filter((s, index) => s && index < layoutCount)
          .map(s => s.value);
  }

  if (DOM.judgePromptTemplateTextarea) {
      newSettings.judgePromptTemplate = DOM.judgePromptTemplateTextarea.value;
  }

  state.settings = newSettings;
  saveSettings();
  applyTheme();
  applyLanguage();

  if (showNotification) {
      showToast(getUIText('settingsSaved'), 'success');
  }
}