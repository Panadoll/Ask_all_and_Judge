import { ONBOARDING_KEY, ONBOARDING_STEPS, UI_STRINGS } from './constants.js';
import { state } from './state.js';
import { DOM } from './dom.js';

class OnboardingManager {
  constructor() {
    this.currentStep = -1; // -1 means welcome screen
    this.steps = [];
    this.overlay = null;
    this.tooltip = null;
    this.spotlight = null;
    this.welcomeModal = null;
    this.judgePanelWasOpen = false;
    this.settingsPanelWasOpen = false;
    this.language = 'en';
    this.isRestart = false;
    this.boundKeyHandler = null;
  }

  /**
   * Detect browser language for onboarding
   * Uses navigator.language, NOT state.settings.uiLanguage
   */
  detectLanguage() {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  /**
   * Initialize onboarding system
   */
  init() {
    this.language = this.detectLanguage();
    this.steps = ONBOARDING_STEPS[this.language] || ONBOARDING_STEPS.en;
  }

  /**
   * Check if user has completed onboarding, if not show it
   */
  checkAndShowOnboarding() {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Delay to ensure DOM is ready
      setTimeout(() => this.startTour(false), 500);
    }
  }

  /**
   * Start the onboarding tour
   * @param {boolean} isRestart - True if restarting from settings, false if first time
   */
  startTour(isRestart = false) {
    this.isRestart = isRestart;
    this.currentStep = -1;
    this.createOverlay();
    this.showWelcomeScreen();
  }

  /**
   * Create the overlay element
   */
  createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', this.getUIText('onboardingWelcomeTitle'));
    document.body.appendChild(this.overlay);

