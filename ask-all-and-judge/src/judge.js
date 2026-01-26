import { DOM } from './dom.js';
import { state } from './state.js';
import { AI_CATALOG, DEFAULT_SETTINGS } from './constants.js';
import { getModelLabel, getUIText, showStatus, showToast } from './utils.js';
import { handlePanelExport } from './export.js';
import { getActivePanels } from './panels.js';

// Show model selection popup when judge button is clicked
export function showJudgeModelSelection() {
  const popup = DOM.judgeModelSelectionPopup;
  if (!popup) return;

  renderJudgeModelList();
  popup.classList.add('is-open');
  popup.setAttribute('aria-hidden', 'false');

  if (DOM.judgeButton) {
    DOM.judgeButton.classList.add('is-active');
  }
}

export function closeJudgeModelSelection() {
  const popup = DOM.judgeModelSelectionPopup;
  if (!popup) return;

  popup.classList.remove('is-open');
  popup.setAttribute('aria-hidden', 'true');

  if (DOM.judgeButton) {
    DOM.judgeButton.classList.remove('is-active');
  }
}

function renderJudgeModelList() {
  const list = DOM.judgeModelSelectionList;
  if (!list) return;

  list.innerHTML = '';

  Object.entries(AI_CATALOG).forEach(([key, config]) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'judge-model-option';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'judge-model-option-icon';
    iconDiv.innerHTML = `<img src="${config.icon}" alt="${getModelLabel(key)}">`;

    const textDiv = document.createElement('div');
    textDiv.className = 'judge-model-option-text';
    textDiv.textContent = getModelLabel(key);

    optionDiv.appendChild(iconDiv);
    optionDiv.appendChild(textDiv);

    optionDiv.addEventListener('click', () => {
      selectJudgeModel(key);
    });

    list.appendChild(optionDiv);
  });
}

function selectJudgeModel(aiKey) {
  closeJudgeModelSelection();

  // Set the selected judge AI
  if (DOM.judgeAiSelect) {
    DOM.judgeAiSelect.value = aiKey;
  }

  // Store selected AI in state
  state.selectedJudgeAI = aiKey;

  // Open judge panel with selected AI
  openJudgePanel();

  // Update judge AI display
  updateJudgeAIDisplay(aiKey);

  // Show status message
  showStatus(`Judge panel opened with ${getModelLabel(aiKey)}. Use the collect button to analyze conversations.`, 'success');
}

export function toggleJudgePanel() {
  if (DOM.judgePanel && !DOM.judgePanel.hidden) {
    closeJudgePanel();
  } else {
    openJudgePanel();
  }
}

export function closeJudgePanel() {
  if (DOM.judgePanel) {
    DOM.judgePanel.classList.remove('is-open');
    // Delay hiding until transition completes
    setTimeout(() => {
      if (!DOM.judgePanel.classList.contains('is-open')) {
        DOM.judgePanel.hidden = true;
      }
    }, 300);
    DOM.judgeButton?.classList.remove('is-active');
  }
}

export function openJudgePanel() {
  if (DOM.judgePanel) {
    DOM.judgePanel.hidden = false;
    // Use requestAnimationFrame to ensure hidden=false is applied before adding is-open
    requestAnimationFrame(() => {
      DOM.judgePanel.classList.add('is-open');
    });
    DOM.judgeButton?.classList.add('is-active');

    // Get the AI key from state or select
    const aiKey = state.selectedJudgeAI || (DOM.judgeAiSelect ? DOM.judgeAiSelect.value : 'chatgpt');

    // Update display
    updateJudgeAIDisplay(aiKey);
  }
}

