import { getUIText, showStatus, handleTextareaResize } from './utils.js';
import { expandPromptShortcuts } from './prompt-library.js';
import { closePromptSuggestions } from './prompt-suggestions.js';
import { getSelectedTargets, getActivePanels } from './panels.js';
import { getAiReady } from './messaging.js';

/**
 * QueryHandler - Manages query submission and validation
 */
export class QueryHandler {
  constructor({ DOM, state }) {
    this.DOM = DOM;
    this.state = state;
  }

  /**
   * Get the query text from the input
   */
  getQuery() {
    return this.DOM.queryInput.value;
  }

  /**
   * Get the selected AI targets
   */
  getTargets() {
    return getSelectedTargets();
  }

  /**
   * Validate query and targets
   */
  validate(query, targets) {
    if (!query) {
      showStatus(getUIText('statusErrorQuestion'), 'error');
      return false;
    }

    if (targets.length === 0) {
      showStatus(getUIText('statusErrorNoPanels'), 'error');
      return false;
    }

    return true;
  }

  /**
   * Handle successful send
   */
  handleSuccess(response, targets) {
    const results = response?.results || {};
    const successCount = targets.filter((aiKey) => results[aiKey]?.success).length;

    if (successCount === 0) {
      showStatus(getUIText('statusErrorNotReady'), 'error');
      return;
    }

    const statusType = successCount === targets.length ? 'success' : 'info';
    showStatus(getUIText('statusSent', successCount, targets.length), statusType);

    // Clear input after successful send
    this.DOM.queryInput.value = '';
    handleTextareaResize();
  }

  /**
   * Handle send error
   */
  handleError(error) {
    showStatus(getUIText('statusSendFailed', error.message), 'error');
  }

  /**
   * Update send button disabled state
   */
  updateSendButton() {
    const anyReady = getSelectedTargets().some(getAiReady);
    this.DOM.sendButton.disabled = !anyReady;
  }

  /**
   * Send query directly to iframes via postMessage (bypassing Service Worker)
   */
  async sendDirectly(query, targets) {
    const requestId = Date.now().toString();
    const activePanels = getActivePanels();
    const results = {};
    
    // Initialize results as failed (default)
    targets.forEach(aiKey => {
      results[aiKey] = { success: false, error: 'Timeout or panel not found' };
    });

    const pendingTargets = new Set(targets);
    
    return new Promise((resolve) => {
      // Timeout to ensure we don't hang forever
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve({ results });
      }, 5000); // 5 second timeout for acknowledgment

      const messageHandler = (event) => {
        if (event.data?.type === 'DIRECT_INJECT_RESULT' && event.data.id === requestId) {
          const { aiName, success, error } = event.data;
          
          if (pendingTargets.has(aiName)) {
            results[aiName] = { 
              success, 
              error: error || (success ? undefined : 'Unknown error') 
            };
            pendingTargets.delete(aiName);
            
            // If all targets responded, finish early
            if (pendingTargets.size === 0) {
              cleanup();
              resolve({ results });
            }
          }
        }
      };

      window.addEventListener('message', messageHandler);

      const cleanup = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
      };

      // Send messages
      let sentCount = 0;
      activePanels.forEach(panel => {
        const aiKey = panel.select.value;
        if (targets.includes(aiKey) && panel.iframe && panel.iframe.contentWindow) {
          try {
            panel.iframe.contentWindow.postMessage({
              type: 'DIRECT_INJECT_QUERY',
              query: query,
              aiName: aiKey,
              id: requestId,
              searchEnabled: this.state.searchEnabled,
              thinkingEnabled: this.state.thinkingEnabled
            }, '*');
            sentCount++;
          } catch (e) {
            console.error(`Failed to post message to ${aiKey}:`, e);
            results[aiKey].error = e.message;
            pendingTargets.delete(aiKey);
          }
        }
      });

      // If no messages could be sent (e.g. no iframes), resolve immediately
      if (sentCount === 0) {
        cleanup();
        resolve({ results });
      }
    });
  }

  /**
   * Main send handler - validates, expands shortcuts, and sends query
   */
  async send() {
    // Expand prompt shortcuts first
    const expanded = expandPromptShortcuts(this.DOM.queryInput.value);
    if (expanded !== this.DOM.queryInput.value) {
      this.DOM.queryInput.value = expanded;
      handleTextareaResize();
    }

    // Close prompt suggestions
    closePromptSuggestions();

    const query = expanded.trim();
    const targets = this.getTargets();

    // Validate
    if (!this.validate(query, targets)) {
      return;
    }

    // Update state on first message
    if (!this.state.hasUserSentMessage) {
      this.state.hasUserSentMessage = true;
      this.state.shouldProtectFocus = false;
    }

    // Disable button during send
    this.DOM.sendButton.disabled = true;

    try {
      // Record the query for unified view
      this.state.lastQuery = query;

      // Use direct message passing instead of background service worker
      const response = await this.sendDirectly(query, targets);
      this.handleSuccess(response, targets);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.updateSendButton();
    }
  }
}
