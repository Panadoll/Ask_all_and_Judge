import { DEFAULT_SETTINGS } from './constants.js';
import { createEventBus } from './utils.js';

/**
 * StateManager - Structured state management with validation and events
 * Provides a reactive state system with type checking and change notifications
 */
class StateManager {
  constructor() {
    this._state = {
      // Application state
      app: {
        initializationComplete: false,
        hasUserSentMessage: false,
        hasUserSelectedAI: false
      },

      // UI state
      ui: {
        shouldProtectFocus: true,
        focusProtectionInterval: null
      },

      // Settings (with validation)
      settings: { ...DEFAULT_SETTINGS },

      // Panels state
      panels: [],

      // Prompt library state
      prompts: {
        library: [],
        editingId: null,
        suggestions: {
          entries: [],
          selectedIndex: -1
        }
      },

      // Judge feature state
      judge: {
        selectedAI: null,
        isCollecting: false,
        conversations: []
      },

      // Status tracking
      status: {
        latest: {},
        injectorReady: {}
      },

      // Transfer state
      transfer: {
        state: null
      }
    };

    this.eventBus = createEventBus();
    this._listeners = new Map();
  }

  // ===== App State Getters/Setters =====
  get initializationComplete() {
    return this._state.app.initializationComplete;
  }

  set initializationComplete(value) {
    this._validateBoolean('initializationComplete', value);
    this._state.app.initializationComplete = value;
    this._notify('app:initializationComplete', value);
  }

  get hasUserSentMessage() {
    return this._state.app.hasUserSentMessage;
  }

  set hasUserSentMessage(value) {
    this._validateBoolean('hasUserSentMessage', value);
    this._state.app.hasUserSentMessage = value;
    this._notify('app:hasUserSentMessage', value);
  }

  get hasUserSelectedAI() {
    return this._state.app.hasUserSelectedAI;
  }

  set hasUserSelectedAI(value) {
    this._validateBoolean('hasUserSelectedAI', value);
    this._state.app.hasUserSelectedAI = value;
    this._notify('app:hasUserSelectedAI', value);
  }

  // ===== UI State Getters/Setters =====
  get shouldProtectFocus() {
    return this._state.ui.shouldProtectFocus;
  }

  set shouldProtectFocus(value) {
    this._validateBoolean('shouldProtectFocus', value);
    this._state.ui.shouldProtectFocus = value;
    this._notify('ui:shouldProtectFocus', value);
  }

  get focusProtectionInterval() {
    return this._state.ui.focusProtectionInterval;
  }

  set focusProtectionInterval(value) {
    this._state.ui.focusProtectionInterval = value;
  }

  // ===== Settings Getters/Setters =====
  get settings() {
    return { ...this._state.settings };
  }

  set settings(value) {
    this._validateSettings(value);
    this._state.settings = { ...value };
    this._notify('settings:changed', this._state.settings);
  }

  updateSetting(key, value) {
    if (!(key in this._state.settings)) {
      console.warn(`Unknown setting key: ${key}`);
    }
    this._state.settings[key] = value;
    this._notify(`settings:${key}`, value);
    this._notify('settings:changed', this._state.settings);
  }

  // ===== Panels Getters/Setters =====
  get panels() {
    return this._state.panels;
  }

  set panels(value) {
    if (!Array.isArray(value)) {
      throw new Error('Panels must be an array');
    }
    this._state.panels = value;
    this._notify('panels:changed', this._state.panels);
  }

  // ===== Prompt Library Getters/Setters =====
  get promptLibrary() {
    return this._state.prompts.library;
  }

  set promptLibrary(value) {
    if (!Array.isArray(value)) {
      throw new Error('Prompt library must be an array');
    }
    this._state.prompts.library = value;
    this._notify('prompts:library:changed', this._state.prompts.library);
  }

  get promptLibraryEditingId() {
    return this._state.prompts.editingId;
  }

  set promptLibraryEditingId(value) {
    this._state.prompts.editingId = value;
    this._notify('prompts:editing', value);
  }

  get promptSuggestionEntries() {
    return this._state.prompts.suggestions.entries;
  }

  set promptSuggestionEntries(value) {
    if (!Array.isArray(value)) {
      throw new Error('Prompt suggestion entries must be an array');
    }
    this._state.prompts.suggestions.entries = value;
  }

  get promptSuggestionIndex() {
    return this._state.prompts.suggestions.selectedIndex;
  }

  set promptSuggestionIndex(value) {
    this._state.prompts.suggestions.selectedIndex = value;
  }

  // ===== Judge State Getters/Setters =====
  get selectedJudgeAI() {
    return this._state.judge.selectedAI;
  }

  set selectedJudgeAI(value) {
    this._state.judge.selectedAI = value;
    this._notify('judge:selectedAI', value);
  }

  get collectingForJudge() {
    return this._state.judge.isCollecting;
  }

  set collectingForJudge(value) {
    this._validateBoolean('collectingForJudge', value);
    this._state.judge.isCollecting = value;
    this._notify('judge:collecting', value);
  }

  get collectedConversations() {
    return this._state.judge.conversations;
  }

  set collectedConversations(value) {
    if (!Array.isArray(value)) {
      throw new Error('Collected conversations must be an array');
    }
    this._state.judge.conversations = value;
    this._notify('judge:conversations', this._state.judge.conversations);
  }

  // ===== Status Getters/Setters =====
  get latestStatus() {
    return this._state.status.latest;
  }

  set latestStatus(value) {
    this._state.status.latest = value;
  }

  get injectorReadyState() {
    return this._state.status.injectorReady;
  }

  set injectorReadyState(value) {
    this._state.status.injectorReady = value;
  }

  // ===== Transfer State =====
  get transferState() {
    return this._state.transfer.state;
  }

  set transferState(value) {
    this._state.transfer.state = value;
  }

  // ===== Event System =====
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this._listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // ===== Private Methods =====
  _notify(event, data) {
    const callbacks = this._listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in state listener for event "${event}":`, error);
      }
    });

    // Also trigger eventBus (for backward compatibility)
    this.eventBus.emit(event, data);
  }

  _validateBoolean(name, value) {
    if (typeof value !== 'boolean') {
      throw new Error(`${name} must be a boolean, got ${typeof value}`);
    }
  }

  _validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings must be an object');
    }

    // Validate required setting keys
    const requiredKeys = Object.keys(DEFAULT_SETTINGS);
    for (const key of requiredKeys) {
      if (!(key in settings)) {
        throw new Error(`Missing required setting: ${key}`);
      }
    }
  }

  // ===== Debug =====
  _dumpState() {
    return JSON.parse(JSON.stringify(this._state));
  }
}

// Create and export singleton instance
export const state = new StateManager();

// Development mode: expose to global for debugging
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.protocol === 'chrome-extension:')) {
  window.__state = state;
  window.__dumpState = () => state._dumpState();
}
