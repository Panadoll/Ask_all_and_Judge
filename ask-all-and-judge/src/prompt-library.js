import { DOM } from './dom.js';
import { state } from './state.js';
import { PROMPT_LIBRARY_KEY } from './constants.js';
import { generateId, getUIText, showStatus, handleTextareaResize } from './utils.js';
import { closeSettings } from './settings.js';
import { closeDropdown } from './panels.js';
import { closePromptSuggestions } from './prompt-suggestions.js';

export function setupPromptLibrary() {
  if (!DOM.promptLibraryToggle || !DOM.promptLibraryPanel) return;

  loadPromptLibrary();
  applyPromptLibraryLanguage();
  renderPromptLibrary();

  DOM.promptLibraryToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePromptLibrary();
  });

  DOM.promptLibraryPanel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  DOM.promptLibrarySearch?.addEventListener('input', renderPromptLibrary);
  DOM.promptSaveButton?.addEventListener('click', handlePromptSave);
  DOM.promptCancelButton?.addEventListener('click', resetPromptForm);

  const promptLibraryCloseButton = document.getElementById('prompt-library-close');
  if (promptLibraryCloseButton) {
    promptLibraryCloseButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closePromptLibrary();
    });
  }

  document.addEventListener('click', (event) => {
    if (!DOM.promptLibraryPanel.classList.contains('is-open')) return;
    if (DOM.promptLibraryPanel.contains(event.target) || DOM.promptLibraryToggle.contains(event.target)) {
      return;
    }
    closePromptLibrary();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePromptLibrary();
    }
  });
}

export function togglePromptLibrary() {
  if (DOM.promptLibraryPanel.classList.contains('is-open')) {
    closePromptLibrary();
  } else {
    openPromptLibrary();
  }
}

export function openPromptLibrary() {
  closeSettings();
  state.panels.forEach((panelObj) => closeDropdown(panelObj));
  
  // Instead of calling closePromptSuggestions directly (which is imported from prompt-suggestions.js),
  // we can emit an event or rely on one-way dependency.
  // Actually prompt-library.js depends on prompt-suggestions.js for closing suggestions?
  // prompt-suggestions.js depends on prompt-library.js for editing prompts.
  // We can let openPromptLibrary emit an event.
  
  state.eventBus.emit('prompt-library-opened');
  
  DOM.promptLibraryPanel.classList.add('is-open');
  DOM.promptLibraryPanel.setAttribute('aria-hidden', 'false');
  DOM.promptLibraryToggle.classList.add('is-open');
  DOM.promptLibraryToggle.setAttribute('aria-expanded', 'true');

  // Focus the close button for accessibility
  document.getElementById('prompt-library-close')?.focus();
}

export function closePromptLibrary() {
  if (!DOM.promptLibraryPanel) return;

  // Move focus back to the toggle button before hiding the panel
  DOM.promptLibraryToggle?.focus();

  DOM.promptLibraryPanel.classList.remove('is-open');
  DOM.promptLibraryPanel.setAttribute('aria-hidden', 'true');
  DOM.promptLibraryToggle?.classList.remove('is-open');
  DOM.promptLibraryToggle?.setAttribute('aria-expanded', 'false');
}

export function loadPromptLibrary() {
  state.promptLibrary = [];
  try {
    const raw = localStorage.getItem(PROMPT_LIBRARY_KEY);
    if (raw === null) {
      const isZh = state.settings.uiLanguage === 'zh';
      state.promptLibrary = [{
        id: generateId(),
        title: isZh ? '总结' : 'Summarize',
        shortcut: '$sum',
        text: isZh 
          ? '请对以下内容进行深度总结。要求：\n1. 提炼核心观点和关键信息；\n2. 梳理逻辑脉络，保留重要细节；\n3. 语言简练，条理清晰，分点表述。\n\n内容如下：\n' 
          : 'Please provide a comprehensive summary of the following content. Requirements:\n1. Extract key points and core arguments.\n2. Clarify the logical flow while retaining important details.\n3. Be concise, organized, and use bullet points.\n\nContent:\n',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }];
      savePromptLibrary();
      return;
    }

    const stored = JSON.parse(raw || '[]');
    if (Array.isArray(stored)) {
      state.promptLibrary = stored.map(normalizePromptEntry).filter(Boolean);
      
      // Migration: Update old default 'sum' to '$sum' if found
      let migrated = false;
      state.promptLibrary.forEach(item => {
        if (item.shortcut === 'sum') {
          item.shortcut = '$sum';
          migrated = true;
        }
      });
      if (migrated) {
        savePromptLibrary();
      }
    }
  } catch (error) {
    state.promptLibrary = [];
  }
}

export function savePromptLibrary() {
  try {
    localStorage.setItem(PROMPT_LIBRARY_KEY, JSON.stringify(state.promptLibrary));
  } catch (error) {
    // Ignore persistence errors.
  }
}

function normalizePromptEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const id = String(entry.id || '').trim();
  const shortcut = String(entry.shortcut || '').trim();
  const text = String(entry.text || '').trim();
  const title = String(entry.title || '').trim();
  if (!id || !text) return null;
  return {
    id,
    title,
    shortcut,
    text,
    createdAt: Number(entry.createdAt) || Date.now(),
    updatedAt: Number(entry.updatedAt) || Number(entry.createdAt) || Date.now()
  };
}

function handlePromptSave() {
  if (!DOM.promptShortcutInput || !DOM.promptTextInput) return;
  const title = DOM.promptTitleInput?.value.trim() || '';
  const shortcut = DOM.promptShortcutInput.value.trim();
  const text = DOM.promptTextInput.value.trim();

  if (!text) {
    showStatus(getUIText('promptLibraryMissing'), 'error');
    return;
  }

  if (shortcut && /\s/.test(shortcut)) {
    showStatus(getUIText('promptLibraryShortcutInvalid'), 'error');
    return;
  }

  const duplicate = shortcut
    ? state.promptLibrary.find(
        (item) => item.shortcut === shortcut && item.id !== state.promptLibraryEditingId
      )
    : null;

  if (duplicate) {
    showStatus(getUIText('promptLibraryDuplicate'), 'error');
    return;
  }

  if (state.promptLibraryEditingId) {
    const target = state.promptLibrary.find((item) => item.id === state.promptLibraryEditingId);
    if (target) {
      target.title = title;
      target.shortcut = shortcut;
      target.text = text;
      target.updatedAt = Date.now();
    }
  } else {
    state.promptLibrary.push({
      id: generateId(),
      title,
      shortcut,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  savePromptLibrary();
  renderPromptLibrary();
  state.eventBus.emit('prompt-library-changed'); // Emit event instead of calling updatePromptSuggestions directly
  resetPromptForm();
}

function resetPromptForm() {
  state.promptLibraryEditingId = null;
  if (DOM.promptTitleInput) DOM.promptTitleInput.value = '';
  if (DOM.promptShortcutInput) DOM.promptShortcutInput.value = '';
  if (DOM.promptTextInput) DOM.promptTextInput.value = '';
  updatePromptFormState();
}

function updatePromptFormState() {
  if (DOM.promptSaveButton) {
    DOM.promptSaveButton.textContent = state.promptLibraryEditingId
      ? getUIText('promptLibraryUpdate')
      : getUIText('promptLibrarySave');
  }
  if (DOM.promptCancelButton) {
    DOM.promptCancelButton.textContent = getUIText('promptLibraryCancel');
    DOM.promptCancelButton.hidden = !state.promptLibraryEditingId;
  }
}

function renderPromptLibrary() {
  if (!DOM.promptLibraryList || !DOM.promptLibraryEmpty) return;
  const query = (DOM.promptLibrarySearch?.value || '').trim().toLowerCase();
  const visible = state.promptLibrary.filter((item) => matchesPromptSearch(item, query));
  DOM.promptLibraryList.innerHTML = '';

  if (visible.length === 0) {
    DOM.promptLibraryEmpty.hidden = false;
    return;
  }

  DOM.promptLibraryEmpty.hidden = true;
  visible.forEach((item) => {
    DOM.promptLibraryList.appendChild(createPromptListItem(item));
  });
}

function matchesPromptSearch(item, query) {
  if (!query) return true;
  const haystack = `${item.title} ${item.shortcut} ${item.text}`.toLowerCase();
  return haystack.includes(query);
}

function createPromptListItem(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'prompt-library-item';

  const head = document.createElement('div');
  head.className = 'prompt-library-item-head';

  const title = document.createElement('div');
  title.className = 'prompt-library-item-title';
  title.textContent = item.title || item.shortcut || 'Untitled Prompt';

  head.appendChild(title);

  if (item.shortcut) {
    const shortcut = document.createElement('span');
    shortcut.className = 'prompt-library-shortcut';
    shortcut.textContent = item.shortcut;
    head.appendChild(shortcut);
  }

  const text = document.createElement('div');
  text.className = 'prompt-library-item-text';
  text.textContent = item.text;

  const actions = document.createElement('div');
  actions.className = 'prompt-library-item-actions';

  const insertButton = document.createElement('button');
  insertButton.type = 'button';
  insertButton.className = 'prompt-library-action prompt-library-action-primary';
  insertButton.textContent = getUIText('promptLibraryInsert');
  insertButton.addEventListener('click', () => {
    insertPromptAtCursor(item.text);
  });

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'prompt-library-action';
  editButton.textContent = getUIText('promptLibraryEdit');
  editButton.addEventListener('click', () => {
    startPromptEdit(item);
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'prompt-library-action prompt-library-action-danger';
  deleteButton.textContent = getUIText('promptLibraryDelete');
  deleteButton.addEventListener('click', () => {
    deletePrompt(item.id);
  });

  actions.append(insertButton, editButton, deleteButton);
  wrapper.append(head, text, actions);
  return wrapper;
}

export function startPromptEdit(item) {
  state.promptLibraryEditingId = item.id;
  if (DOM.promptTitleInput) DOM.promptTitleInput.value = item.title || '';
  if (DOM.promptShortcutInput) DOM.promptShortcutInput.value = item.shortcut;
  if (DOM.promptTextInput) DOM.promptTextInput.value = item.text;
  updatePromptFormState();
  DOM.promptTitleInput?.focus();
}

export function deletePrompt(id) {
  const message = getUIText('promptLibraryDeleteConfirm');
  if (!window.confirm(message)) return;
  state.promptLibrary = state.promptLibrary.filter((item) => item.id !== id);
  savePromptLibrary();
  renderPromptLibrary();
  state.eventBus.emit('prompt-library-changed'); // Emit event
  if (state.promptLibraryEditingId === id) {
    resetPromptForm();
  }
}

export function insertPromptAtCursor(text) {
  if (!DOM.queryInput) return;
  const start = DOM.queryInput.selectionStart ?? DOM.queryInput.value.length;
  const end = DOM.queryInput.selectionEnd ?? DOM.queryInput.value.length;
  DOM.queryInput.setRangeText(text, start, end, 'end');
  DOM.queryInput.focus();
  handleTextareaResize();
}

export function movePromptToFront(id) {
  const index = state.promptLibrary.findIndex((item) => item.id === id);
  if (index <= 0) return;
  const [entry] = state.promptLibrary.splice(index, 1);
  entry.updatedAt = Date.now();
  state.promptLibrary.unshift(entry);
  savePromptLibrary();
  renderPromptLibrary();
  // We should also emit change here just in case suggestions order needs update (though sorting logic in suggestions might handle it)
  state.eventBus.emit('prompt-library-changed');
}

export function applyPromptLibraryLanguage() {
  if (DOM.promptLibraryTitle) DOM.promptLibraryTitle.textContent = getUIText('promptLibraryTitle');
  if (DOM.promptTitleLabel) DOM.promptTitleLabel.textContent = getUIText('promptLibraryTitleLabel');
  if (DOM.promptShortcutLabel) DOM.promptShortcutLabel.textContent = getUIText('promptLibraryShortcutLabel');
  if (DOM.promptTextLabel) DOM.promptTextLabel.textContent = getUIText('promptLibraryTextLabel');
  if (DOM.promptTitleInput) DOM.promptTitleInput.placeholder = getUIText('promptLibraryTitlePlaceholder');
  if (DOM.promptShortcutInput) DOM.promptShortcutInput.placeholder = getUIText('promptLibraryShortcutPlaceholder');
  if (DOM.promptTextInput) DOM.promptTextInput.placeholder = getUIText('promptLibraryTextPlaceholder');
  if (DOM.promptLibrarySearch) DOM.promptLibrarySearch.placeholder = getUIText('promptLibrarySearchPlaceholder');
  if (DOM.promptLibraryEmpty) DOM.promptLibraryEmpty.textContent = getUIText('promptLibraryEmpty');
  if (DOM.promptLibraryHelp) DOM.promptLibraryHelp.textContent = getUIText('promptLibraryHelp');
  if (DOM.promptTextExample) DOM.promptTextExample.textContent = getUIText('promptLibraryTextExample');
  updatePromptFormState();
}

export function expandPromptShortcuts(text) {
  if (!text || state.promptLibrary.length === 0) return text;
  const entries = [...state.promptLibrary]
    .filter((item) => item.shortcut)
    .sort((a, b) => b.shortcut.length - a.shortcut.length);
  if (entries.length === 0) return text;

  let result = text;
  // Use simple replacement for manual expand on send
  for (const entry of entries) {
    if (!entry.shortcut) continue;
    // Escape shortcut for regex
    const escaped = entry.shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, entry.text);
  }
  return result;
}

export function maybeReplacePromptShortcut(event) {
  if (!DOM.queryInput || state.promptLibrary.length === 0) return;
  if (event?.isComposing) return;
  const selectionStart = DOM.queryInput.selectionStart;
  const selectionEnd = DOM.queryInput.selectionEnd;
  if (selectionStart === null || selectionEnd === null) return;
  if (selectionStart !== selectionEnd) return;
  const value = DOM.queryInput.value;
  const caret = selectionStart;
  const before = value.slice(0, caret);
  if (!before) return;

  const entries = [...state.promptLibrary]
    .filter((item) => item.shortcut)
    .sort((a, b) => b.shortcut.length - a.shortcut.length);
  for (const entry of entries) {
    if (before.endsWith(entry.shortcut)) {
      const start = caret - entry.shortcut.length;
      DOM.queryInput.setRangeText(entry.text, start, caret, 'end');
      handleTextareaResize();
      return;
    }
  }
}