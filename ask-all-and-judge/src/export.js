import { DOM } from './dom.js';
import { state } from './state.js';
import { getUIText, showStatus, getModelLabel, showToast } from './utils.js';
import { AI_CATALOG } from './constants.js';
import { getActivePanels } from './panels.js';
import { finalizeJudgeCollection } from './judge.js';

export function handlePanelExport(panelObj) {
  const aiKey = panelObj.select?.value;
  if (!aiKey) {
    showStatus('exportError: No AI selected', 'error');
    return;
  }

  const iframe = panelObj.iframe;

  if (!iframe || !iframe.contentWindow) {
    showStatus('Export failed: Iframe not ready', 'error');
    return;
  }

  if (iframe.getAttribute('src') === 'about:blank') {
    showStatus('Export failed: Iframe not loaded', 'error');
    return;
  }

  if (!state.injectorReadyState[aiKey]) {
    console.log('Injector not ready yet, waiting...');
    showStatus('Waiting for AI page to load...');

    let waitCount = 0;
    const waitInterval = setInterval(() => {
      waitCount++;
      if (state.injectorReadyState[aiKey]) {
        clearInterval(waitInterval);
        sendExportRequest(panelObj, aiKey);
      } else if (waitCount >= 50) {
        clearInterval(waitInterval);
        showStatus('Export failed: AI page did not load properly', 'error');
      }
    }, 100);
    return;
  }

  sendExportRequest(panelObj, aiKey);
}

function sendExportRequest(panelObj, aiKey) {
  const iframe = panelObj.iframe;
  try {
    iframe.contentWindow.postMessage(
      { type: 'PARALLEL_QUERY_EXPORT_REQUEST', ai: aiKey },
      '*'
    );
    if (!state.collectingForJudge) {
        showStatus('Exporting conversation...');
    }
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Export failed: ' + error.message, 'error');
  }
}

export function initiateTransfer(sourcePanel, targetPanel) {
  const sourceAi = sourcePanel.select.value;
  const targetAi = targetPanel.select.value;
  
  state.transferState = {
    sourceAi,
    targetAi,
    targetPanelIndex: targetPanel.index
  };
  
  handlePanelExport(sourcePanel);
}

export function downloadMarkdown(content, filename) {
  if (!content) {
    showStatus('Export failed: No conversation content found', 'error');
    return;
  }

  try {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'conversation.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Export downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
    showStatus('Export download failed: ' + error.message, 'error');
  }
}

export function toggleExportDropdown(panelObj) {
  if (!panelObj.exportDropdown) return;
  const isOpen = panelObj.exportDropdown.classList.contains('is-open');
  
  // Close all other dropdowns
  state.panels.forEach(p => {
    // We need to import closeDropdown from panels.js, but circular dependency.
    // DOM-based closing is safer here or duplicating logic.
    if (p.selectDropdown) p.selectDropdown.classList.remove('is-open');
    if (p !== panelObj && p.exportDropdown) p.exportDropdown.classList.remove('is-open');
  });

  if (!isOpen) {
    updateExportDropdownOptions(panelObj);
    panelObj.exportDropdown.classList.add('is-open');
  } else {
    panelObj.exportDropdown.classList.remove('is-open');
  }
}

export function closeExportDropdown(panelObj) {
  if (panelObj.exportDropdown) {
    panelObj.exportDropdown.classList.remove('is-open');
  }
}

