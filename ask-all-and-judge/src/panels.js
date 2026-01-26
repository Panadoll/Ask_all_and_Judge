import { DOM } from './dom.js';
import { AI_CATALOG, DEFAULT_SELECTIONS, DEFAULT_SELECTIONS_2 } from './constants.js';
import { getModelLabel, getUIText, showStatus } from './utils.js';
import { state } from './state.js';
import { updateReadyState } from './messaging.js';
import { closeSettings } from './settings.js';
import { closePromptLibrary } from './prompt-library.js';
import { closePromptSuggestions } from './prompt-suggestions.js';
import { handlePanelExport, initiateTransfer, closeExportDropdown, toggleExportDropdown } from './export.js';
import { closeJudgeModelSelection } from './judge.js';

export function setupPanels() {
  const layoutCount = state.settings.defaultLayout || 3;
  const defaultSelections = layoutCount === 2 ? DEFAULT_SELECTIONS_2 : DEFAULT_SELECTIONS;

  state.panels.forEach((panelObj, index) => {
    buildAIOptions(panelObj.select);
    buildCustomDropdown(panelObj);
    const defaultKey = defaultSelections[index] || Object.keys(AI_CATALOG)[0];
    setPanelAI(panelObj, defaultKey);

    // Setup custom dropdown interactions
    panelObj.selectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(panelObj);
    });

    // Native select fallback
    panelObj.select.addEventListener('change', () => {
      setPanelAI(panelObj, panelObj.select.value);
      ensureUniqueSelections();
      syncSelectOptions();
      updateReadyState(state.latestStatus);
    });

    if (panelObj.refreshBtn) {
      panelObj.refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePanelRefresh(panelObj);
      });
    }

    if (panelObj.fullscreenBtn) {
      panelObj.fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePanelFullscreen(panelObj);
      });
    }

    if (panelObj.closeBtn) {
      panelObj.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePanelClose(panelObj);
      });
    }

    if (panelObj.exportBtn) {
      // Wrap export button for positioning the dropdown
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.className = 'export-wrapper';
      panelObj.exportBtn.parentNode.insertBefore(wrapper, panelObj.exportBtn);
      wrapper.appendChild(panelObj.exportBtn);
      panelObj.exportWrapper = wrapper;

      // Create dropdown container
      const dropdown = document.createElement('div');
      dropdown.className = 'export-dropdown';
      wrapper.appendChild(dropdown);
      panelObj.exportDropdown = dropdown;

      panelObj.exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleExportDropdown(panelObj);
      });
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    // Check if clicking inside judge model selection popup
    const judgePopup = document.getElementById('judge-model-selection-popup');
    if (judgePopup && judgePopup.contains(e.target)) {
      return;
    }

    const judgeButton = document.getElementById('judge-button');
    if (judgeButton && judgeButton.contains(e.target)) {
      return;
    }

    closeJudgeModelSelection();

    state.panels.forEach(panelObj => {
      closeDropdown(panelObj);
      closeExportDropdown(panelObj);
    });
  });

  ensureUniqueSelections();
  syncSelectOptions();
}

export function handleAddPanel(event) {
  event.stopPropagation();
  toggleAddPanelPopup();
}

function toggleAddPanelPopup() {
  if (DOM.addPanelPopup && DOM.addPanelPopup.classList.contains('is-open')) {
    closeAddPanelPopup();
  } else {
    openAddPanelPopup();
  }
}

function openAddPanelPopup() {
  if (!DOM.addPanelPopup) return;
  closeSettings();
  closePromptLibrary();
  state.panels.forEach(p => closeDropdown(p));
  renderAddPanelList();
  DOM.addPanelPopup.classList.add('is-open');
  DOM.addPanelPopup.setAttribute('aria-hidden', 'false');
  if (DOM.addPanelButton) {
    DOM.addPanelButton.classList.add('is-open');
    DOM.addPanelButton.setAttribute('aria-expanded', 'true');
  }
  // Focus the first option for accessibility
  DOM.addPanelList?.querySelector('.ai-select-option')?.focus();
}

export function closeAddPanelPopup() {
  if (!DOM.addPanelPopup) return;

  // Return focus to the trigger button before hiding
  DOM.addPanelButton?.focus();

  DOM.addPanelPopup.classList.remove('is-open');
  DOM.addPanelPopup.setAttribute('aria-hidden', 'true');
  if (DOM.addPanelButton) {
    DOM.addPanelButton.classList.remove('is-open');
    DOM.addPanelButton.setAttribute('aria-expanded', 'false');
  }
}

