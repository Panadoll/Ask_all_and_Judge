import { AI_CATALOG, UI_STRINGS, DEFAULT_SETTINGS, MODEL_NAME_TRANSLATIONS } from './constants.js';
import { state } from './state.js';
import { DOM } from './dom.js';

export function getUIText(key, ...args) {
  const lang = state.settings.uiLanguage || DEFAULT_SETTINGS.uiLanguage;
  const strings = UI_STRINGS[lang] || UI_STRINGS['en'];
  const value = strings[key];

  if (typeof value === 'function') {
    return value(...args);
  }
  return value || key;
}

export function getModelLabel(key) {
  const lang = state.settings.uiLanguage || 'en';
  if (lang === 'zh' && MODEL_NAME_TRANSLATIONS[key]?.zh) {
    return MODEL_NAME_TRANSLATIONS[key].zh;
  }
  return AI_CATALOG[key]?.label || key;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function showStatus(message, type = 'info') {
  const statusText = document.getElementById('status-text');
  if (!statusText) return;

  statusText.textContent = message;
  statusText.className = 'status-text';

  if (type === 'error') {
    statusText.classList.add('status-error');
  } else if (type === 'success') {
    statusText.classList.add('status-success');
  }

  // Clear after 5 seconds if it's a success or info message
  // Errors might need to stay longer or until next action
  if (type !== 'error') {
    if (window._statusTimer) clearTimeout(window._statusTimer);
    window._statusTimer = setTimeout(() => {
      statusText.textContent = '';
      statusText.className = 'status-text';
    }, 5000);
  }
}

// Show a toast notification
export function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Add to container
  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      toast.remove();
      // Remove container if empty
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300); // Wait for fade out animation
  }, 5000);
}

export function createEventBus() {
    const events = {};
    return {
      on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
        return () => this.off(event, callback);
      },
      off(event, callback) {
        if (!events[event]) return;
        const index = events[event].indexOf(callback);
        if (index > -1) events[event].splice(index, 1);
      },
      emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(cb => cb(data));
      }
    };
  }

export function handleTextareaResize() {
    if (!DOM.queryInput) return;
    if (DOM.composer && DOM.composer.dataset.resized === 'true') {
      DOM.queryInput.style.height = '100%';
      return;
    }
    DOM.queryInput.style.height = 'auto';
    DOM.queryInput.style.height = Math.min(DOM.queryInput.scrollHeight, 120) + 'px';
}