function updateExportDropdownOptions(panelObj) {
  const dropdown = panelObj.exportDropdown;
  if (!dropdown) return;

  dropdown.innerHTML = '';

  // Option 1: Export as Markdown
  const exportOption = document.createElement('button');
  exportOption.className = 'export-option';
  exportOption.type = 'button';
  exportOption.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <span>${getUIText('exportToMarkdown')}</span>
  `;
  exportOption.addEventListener('click', (e) => {
    e.stopPropagation();
    closeExportDropdown(panelObj);
    handlePanelExport(panelObj);
  });
  dropdown.appendChild(exportOption);

  // Separator
  const activePanels = getActivePanels();
  const otherPanels = activePanels.filter(p => p !== panelObj);

  if (otherPanels.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'export-separator';
    dropdown.appendChild(separator);

    // Export to other AI options
    otherPanels.forEach(otherPanel => {
      const aiKey = otherPanel.select.value;
      const config = AI_CATALOG[aiKey];

      const exportOption = document.createElement('button');
      exportOption.className = 'export-option';
      exportOption.type = 'button';
      exportOption.innerHTML = `
        <img src="${config.icon}" alt="${getModelLabel(aiKey)}" class="export-ai-icon">
        <span>${getUIText('exportTo', getModelLabel(aiKey))}</span>
      `;

      exportOption.addEventListener('click', (e) => {
        e.stopPropagation();
        closeExportDropdown(panelObj);
        initiateTransfer(panelObj, otherPanel);
      });

      dropdown.appendChild(exportOption);
    });
  }

  // Option 3: Export to Judge
  const separator = document.createElement('div');
  separator.className = 'export-separator';
  dropdown.appendChild(separator);

  const exportToJudgeOption = document.createElement('button');
  exportToJudgeOption.className = 'export-option';
  exportToJudgeOption.type = 'button';
  
  // Only check state.selectedJudgeAI (user's explicit selection)
  // Don't fallback to DOM.judgeAiSelect?.value as it may have default value
  const judgeAiKey = state.selectedJudgeAI;
  const hasJudge = !!judgeAiKey;

  exportToJudgeOption.innerHTML = `
    <svg viewBox="0 0 407.467 407.467" width="16" height="16" fill="currentColor">
      <path d="M403.359,320.228L250.938,164.807l41.063-41.063l14.142,14.142l31.82-31.82L231.897,0l-31.819,31.819l14.142,14.142 L97.547,162.634l-14.142-14.142l-31.819,31.82l106.065,106.066l31.82-31.82l-14.142-14.142l40.254-40.254l152.421,155.422 L403.359,320.228z M221.29,31.819l10.606-10.606l84.854,84.853l-10.607,10.607l-3.535-3.535l0,0l-77.781-77.782l0,0L221.29,31.819z M168.258,254.558l-10.607,10.607l-84.853-84.853l10.606-10.607l3.536,3.536l77.782,77.782L168.258,254.558z M108.153,173.241 L224.826,56.568l56.568,56.569l-40.96,40.96l0,0l-17.677,17.678l-58.035,58.035L108.153,173.241z M240.33,175.414l141.919,144.711 l-14.143,14.142L226.189,189.556L240.33,175.414z"/>
      <path d="M180.109,332.467h-156v30h-20v45h200v-45h-24V332.467z M39.109,347.467h126v15h-126V347.467z M189.109,377.467v15h-170v-15 h5h156H189.109z"/>
    </svg>
    <span>${getUIText('exportToJudge')}</span>
  `;

  exportToJudgeOption.addEventListener('click', (e) => {
    e.stopPropagation();
    // 重新检查 judge 状态（闭包中的值可能已过时）
    const currentJudgeAiKey = state.selectedJudgeAI;
    if (!currentJudgeAiKey) {
      showToast(getUIText('statusErrorNoJudgeSelected'), 'error');
      return;
    }
    closeExportDropdown(panelObj);

    if (panelObj.iframe && panelObj.iframe.contentWindow) {
      panelObj.iframe.contentWindow.postMessage(
        { type: 'PARALLEL_QUERY_IMPORT_REQUEST', ai: currentJudgeAiKey, singlePanel: true },
        '*'
      );
      showToast('Exporting conversation to Judge...', 'info');
    } else {
      handlePanelExport(panelObj);
      showToast('Exporting conversation to Judge...', 'info');
    }
  });
  dropdown.appendChild(exportToJudgeOption);
}