function renderAddPanelList() {
  if (!DOM.addPanelList) return;
  DOM.addPanelList.innerHTML = '';
  
  Object.entries(AI_CATALOG).forEach(([key, config]) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'ai-select-option'; 
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'ai-select-option-icon';
    iconDiv.innerHTML = `<img src="${config.icon}" alt="${getModelLabel(key)}">`;

    const textDiv = document.createElement('div');
    textDiv.className = 'ai-select-option-text';
    textDiv.textContent = getModelLabel(key);

    optionDiv.appendChild(iconDiv);
    optionDiv.appendChild(textDiv);

    optionDiv.addEventListener('click', () => {
      selectNewPanelAI(key);
    });

    DOM.addPanelList.appendChild(optionDiv);
  });
}

function selectNewPanelAI(aiKey) {
  const currentLayout = getLayoutCount();
  if (currentLayout >= 4) {
    closeAddPanelPopup();
    return;
  }

  const nextIndex = currentLayout; 
  if (nextIndex < state.panels.length) {
    const nextPanelObj = state.panels[nextIndex];
    setPanelAI(nextPanelObj, aiKey);
    setLayout(currentLayout + 1);
  }
  closeAddPanelPopup();
}

export function handlePanelFullscreen(panelObj) {
  const isFullscreen = panelObj.panel.classList.toggle('is-fullscreen');
  const icon = panelObj.fullscreenBtn.querySelector('svg');

  if (isFullscreen) {
    // Change to minimize icon
    icon.innerHTML = '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>';
    panelObj.fullscreenBtn.setAttribute('aria-label', 'Exit Fullscreen');
  } else {
    // Change back to maximize icon
    icon.innerHTML = '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>';
    panelObj.fullscreenBtn.setAttribute('aria-label', 'Fullscreen');
  }

  // Close dropdowns if open
  closeDropdown(panelObj);
  if (panelObj.exportDropdown) closeExportDropdown(panelObj);
}

export function handlePanelRefresh(panelObj) {
  if (panelObj.iframe) {
    const currentSrc = panelObj.iframe.src;
    panelObj.iframe.src = 'about:blank';
    setTimeout(() => {
      panelObj.iframe.src = currentSrc;
    }, 50);
  }
}

export function handlePanelClose(panelObj) {
  const currentLayout = getLayoutCount();
  if (currentLayout <= 1) {
    return;
  }

  // Exit fullscreen if active before closing
  if (panelObj.panel.classList.contains('is-fullscreen')) {
    handlePanelFullscreen(panelObj);
  }

  const index = state.panels.indexOf(panelObj);
  if (index > -1) {
    state.panels.splice(index, 1);
    state.panels.push(panelObj);
    syncPanelsWithDom();
    setLayout(currentLayout - 1);
  }
}

function buildAIOptions(select) {
  if (!select) return;
  select.innerHTML = '';

  Object.entries(AI_CATALOG).forEach(([key, config]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = getModelLabel(key);
    select.appendChild(option);
  });
}

export function buildCustomDropdown(panelObj) {
  if (!panelObj.selectDropdown) return;

  panelObj.selectDropdown.innerHTML = '';

  Object.entries(AI_CATALOG).forEach(([key, config]) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'ai-select-option';
    optionDiv.dataset.value = key;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'ai-select-option-icon';
    iconDiv.innerHTML = `<img src="${config.icon}" alt="${getModelLabel(key)}">`;

    const textDiv = document.createElement('div');
    textDiv.className = 'ai-select-option-text';
    textDiv.textContent = getModelLabel(key);

    optionDiv.appendChild(iconDiv);
    optionDiv.appendChild(textDiv);

    optionDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      setPanelAI(panelObj, key);
      closeDropdown(panelObj);
      ensureUniqueSelections();
      syncSelectOptions();
      updateReadyState(state.latestStatus);
    });

    panelObj.selectDropdown.appendChild(optionDiv);
  });

  const noteDiv = document.createElement('div');
  noteDiv.className = 'ai-select-note';
  noteDiv.textContent = getUIText('aiSelectReminder');
  panelObj.selectDropdown.appendChild(noteDiv);
}

export function toggleDropdown(panelObj) {
  const isOpen = panelObj.selectDropdown.classList.contains('is-open');

  state.panels.forEach(p => closeDropdown(p));

  if (!isOpen) {
    openDropdown(panelObj);
  }
}

