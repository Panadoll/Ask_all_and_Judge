/**
 * FocusManager - Manages input focus protection
 * Ensures the query input field receives focus when appropriate
 */
export class FocusManager {
  constructor(inputElement, state, DOM) {
    this.input = inputElement;
    this.state = state;
    this.DOM = DOM;
    this.intervalId = null;
  }

  /**
   * Focus the input element
   */
  focusInput() {
    if (this.input) {
      this.input.focus();
    }
  }

  /**
   * Start focus protection with periodic checks
   */
  startProtection() {
    // Initial focus attempts with increasing delays
    this.focusInput();
    requestAnimationFrame(() => this.focusInput());
    setTimeout(() => this.focusInput(), 50);
    setTimeout(() => this.focusInput(), 200);
    setTimeout(() => this.focusInput(), 500);

    // Start periodic checking
    this.intervalId = setInterval(() => {
      this.checkAndProtect();
    }, 1000);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Stop focus protection
   */
  stopProtection() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check if focus protection should be applied and apply if needed
   */
  checkAndProtect() {
    if (!this.state.initializationComplete) return;
    if (!this.state.shouldProtectFocus) return;

    // Check for open panels/overlays that should prevent focus stealing
    if (this.DOM.settingsPanel && this.DOM.settingsPanel.classList.contains('is-open')) return;
    if (this.DOM.promptLibraryPanel && this.DOM.promptLibraryPanel.classList.contains('is-open')) return;
    if (this.DOM.addPanelPopup && this.DOM.addPanelPopup.classList.contains('is-open')) return;
    if (this.DOM.promptSuggestions && this.DOM.promptSuggestions.classList.contains('is-open')) return;

    // Don't steal focus if user is interacting with an iframe (AI Panel)
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;

    // Check if input is visible and not focused
    const isVisible = this.input.offsetWidth > 0 && this.input.offsetHeight > 0;
    const hasFocus = document.activeElement === this.input;

    if (isVisible && !hasFocus) {
      this.focusInput();
    }
  }

  /**
   * Setup visibility and focus event listeners
   */
  setupEventListeners() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.state.shouldProtectFocus) {
        setTimeout(() => {
          if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;
          this.focusInput();
        }, 100);
      }
    });

    window.addEventListener('focus', () => {
      if (this.state.shouldProtectFocus) {
        setTimeout(() => {
          if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;
          this.focusInput();
        }, 100);
      }
    });
  }
}
