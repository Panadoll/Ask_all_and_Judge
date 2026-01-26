import { DOM } from './dom.js';
import { state } from './state.js';
import { getUIText, handleTextareaResize } from './utils.js';
import { openPromptLibrary, startPromptEdit, movePromptToFront, deletePrompt } from './prompt-library.js';

// No need to export handleTextareaResize here anymore as it is in utils.js
// But main.js and others might import it from here. We should update them.
// For now, we subscribe to events.

state.eventBus.on('prompt-library-changed', updatePromptSuggestions);
state.eventBus.on('prompt-library-opened', closePromptSuggestions);

function matchesPromptSearch(item, query) {
  if (!query) return true;
  const haystack = `${item.title} ${item.shortcut} ${item.text}`.toLowerCase();
  return haystack.includes(query);
}

function getSlashTriggerInfo() {
  if (!DOM.queryInput) return null;
  const selectionStart = DOM.queryInput.selectionStart;
  const selectionEnd = DOM.queryInput.selectionEnd;
  if (selectionStart === null || selectionEnd === null) return null;
  if (selectionStart !== selectionEnd) return null;
  const before = DOM.queryInput.value.slice(0, selectionStart);
  const lastWhitespace = Math.max(
    before.lastIndexOf(' '),
    before.lastIndexOf('\n'),
    before.lastIndexOf('\t')
  );
  const token = before.slice(lastWhitespace + 1);
  if (!token.startsWith('/')) return null;
  return {
    start: lastWhitespace + 1,
    end: selectionStart,
    query: token.slice(1)
  };
}

function getPromptSuggestionEntries(query) {
  const normalized = query.trim().toLowerCase();
  const entries = normalized
    ? state.promptLibrary.filter((item) => matchesPromptSearch(item, normalized))
    : state.promptLibrary;
  return entries.slice(0, 5);
}

export function updatePromptSuggestions(event) {
  if (!DOM.promptSuggestions || !DOM.promptSuggestionsList) return;
  if (event && event.isComposing) return; // Handle input event object
  
  if (state.promptLibrary.length === 0) {
    closePromptSuggestions();
    return;
  }
  const trigger = getSlashTriggerInfo();
  if (!trigger) {
    closePromptSuggestions();
    return;
  }
  const entries = getPromptSuggestionEntries(trigger.query);
  if (entries.length === 0) {
    closePromptSuggestions();
    return;
  }
  const activeId = state.promptSuggestionEntries[state.promptSuggestionIndex]?.id;
  state.promptSuggestionEntries = entries;
  const nextIndex = activeId
    ? entries.findIndex((entry) => entry.id === activeId)
    : 0;
  state.promptSuggestionIndex = nextIndex >= 0 ? nextIndex : 0;
  renderPromptSuggestions();
  openPromptSuggestions();
}

export function isPromptSuggestionsOpen() {
  return !!DOM.promptSuggestions?.classList.contains('is-open');
}

export function openPromptSuggestions() {
  if (!DOM.promptSuggestions) return;
  DOM.promptSuggestions.classList.add('is-open');
  DOM.promptSuggestions.setAttribute('aria-hidden', 'false');
}

export function closePromptSuggestions() {
  if (!DOM.promptSuggestions) return;
  DOM.promptSuggestions.classList.remove('is-open');
  DOM.promptSuggestions.setAttribute('aria-hidden', 'true');
  state.promptSuggestionEntries = [];
  state.promptSuggestionIndex = -1;
  if (DOM.promptSuggestionsList) {
    DOM.promptSuggestionsList.innerHTML = '';
    DOM.promptSuggestionsList.removeAttribute('aria-activedescendant');
  }
}

