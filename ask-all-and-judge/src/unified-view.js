import { DOM } from './dom.js';
import { state } from './state.js';
import { getModelLabel, showStatus, showToast } from './utils.js';
import { handlePanelExport } from './export.js';
import { getActivePanels } from './panels.js';

// ===== Panel Toggle =====

export function toggleUnifiedView() {
  if (DOM.unifiedViewPanel && !DOM.unifiedViewPanel.hidden) {
    closeUnifiedView();
  } else {
    openUnifiedView();
  }
}

export function closeUnifiedView() {
  if (!DOM.unifiedViewPanel) return;
  DOM.unifiedViewPanel.classList.remove('is-open');
  setTimeout(() => {
    if (!DOM.unifiedViewPanel.classList.contains('is-open')) {
      DOM.unifiedViewPanel.hidden = true;
    }
  }, 300);
  const btn = DOM.unifiedViewButton;
  if (btn) btn.classList.remove('is-active');
}

function openUnifiedView() {
  if (!DOM.unifiedViewPanel) return;
  DOM.unifiedViewPanel.hidden = false;
  requestAnimationFrame(() => {
    DOM.unifiedViewPanel.classList.add('is-open');
  });
  const btn = DOM.unifiedViewButton;
  if (btn) btn.classList.add('is-active');
}

// ===== Collect & Render =====

export function collectAndRender() {
  state.collectingForUnifiedView = true;
  state.unifiedViewData = [];

  const activePanels = getActivePanels();

  if (activePanels.length === 0) {
    showToast('No active panels to collect from', 'error');
    state.collectingForUnifiedView = false;
    return;
  }

  showStatus('Collecting responses from AI panels…');

  // Request export from every active panel
  activePanels.forEach(panel => {
    handlePanelExport(panel);
  });

  // Timeout: proceed with whatever we have after 10 s
  setTimeout(() => {
    if (state.collectingForUnifiedView && state.unifiedViewData.length < activePanels.length) {
      if (state.unifiedViewData.length > 0) {
        finalizeUnifiedViewCollection();
      } else {
        showToast('Failed to collect responses from AI panels', 'error');
        state.collectingForUnifiedView = false;
      }
    }
  }, 10000);
}

export function finalizeUnifiedViewCollection() {
  state.collectingForUnifiedView = false;

  // Filter out empty responses
  const emptyAIs = state.unifiedViewData.filter(d => !d.content || d.content.trim() === '');
  if (emptyAIs.length > 0) {
    const names = emptyAIs.map(d => getModelLabel(d.ai)).join(', ');
    showToast(`Warning: No content found from ${names}`, 'error');
    state.unifiedViewData = state.unifiedViewData.filter(d => d.content && d.content.trim() !== '');
  }

  if (state.unifiedViewData.length === 0) {
    showToast('No responses to display. Please chat with the AIs first.', 'error');
    return;
  }

  renderUnifiedContent();
  showStatus('Unified view updated', 'success');
}

// ===== Rendering =====

function renderUnifiedContent() {
  const container = DOM.unifiedViewContent;
  if (!container) return;

  container.innerHTML = '';

  state.unifiedViewData.forEach(({ ai, content }) => {
    const section = document.createElement('div');
    section.className = 'uv-section';

    const header = document.createElement('div');
    header.className = 'uv-section-header';
    header.textContent = getModelLabel(ai);

    const body = document.createElement('div');
    body.className = 'uv-section-body';
    body.textContent = content;

    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  });
}

// ===== Resizer =====

export function setupUnifiedViewResizer() {
  const resizer = DOM.unifiedViewResizer;
  const panel = DOM.unifiedViewPanel;
  if (!resizer || !panel) return;

  let startX = 0;
  let startWidth = 0;
  let isResizing = false;

  const handlePointerMove = (e) => {
    if (!isResizing) return;
    const delta = startX - e.clientX;
    const nextWidth = Math.max(300, Math.min(window.innerWidth * 0.8, startWidth + delta));
    panel.style.width = `${nextWidth}px`;
  };

  const stopResize = (e) => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    resizer.releasePointerCapture(e.pointerId);
  };

  resizer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = panel.getBoundingClientRect().width;
    resizer.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'ew-resize';
  });

  resizer.addEventListener('pointermove', handlePointerMove);
  resizer.addEventListener('pointerup', stopResize);
  resizer.addEventListener('pointercancel', stopResize);
}