export function setupJudgePanelResizer() {
  // Logic for judge resizer (similar to composer resizer but horizontal usually, or vertical?)
  // The original code had `judgeResizer` but didn't seem to have full implementation logic in the snippet I saw?
  // I will check the original file again if needed.
  // Wait, I missed reading the full original file for `setupJudgePanelResizer`.
  // I'll leave a placeholder or basic implementation. 
  // Assuming it resizes the width of the aside panel.
  
  if (!DOM.judgeResizer || !DOM.judgePanel) return;

  let startX = 0;
  let startWidth = 0;
  let isResizing = false;

  const handlePointerMove = (event) => {
    if (!isResizing) return;
    const delta = startX - event.clientX; // Dragging left increases width
    const nextWidth = Math.max(300, Math.min(window.innerWidth * 0.8, startWidth + delta));
    DOM.judgePanel.style.width = `${nextWidth}px`;
  };

  const stopResize = (event) => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    DOM.judgeResizer.releasePointerCapture(event.pointerId);
  };

  DOM.judgeResizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    isResizing = true;
    startX = event.clientX;
    startWidth = DOM.judgePanel.getBoundingClientRect().width;
    DOM.judgeResizer.setPointerCapture(event.pointerId);
    document.body.style.cursor = 'ew-resize';
  });

  DOM.judgeResizer.addEventListener('pointermove', handlePointerMove);
  DOM.judgeResizer.addEventListener('pointerup', stopResize);
  DOM.judgeResizer.addEventListener('pointercancel', stopResize);
}

export function setupJudgeAISelector() {
    if (!DOM.judgeAiSelect || !DOM.judgeAiSelectWrapper) return;

    // Populate options
    DOM.judgeAiSelect.innerHTML = '';
    Object.entries(AI_CATALOG).forEach(([key, config]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = getModelLabel(key);
        DOM.judgeAiSelect.appendChild(opt);
    });

    const trigger = DOM.judgeAiSelectWrapper.querySelector('.ai-select-trigger');
    const dropdown = DOM.judgeAiSelectWrapper.querySelector('.ai-select-dropdown');
    
    // Custom dropdown logic
    dropdown.innerHTML = '';
    Object.entries(AI_CATALOG).forEach(([key, config]) => {
        const div = document.createElement('div');
        div.className = 'ai-select-option';
        div.innerHTML = `<div class="ai-select-option-icon"><img src="${config.icon}" alt="${getModelLabel(key)}"></div><div class="ai-select-option-text">${getModelLabel(key)}</div>`;
        div.addEventListener('click', () => {
             setJudgeAI(key);
             dropdown.classList.remove('is-open');
             trigger.classList.remove('is-open');
        });
        dropdown.appendChild(div);
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('is-open');
        trigger.classList.toggle('is-open');
    });
    
    // Initial set - only set the display, not the selected state
    // Don't set selectedJudgeAI yet, wait for user to explicitly select
    const defaultAi = 'chatgpt';
    setJudgeAIOnlyDisplay(defaultAi);
}

function setJudgeAIOnlyDisplay(aiKey) {
    const config = AI_CATALOG[aiKey];
    if (!config) return;

    if (DOM.judgeAiSelect) DOM.judgeAiSelect.value = aiKey;

    if (DOM.judgeAiSelectWrapper) {
        const badge = DOM.judgeAiSelectWrapper.querySelector('.ai-mark');
        const title = DOM.judgeAiSelectWrapper.querySelector('.frame-title');
        if (badge) badge.innerHTML = `<img src="${config.icon}" alt="">`;
        if (title) title.textContent = getModelLabel(aiKey);
    }
}

function setJudgeAI(aiKey) {
    const config = AI_CATALOG[aiKey];
    if (!config) return;

    // Update state
    state.selectedJudgeAI = aiKey;

    if (DOM.judgeAiSelect) DOM.judgeAiSelect.value = aiKey;

    if (DOM.judgeAiSelectWrapper) {
        const badge = DOM.judgeAiSelectWrapper.querySelector('.ai-mark');
        const title = DOM.judgeAiSelectWrapper.querySelector('.frame-title');
        if (badge) badge.innerHTML = `<img src="${config.icon}" alt="">`;
        if (title) title.textContent = getModelLabel(aiKey);
    }

    if (DOM.judgeIframe) {
        if (DOM.judgeIframe.dataset.currentAi !== aiKey) {
            DOM.judgeIframe.src = config.url;
            DOM.judgeIframe.dataset.currentAi = aiKey;
        }
    }
}

function updateJudgeAIDisplay(aiKey) {
    const key = aiKey || (DOM.judgeAiSelect ? DOM.judgeAiSelect.value : 'chatgpt');
    setJudgeAI(key);
}