function renderPromptSuggestions() {
  if (!DOM.promptSuggestionsList) return;
  DOM.promptSuggestionsList.innerHTML = '';

  state.promptSuggestionEntries.forEach((item, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'prompt-suggestion-item';
    wrapper.id = `prompt-suggestion-${item.id}`;
    wrapper.setAttribute('role', 'option');
    wrapper.addEventListener('click', () => {
      applyPromptSuggestion(item);
    });
    wrapper.addEventListener('mouseenter', () => {
      setPromptSuggestionIndex(index);
    });

    const head = document.createElement('div');
    head.className = 'prompt-suggestion-head';

    const meta = document.createElement('div');
    meta.className = 'prompt-suggestion-meta';

    const title = document.createElement('div');
    title.className = 'prompt-suggestion-title';
    title.textContent = item.title || item.shortcut || 'Untitled Prompt';

    meta.append(title);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'prompt-library-shortcut';
      shortcut.textContent = item.shortcut;
      meta.append(shortcut);
    }

    const actions = document.createElement('div');
    actions.className = 'prompt-suggestion-actions prompt-suggestion-actions-inline';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'prompt-library-action prompt-suggestion-action';
    editButton.textContent = getUIText('promptLibraryEdit');
    editButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openPromptLibrary();
      startPromptEdit(item);
    });

    const moveButton = document.createElement('button');
    moveButton.type = 'button';
    moveButton.className = 'prompt-library-action prompt-suggestion-action';
    moveButton.textContent = getUIText('promptLibraryMoveToFront');
    moveButton.addEventListener('click', (event) => {
      event.stopPropagation();
      movePromptToFront(item.id);
      updatePromptSuggestions();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'prompt-library-action prompt-library-action-danger prompt-suggestion-action';
    deleteButton.textContent = getUIText('promptLibraryDelete');
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      deletePrompt(item.id);
      // We don't need to call updatePromptSuggestions here because deletePrompt emits 'prompt-library-changed' which calls it.
    });

    actions.append(editButton, moveButton, deleteButton);

    const text = document.createElement('div');
    text.className = 'prompt-suggestion-text';
    text.textContent = item.text;

    head.append(meta, actions);
    wrapper.append(head, text);
    DOM.promptSuggestionsList.appendChild(wrapper);
  });

  setPromptSuggestionIndex(state.promptSuggestionIndex >= 0 ? state.promptSuggestionIndex : 0);
}

function setPromptSuggestionIndex(index) {
  if (!DOM.promptSuggestionsList) return;
  const items = Array.from(DOM.promptSuggestionsList.children);
  if (items.length === 0) return;
  let nextIndex = index;
  if (nextIndex < 0) {
    nextIndex = items.length - 1;
  } else if (nextIndex >= items.length) {
    nextIndex = 0;
  }
  state.promptSuggestionIndex = nextIndex;
  items.forEach((item, itemIndex) => {
    const isSelected = itemIndex === nextIndex;
    item.classList.toggle('is-selected', isSelected);
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
  const activeItem = items[nextIndex];
  if (activeItem) {
    activeItem.scrollIntoView({ block: 'nearest' });
    DOM.promptSuggestionsList.setAttribute('aria-activedescendant', activeItem.id);
  }
}

function applyPromptSuggestion(item) {
  if (!DOM.queryInput || !item) return;
  const trigger = getSlashTriggerInfo();
  const selectionStart = DOM.queryInput.selectionStart ?? DOM.queryInput.value.length;
  const selectionEnd = DOM.queryInput.selectionEnd ?? DOM.queryInput.value.length;
  const start = trigger ? trigger.start : selectionStart;
  const end = trigger ? trigger.end : selectionEnd;
  DOM.queryInput.setRangeText(item.text, start, end, 'end');
  closePromptSuggestions();
  DOM.queryInput.focus();
  handleTextareaResize();
}

export function handlePromptSuggestionKey(event) {
  if (!isPromptSuggestionsOpen()) return false;
  if (state.promptSuggestionEntries.length === 0) return false;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setPromptSuggestionIndex(state.promptSuggestionIndex + 1);
    return true;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setPromptSuggestionIndex(state.promptSuggestionIndex - 1);
    return true;
  }
  if (
    event.key === 'Enter' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    applyPromptSuggestion(state.promptSuggestionEntries[state.promptSuggestionIndex]);
    return true;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closePromptSuggestions();
    return true;
  }
  return false;
}