function openDropdown(panelObj) {
  closeSettings();
  closePromptLibrary();
  panelObj.selectDropdown.classList.add('is-open');
  panelObj.selectTrigger.classList.add('is-open');
  panelObj.selectTrigger.setAttribute('aria-expanded', 'true');
  updateDropdownOptions(panelObj);
}

export function closeDropdown(panelObj) {
  panelObj.selectDropdown.classList.remove('is-open');
  panelObj.selectTrigger.classList.remove('is-open');
  panelObj.selectTrigger.setAttribute('aria-expanded', 'false');
}

function updateDropdownOptions(panelObj) {
  const currentValue = panelObj.select.value;
  const activePanels = getActivePanels();
  const selected = new Set(activePanels.map(p => p.select.value));

  Array.from(panelObj.selectDropdown.children).forEach((optionDiv) => {
    if (optionDiv.classList.contains('ai-select-note')) return;

    const value = optionDiv.dataset.value;
    const isSelected = value === currentValue;
    const isDisabled = selected.has(value) && !isSelected && activePanels.includes(panelObj);

    optionDiv.classList.toggle('is-selected', isSelected);
    optionDiv.classList.toggle('is-disabled', isDisabled);
  });
}

export function setPanelAI(panelObj, aiKey) {
  const config = AI_CATALOG[aiKey];
  if (!config) return;

  // Update focus protection state
  if (state.initializationComplete && !state.hasUserSelectedAI) {
    state.hasUserSelectedAI = true;
    state.shouldProtectFocus = false;
  }

  const label = getModelLabel(aiKey);

  panelObj.panel.dataset.ai = aiKey;

  if (panelObj.title) {
    panelObj.title.textContent = label;
  }

  if (panelObj.badge) {
    panelObj.badge.innerHTML = `<img src="${config.icon}" alt="${label}">`;
  }

  if (panelObj.select) {
    panelObj.select.value = aiKey;
  }

  if (panelObj.iframe) {
    panelObj.iframe.src = config.url;
  }

  updateDropdownOptions(panelObj);
}

export function ensureUniqueSelections() {
  const activePanels = getActivePanels();
  const used = new Set();

  activePanels.forEach((panelObj) => {
    let aiKey = panelObj.select.value;

    if (used.has(aiKey)) {
      const fallback = Object.keys(AI_CATALOG).find((key) => !used.has(key));
      if (fallback) {
        setPanelAI(panelObj, fallback);
        aiKey = fallback;
      }
    }

    used.add(aiKey);
  });
}

export function syncSelectOptions() {
  const activePanels = getActivePanels();
  const selected = new Set(activePanels.map((panelObj) => panelObj.select.value));

  state.panels.forEach((panelObj) => {
    Array.from(panelObj.select.options).forEach((option) => {
      if (!activePanels.includes(panelObj)) {
        option.disabled = false;
        return;
      }
      option.disabled = selected.has(option.value) && option.value !== panelObj.select.value;
    });
  });
}

export function getLayoutCount() {
  return Number(document.body.dataset.layout || 3);
}

export function setLayout(count) {
  document.body.dataset.layout = String(count);
  DOM.layoutButtons.forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.layout) === count);
  });
  if (DOM.addPanelButton) {
    DOM.addPanelButton.disabled = count >= 4;
  }
  ensureUniqueSelections();
  syncSelectOptions();
  updateReadyState(state.latestStatus);
}

export function getActivePanels() {
  const count = getLayoutCount();
  return state.panels.slice(0, count);
}

export function getSelectedTargets() {
  const activePanels = getActivePanels();
  const targets = [];

  activePanels.forEach((panelObj) => {
    const aiKey = panelObj.select.value;
    if (aiKey && !targets.includes(aiKey)) {
      targets.push(aiKey);
    }
  });

  return targets;
}

export function syncPanelsWithDom() {
  state.panels.forEach((panelObj, index) => {
    const panelIndex = index + 1;
    panelObj.index = panelIndex;
    panelObj.panel.dataset.panel = String(panelIndex);
    panelObj.panel.style.order = String(panelIndex);
    if (panelObj.selectWrapper) {
      panelObj.selectWrapper.dataset.panel = String(panelIndex);
    }
    if (panelObj.select) {
      panelObj.select.dataset.panel = String(panelIndex);
      panelObj.select.setAttribute('aria-label', getUIText('selectLabel', panelIndex));
    }
  });
}