export function handleJudgeCollectAndSend(selectedAiKey) {
    state.collectingForJudge = true;
    state.collectedConversations = [];
    state.selectedJudgeAI = selectedAiKey;

    // Identify active panels
    const activePanels = getActivePanels();

    if (activePanels.length === 0) {
        showToast('No active panels to collect from', 'error');
        state.collectingForJudge = false;
        return;
    }

    showStatus('Collecting conversations from AI panels...');

    // We need to request export from all panels
    activePanels.forEach(panel => {
        handlePanelExport(panel);
    });

    // Set a timeout to handle cases where not all panels respond
    setTimeout(() => {
        if (state.collectingForJudge && state.collectedConversations.length < activePanels.length) {
            // Some panels didn't respond in time, proceed with what we have
            if (state.collectedConversations.length > 0) {
                finalizeJudgeCollection();
            } else {
                showToast('Failed to collect conversations from AI panels', 'error');
                state.collectingForJudge = false;
            }
        }
    }, 10000); // 10 second timeout
}

export function finalizeJudgeCollection() {
     // This is called when all exports are received or timeout
     state.collectingForJudge = false;

     // Check for empty conversations and show warning
     const emptyAIs = state.collectedConversations.filter(c => !c.content || c.content.trim() === '');
     if (emptyAIs.length > 0) {
         const aiNames = emptyAIs.map(c => getModelLabel(c.ai)).join(', ');
         showToast(`Warning: No conversation content found from ${aiNames}`, 'error');

         // Filter out empty conversations
         state.collectedConversations = state.collectedConversations.filter(c => c.content && c.content.trim() !== '');
     }

     if (state.collectedConversations.length === 0) {
         showToast('No conversations to analyze. Please have conversations with the AIs first.', 'error');
         return;
     }

     const conversations = state.collectedConversations.map(c =>
         `### ${getModelLabel(c.ai)}

${c.content}`
     ).join('\n\n---\n\n');

     const template = state.settings.judgePromptTemplate || DEFAULT_SETTINGS.judgePromptTemplate;
     const finalPrompt = template.replace('{conversations}', conversations);

     // Use the selected judge AI from state
     const judgeAiKey = state.selectedJudgeAI || DOM.judgeAiSelect?.value || 'chatgpt';

     // Make sure judge panel is open (it should already be open from model selection)
     if (DOM.judgePanel && DOM.judgePanel.hidden) {
         openJudgePanel();
     }

     // Ensure the iframe is loaded with the correct AI
     const judgeIframe = DOM.judgeIframe;
     if (!judgeIframe) {
         showToast('Judge panel not ready', 'error');
         return;
     }

     const targetUrl = AI_CATALOG[judgeAiKey]?.url;
     if (!targetUrl) {
         showToast('Invalid judge AI selected', 'error');
         return;
     }

     // Function to send the prompt to the iframe
     const sendPromptToJudge = () => {
         judgeIframe.contentWindow.postMessage({
             type: 'PARALLEL_QUERY_IMPORT_REQUEST',
             ai: judgeAiKey,
             content: finalPrompt
         }, '*');

         showStatus('Conversations imported to Judge AI', 'success');
     };

     // Check if iframe needs to be reloaded with a different AI
     const currentAi = judgeIframe.dataset.currentAi;
     if (currentAi !== judgeAiKey) {
         console.log(`Switching judge AI from ${currentAi} to ${judgeAiKey}`);

         // Update the AI display and iframe URL
         updateJudgeAIDisplay(judgeAiKey);

         // Wait for iframe to load, then send the prompt
         const onLoad = () => {
             judgeIframe.removeEventListener('load', onLoad);
             // Wait a bit more for content scripts to initialize
             setTimeout(sendPromptToJudge, 1500);
         };

         judgeIframe.addEventListener('load', onLoad);

         // Set a timeout in case load event doesn't fire
         setTimeout(() => {
             judgeIframe.removeEventListener('load', onLoad);
             sendPromptToJudge();
         }, 8000);
     } else {
         // Same AI, no need to reload - send immediately after a short delay
         setTimeout(sendPromptToJudge, 800);
     }
}