    // Fade in animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
    });
  }

  /**
   * Show welcome screen
   */
  showWelcomeScreen() {
    const modal = document.createElement('div');
    modal.className = 'onboarding-welcome';
    modal.setAttribute('role', 'document');

    const title = document.createElement('h2');
    title.textContent = this.getUIText('onboardingWelcomeTitle');
    title.id = 'onboarding-welcome-title';

    const description = document.createElement('p');
    description.textContent = this.getUIText('onboardingWelcomeDescription');
    description.id = 'onboarding-welcome-description';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'onboarding-welcome-buttons';

    const startButton = document.createElement('button');
    startButton.className = 'onboarding-button onboarding-button-primary';
    startButton.textContent = this.getUIText('onboardingWelcomeStart');
    startButton.addEventListener('click', () => this.startSteps());

    buttonContainer.appendChild(startButton);

    // Only show close button if restarting from settings
    if (this.isRestart) {
      const closeButton = document.createElement('button');
      closeButton.className = 'onboarding-button onboarding-button-secondary';
      closeButton.textContent = this.getUIText('onboardingWelcomeClose');
      closeButton.addEventListener('click', () => this.cleanup());
      buttonContainer.appendChild(closeButton);
    }

    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(buttonContainer);

    this.overlay.appendChild(modal);
    this.welcomeModal = modal;

    // Accessibility: set focus to start button
    startButton.focus();

    // Setup keyboard handler for welcome screen
    this.boundKeyHandler = (e) => this.handleWelcomeKeyDown(e);
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  /**
   * Handle keyboard navigation on welcome screen
   */
  handleWelcomeKeyDown(e) {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      this.startSteps();
    } else if (e.key === 'Escape' && this.isRestart) {
      this.cleanup();
    }
  }

  /**
   * Start showing steps after welcome screen
   */
  startSteps() {
    // Remove welcome screen
    if (this.welcomeModal) {
      this.welcomeModal.remove();
      this.welcomeModal = null;
    }

    // Remove welcome keyboard handler
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    // Change overlay to steps mode (transparent background, spotlight handles the mask)
    if (this.overlay) {
      this.overlay.classList.add('steps-mode');
    }

    this.currentStep = 0;
    this.showStep(0);
  }

  /**
   * Show a specific step
   * @param {number} index - Step index
   */
  showStep(index) {
    if (index < 0 || index >= this.steps.length) return;

    const step = this.steps[index];
    this.currentStep = index;

    // Handle special logic for Judge panel steps
    if (step.id === 'judge-button') {
      this.handleJudgeButtonStep();
    } else if (step.id === 'collect-button') {
      this.handleCollectButtonStep();
    } else if (step.id === 'judge-prompt-template') {
      this.handleJudgePromptTemplateStep();
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      console.warn(`Onboarding target not found: ${step.target}`);
      // Try next step if target not found
      if (index < this.steps.length - 1) {
        this.showStep(index + 1);
      }
      return;
    }

    // Scroll target into view if needed
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Create spotlight
    this.createSpotlight(targetElement, step);

    // Create tooltip
    this.createTooltip(step, targetElement);

    // Setup keyboard handler
    this.boundKeyHandler = (e) => this.handleStepKeyDown(e);
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  /**
   * Handle Judge button step (step 4)
   * Remember if panel was open, close it for this step
   */
  handleJudgeButtonStep() {
    const judgePanel = document.querySelector('.judge-panel');
    this.judgePanelWasOpen = judgePanel?.classList.contains('open') || false;

    // Close judge panel if it was open
    if (this.judgePanelWasOpen && DOM.judgeBackButton) {
      DOM.judgeBackButton.click();
    }
  }

  /**
   * Handle Collect button step (step 5)
   * Open judge panel and highlight collect button
   */
  handleCollectButtonStep() {
    const judgePanel = document.querySelector('.judge-panel');
    const isOpen = judgePanel?.classList.contains('open') || false;

    if (!isOpen) {
      // Auto-select a judge AI if none selected
      if (!state.selectedJudgeAI && DOM.judgeButton) {
        // Set a default judge AI (ChatGPT)
        state.selectedJudgeAI = 'chatgpt';
      }

      // Open judge panel
      if (DOM.judgeButton) {
        DOM.judgeButton.click();
      }

      // Wait for panel animation
      setTimeout(() => {
        this.updateStepUI();
      }, 300);
    }
  }

  /**
   * Handle Judge Prompt Template step (step 6)
   * Open settings panel and highlight the prompt template textarea
   */
  handleJudgePromptTemplateStep() {
    const settingsPanel = DOM.settingsPanel;
    this.settingsPanelWasOpen = settingsPanel?.classList.contains('is-open') || false;

    // Close judge panel if it was opened during tour
    if (!this.judgePanelWasOpen && DOM.judgeBackButton) {
      DOM.judgeBackButton.click();
    }

    // Open settings panel if not already open
    if (!this.settingsPanelWasOpen && DOM.settingsButton) {
      DOM.settingsButton.click();
    }

    // Wait for panel animation then scroll to prompt template
    setTimeout(() => {
      const promptTemplate = document.getElementById('judge-prompt-template');
      if (promptTemplate) {
        promptTemplate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        this.updateStepUI();
      }, 300);
    }, 300);
  }

  /**
   * Update spotlight and tooltip positions (for when panel opens)
   */
  updateStepUI() {
    const step = this.steps[this.currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    // Update spotlight
    if (this.spotlight) {
      this.spotlight.remove();
    }
    this.createSpotlight(targetElement, step);

    // Update tooltip position
    if (this.tooltip) {
      this.positionTooltip(this.tooltip, targetElement, step.position);
    }
  }

  /**
   * Create spotlight effect around target element
   */
  createSpotlight(element, step) {
    if (this.spotlight) {
      this.spotlight.remove();
    }

    const rect = element.getBoundingClientRect();
    const padding = step.highlightPadding || 8;

    this.spotlight = document.createElement('div');
    this.spotlight.className = 'onboarding-spotlight';
    this.spotlight.style.top = `${rect.top - padding}px`;
    this.spotlight.style.left = `${rect.left - padding}px`;
    this.spotlight.style.width = `${rect.width + padding * 2}px`;
    this.spotlight.style.height = `${rect.height + padding * 2}px`;

    document.body.appendChild(this.spotlight);
  }

  /**
   * Create tooltip for current step
   */
  createTooltip(step, targetElement) {
    if (this.tooltip) {
      this.tooltip.remove();
    }

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'onboarding-tooltip';
    this.tooltip.setAttribute('role', 'dialog');
    this.tooltip.setAttribute('aria-labelledby', 'onboarding-tooltip-title');
    this.tooltip.setAttribute('aria-describedby', 'onboarding-tooltip-description');

    const header = document.createElement('div');
    header.className = 'onboarding-tooltip-header';

    const title = document.createElement('h3');
    title.id = 'onboarding-tooltip-title';
    title.textContent = step.title;

    const progress = document.createElement('span');
    progress.className = 'onboarding-tooltip-progress';
    progress.textContent = this.getUIText('onboardingProgress')(this.currentStep + 1, this.steps.length);

    header.appendChild(title);
    header.appendChild(progress);

    const description = document.createElement('p');
    description.id = 'onboarding-tooltip-description';
    description.textContent = step.description;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'onboarding-tooltip-buttons';

    // Previous button (disabled on first step)
    const prevButton = document.createElement('button');
    prevButton.className = 'onboarding-button onboarding-button-secondary';
    prevButton.textContent = this.getUIText('onboardingPrevious');
    prevButton.disabled = this.currentStep === 0;
    prevButton.addEventListener('click', () => this.previousStep());

    // Next/Finish button
    const nextButton = document.createElement('button');
    nextButton.className = 'onboarding-button onboarding-button-primary';
    const isLastStep = this.currentStep === this.steps.length - 1;
    nextButton.textContent = isLastStep
      ? this.getUIText('onboardingFinish')
      : this.getUIText('onboardingNext');
    nextButton.addEventListener('click', () => {
      if (isLastStep) {
        this.finishTour();
      } else {
        this.nextStep();
      }
    });

    buttonContainer.appendChild(prevButton);
    buttonContainer.appendChild(nextButton);

    this.tooltip.appendChild(header);
    this.tooltip.appendChild(description);
    this.tooltip.appendChild(buttonContainer);

    document.body.appendChild(this.tooltip);

    // Position tooltip
    this.positionTooltip(this.tooltip, targetElement, step.position);

    // Focus on next button for accessibility
    nextButton.focus();
  }

  /**
   * Position tooltip relative to target element
   */
  positionTooltip(tooltip, targetElement, position) {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 16;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = targetRect.bottom + spacing;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipRect.height - spacing;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + spacing;
        break;
      default:
        top = targetRect.bottom + spacing;
        left = targetRect.left;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;

    top = Math.max(margin, Math.min(top, viewportHeight - tooltipRect.height - margin));
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipRect.width - margin));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * Handle keyboard navigation during steps
   */
  handleStepKeyDown(e) {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      // Enter = next/finish (but not Cmd+Enter or Ctrl+Enter)
      if (this.currentStep === this.steps.length - 1) {
        this.finishTour();
      } else {
        this.nextStep();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      // Arrow keys = next
      if (this.currentStep < this.steps.length - 1) {
        this.nextStep();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      // Arrow keys = previous
      if (this.currentStep > 0) {
        this.previousStep();
      }
    } else if (e.key === 'Escape' && this.isRestart) {
      // Escape = close (only if restarting)
      this.cleanup();
    }
  }

  /**
   * Go to next step
   */
  nextStep() {
    // Handle afterHide logic for current step
    const currentStepData = this.steps[this.currentStep];
    if (currentStepData?.id === 'collect-button') {
      // Don't close judge panel yet - will be handled in step 6
      // (Judge panel stays open when transitioning to settings)
    } else if (currentStepData?.id === 'judge-prompt-template') {
      // Close settings panel if it wasn't originally open
      if (!this.settingsPanelWasOpen && DOM.settingsButton) {
        const settingsPanel = DOM.settingsPanel;
        if (settingsPanel?.classList.contains('is-open')) {
          DOM.settingsButton.click();
        }
      }
    }

    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  /**
   * Go to previous step
   */
  previousStep() {
    // Handle afterHide logic for current step
    const currentStepData = this.steps[this.currentStep];
    if (currentStepData?.id === 'collect-button') {
      // Close judge panel if we're going back
      if (!this.judgePanelWasOpen && DOM.judgeBackButton) {
        DOM.judgeBackButton.click();
      }
    } else if (currentStepData?.id === 'judge-prompt-template') {
      // Close settings panel if it wasn't originally open
      if (!this.settingsPanelWasOpen && DOM.settingsButton) {
        const settingsPanel = DOM.settingsPanel;
        if (settingsPanel?.classList.contains('is-open')) {
          DOM.settingsButton.click();
        }
      }
      // Re-open judge panel if going back to collect button step
      if (!this.judgePanelWasOpen && DOM.judgeButton) {
        const judgePanel = document.querySelector('.judge-panel');
        if (!judgePanel?.classList.contains('open')) {
          DOM.judgeButton.click();
        }
      }
    }

    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Finish the tour and save completion status
   */
  finishTour() {
    // Close judge panel if it was opened during tour
    const currentStepData = this.steps[this.currentStep];
    if (currentStepData?.id === 'collect-button' && !this.judgePanelWasOpen && DOM.judgeBackButton) {
      DOM.judgeBackButton.click();
    }

    // Close settings panel if it was opened during tour
    if (currentStepData?.id === 'judge-prompt-template' && !this.settingsPanelWasOpen && DOM.settingsButton) {
      const settingsPanel = DOM.settingsPanel;
      if (settingsPanel?.classList.contains('is-open')) {
        DOM.settingsButton.click();
      }
    }

    // Save completion status
    localStorage.setItem(ONBOARDING_KEY, 'true');

    // Show completion message
    this.showCompletionMessage();
  }

  /**
   * Show completion message
   */
  showCompletionMessage() {
    // Remove current tooltip and spotlight
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    if (this.spotlight) {
      this.spotlight.remove();
      this.spotlight = null;
    }

    // Remove steps-mode to show dark background again
    if (this.overlay) {
      this.overlay.classList.remove('steps-mode');
    }

    // Create completion modal
    const modal = document.createElement('div');
    modal.className = 'onboarding-welcome'; // Reuse welcome modal styles
    modal.setAttribute('role', 'dialog');

    const title = document.createElement('h2');
    title.textContent = this.getUIText('onboardingCompleteTitle');

    const description = document.createElement('p');
    description.textContent = this.getUIText('onboardingCompleteMessage');

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'onboarding-welcome-buttons';

    const doneButton = document.createElement('button');
    doneButton.className = 'onboarding-button onboarding-button-primary';
    doneButton.textContent = 'OK';
    doneButton.addEventListener('click', () => this.cleanup());

    buttonContainer.appendChild(doneButton);

    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(buttonContainer);

    if (this.overlay) {
      this.overlay.appendChild(modal);
    }

    // Focus on done button
    doneButton.focus();

    // Setup keyboard handler
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
    }
    this.boundKeyHandler = (e) => {
      if ((e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) || e.key === 'Escape') {
        this.cleanup();
      }
    };
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  /**
   * Clean up and remove all onboarding elements
   */
  cleanup() {
    // Remove keyboard handler
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    // Remove all elements
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    if (this.spotlight) {
      this.spotlight.remove();
      this.spotlight = null;
    }
    if (this.welcomeModal) {
      this.welcomeModal.remove();
      this.welcomeModal = null;
    }
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.classList.remove('steps-mode');
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.remove();
          this.overlay = null;
        }
      }, 300);
    }

    // Reset state
    this.currentStep = -1;
    this.judgePanelWasOpen = false;
    this.settingsPanelWasOpen = false;
  }

  /**
   * Get UI text in current language
   */
  getUIText(key) {
    const strings = UI_STRINGS[this.language] || UI_STRINGS.en;
    const text = strings[key];
    return typeof text === 'function' ? text : text || key;
  }
}

// Singleton instance
let onboardingManager = null;

/**
 * Setup onboarding - call this after DOM is ready
 */
export function setupOnboarding() {
  if (!onboardingManager) {
    onboardingManager = new OnboardingManager();
    onboardingManager.init();
  }
  onboardingManager.checkAndShowOnboarding();
}

/**
 * Restart onboarding tour (called from settings)
 */
export function restartOnboarding() {
  if (!onboardingManager) {
    onboardingManager = new OnboardingManager();
    onboardingManager.init();
  }
  onboardingManager.startTour(true);
}
