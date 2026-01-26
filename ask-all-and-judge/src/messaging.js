import { DOM } from './dom.js';
import { state } from './state.js';
import { getUIText, showStatus, getModelLabel } from './utils.js';
import { getActivePanels, getSelectedTargets } from './panels.js';
import { downloadMarkdown } from './export.js';
import { finalizeJudgeCollection } from './judge.js';

export function setupMessaging() {
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    state.keepAlivePort = chrome.runtime.connect({ name: 'ui' });

    // Listen for messages from service worker through port
    state.keepAlivePort.onMessage.addListener(handleBackgroundMessage);

    window.addEventListener('message', handleWindowMessage);

    // Periodically check status to handle service worker restarts
    setInterval(() => {
      requestStatus();
    }, 5000); // Check every 5 seconds
}

function handleBackgroundMessage(message) {
  switch (message.type) {
    case 'STATUS_UPDATE':
      updateReadyState(message.status || {});
      break;
    case 'ERROR':
      showStatus(getUIText('statusErrorFrom', getModelLabel(message.aiName), message.error), 'error');
      break;
    default:
      break;
  }
}

function handleWindowMessage(event) {
  if (event.data?.type === 'PARALLEL_QUERY_INJECTOR_READY') {
    const aiKey = event.data.ai;
    if (aiKey) {
      state.injectorReadyState[aiKey] = true;
    }
    return;
  }

  if (event.data?.type === 'PARALLEL_QUERY_EXPORT_RESPONSE') {
    const content = event.data.content;
    const sourceAi = event.data.ai;
    
    if (state.collectingForJudge) {
        // Collect for judge
        if (!state.collectedConversations) state.collectedConversations = [];
        state.collectedConversations.push({ ai: sourceAi, content });
        
        // Check if we have all needed
        const activeCount = getActivePanels().length;
        if (state.collectedConversations.length >= activeCount) {
             finalizeJudgeCollection();
        }
        return;
    }

    if (state.transferState && state.transferState.sourceAi === sourceAi) {
      // Handle Transfer
      const targetAi = state.transferState.targetAi;
      const targetPanel = state.panels.find(p => p.select.value === targetAi && p.index === state.transferState.targetPanelIndex);

      if (targetPanel && targetPanel.iframe && targetPanel.iframe.contentWindow) {
        targetPanel.iframe.contentWindow.postMessage({
          type: 'PARALLEL_QUERY_IMPORT_REQUEST',
          ai: targetAi,
          content: content
        }, '*');

        showStatus(getUIText('statusSent', 1, 1), 'success');
      } else {
         showStatus('Transfer failed: Target panel not found', 'error');
      }

      state.transferState = null; // Reset state
    } else {
      // Handle Normal Export
      downloadMarkdown(content, event.data.filename);
    }
  } else if (event.data?.type === 'PARALLEL_QUERY_EXPORT_ERROR') {
    showStatus('Export failed: ' + event.data.error, 'error');
    state.transferState = null;
  }
}

export function registerExtensionTab() {
  if (!chrome.tabs || !chrome.tabs.getCurrent) return;

  chrome.tabs.getCurrent((tab) => {
    if (tab && tab.id) {
      chrome.runtime.sendMessage({
        type: 'REGISTER_EXTENSION_TAB',
        tabId: tab.id
      });
    }
  });
}

export async function requestStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    if (response && response.status) {
      updateReadyState(response.status);
    }
  } catch (error) {
    console.warn('Status request failed:', error.message);
  }
}

export function updateReadyState(status) {
  state.latestStatus = status || {};
  const activePanels = getActivePanels();

  state.panels.forEach((panelObj) => {
    const aiKey = panelObj.select.value;
    const ready = getAiReady(aiKey);
    if (!panelObj.dot) return;

    if (activePanels.includes(panelObj)) {
      panelObj.dot.classList.toggle('ready', ready);
    } else {
      panelObj.dot.classList.remove('ready');
    }
  });

  const targets = getSelectedTargets();
  const anyReady = targets.some(getAiReady);
  if (DOM.sendButton) DOM.sendButton.disabled = !anyReady;
  if (DOM.queryInput) {
      DOM.queryInput.placeholder = anyReady
        ? getUIText('placeholderReady')
        : getUIText('placeholderLoading');
  }
}

export function getAiReady(aiKey) {
  const entry = state.latestStatus?.[aiKey];
  return typeof entry === 'boolean' ? entry : !!entry?.ready;
}
