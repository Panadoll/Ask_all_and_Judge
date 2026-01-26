// Common utilities for all content scripts

// Base class for AI injectors with common message handling
class AIInjector {
  constructor(aiName, config = null) {
    this.aiName = aiName;
    this.config = config; // Optional configuration object
    this.isProcessing = false;
    this.observer = null;
    this.responseCheckInterval = null;
    this.responseUpdateInterval = null;
    this.lastResponseLength = 0;
    this.stableCount = 0;
    this.currentQuery = null;
    this._messageListener = null;
    this._exportListener = null;

    // If config is provided, set up selectors
    if (config) {
      this.inputSelectors = config.inputSelectors || [];
      this.submitSelectors = config.submitSelectors || [];
      this.responseSelectors = config.responseSelectors || [];
      this.stopButtonSelectors = config.stopButtonSelectors || [];
    }
  }

  // Initialize the injector
  async initialize() {
    console.log(`${this.aiName} injector initializing...`);

    // Setup common listeners immediately so we can respond to events
    this.setupMessageListener();
    this.setupDirectMessageListener();
    this.setupExportListener();
    this.setupImportListener();
    this.setupJudgeListener();

    // Notify parent window that we're ready (for UI state)
    // We do this early because if the user sees the page, they expect to be able to interact
    this.notifyReady();

    // Notify background that we're ready
    this.sendToBackground({
      type: 'CONTENT_READY',
      aiName: this.aiName,
      isRootFrame: this.isRootFrame()
    });

    // Wait for page to be fully ready (internal state)
    await this.waitForPageReady();

    console.log(`${this.aiName} injector ready`);
    return true;
  }

  // Setup common message listener (can be overridden for custom handling)
  setupMessageListener() {
    if (this._messageListener) {
      chrome.runtime.onMessage.removeListener(this._messageListener);
    }

    this._messageListener = (message, sender, sendResponse) => {
      console.log(`${this.aiName}: Received message:`, message.type);

      (async () => {
        try {
          switch (message.type) {
            case 'PING':
              sendResponse({ ready: true, aiName: this.aiName });
              break;

            case 'INJECT_QUERY':
              await this.handleQuery(message.query, { waitForResponse: false });
              sendResponse({ success: true });
              break;

            case 'GET_RESPONSE':
              const response = this.extractLatestResponse();
              sendResponse({ success: true, response });
              break;

            case 'CHECK_LOGIN':
              const loggedIn = this.isLoggedIn();
              sendResponse({ success: true, loggedIn });
              break;

            case 'EXTRACT_CONVERSATION':
              const conversation = await this.extractConversation();
              sendResponse({ success: true, conversation });
              break;

            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          console.error(`${this.aiName}: Error handling message:`, error);
          sendResponse({ success: false, error: error.message });
        }
      })();

      return true; // Keep channel open for async response
    };

    chrome.runtime.onMessage.addListener(this._messageListener);
  }

  // Setup direct message listener for parent window communication (bypasses Service Worker)
  setupDirectMessageListener() {
    window.addEventListener('message', async (event) => {
      // Security check: ensure message is from parent
      if (event.source !== window.parent) return;

      const message = event.data;
      if (!message || message.type !== 'DIRECT_INJECT_QUERY') return;

      // Check if this message is for this AI
      if (message.aiName && message.aiName !== this.aiName) return;

      console.log(`${this.aiName}: Received direct query injection request`);

      try {
        await this.handleQuery(message.query, { waitForResponse: false });
        
        // Send success response
        window.parent.postMessage({
          type: 'DIRECT_INJECT_RESULT',
          success: true,
          aiName: this.aiName,
          id: message.id // Echo back the ID to correlate request/response
        }, '*');
      } catch (error) {
        console.error(`${this.aiName}: Direct injection error:`, error);
        
        // Send error response
        window.parent.postMessage({
          type: 'DIRECT_INJECT_RESULT',
          success: false,
          error: error.message,
          aiName: this.aiName,
          id: message.id
        }, '*');
      }
    });
    console.log(`${this.aiName}: Direct message listener set up`);
  }

  // Setup export request listener
  setupExportListener() {
    if (this._exportListener) {
      window.removeEventListener('message', this._exportListener);
    }

    this._exportListener = async (event) => {
      console.log(`${this.aiName}: Received message:`, event.data);

      if (event.data?.type === 'PARALLEL_QUERY_EXPORT_REQUEST') {
        console.log(`${this.aiName}: Got export request for`, event.data.ai, 'current AI:', this.aiName);

        if (event.data.ai !== this.aiName) {
          console.log(`${this.aiName}: Ignoring export request for`, event.data.ai);
          return;
        }

        console.log(`${this.aiName}: Processing export request`);
        try {
          const conversation = await this.extractConversation();
          console.log(`${this.aiName}: Extracted conversation, length:`, conversation.length);

          // Get export format for this AI
          const exportFormat = this.getExportFormat?.() || 'markdown';

          // Format the conversation based on AI-specific format
          const formattedContent = this.formatExportContent?.(conversation, exportFormat) || conversation;
          const filename = this.getExportFilename?.() || `${this.aiName}-${Date.now()}.md`;

          console.log(`${this.aiName}: Sending export response back to parent`);

          window.parent.postMessage({
            type: 'PARALLEL_QUERY_EXPORT_RESPONSE',
            content: formattedContent,
            filename: filename,
            ai: this.aiName,
            format: exportFormat
          }, '*');
        } catch (error) {
          console.error(`${this.aiName}: Export error:`, error);
          window.parent.postMessage({
            type: 'PARALLEL_QUERY_EXPORT_ERROR',
            error: error.message,
            ai: this.aiName
          }, '*');
        }
      }
    };

    window.addEventListener('message', this._exportListener);
    console.log(`${this.aiName}: Export listener set up`);
  }

  // Setup import/transfer request listener
  setupImportListener() {
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'PARALLEL_QUERY_IMPORT_REQUEST') {
        if (event.data.ai !== this.aiName) return;

        console.log(`${this.aiName}: Processing import request`);
        try {
          const content = event.data.content;
          if (content) {
            await this.injectQuery(content);
            console.log(`${this.aiName}: Import successful`);
          }
        } catch (error) {
          console.error(`${this.aiName}: Import error:`, error);
        }
      }
    });
  }

  // Setup judge send request listener
  setupJudgeListener() {
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'PARALLEL_QUERY_SEND') {
        if (event.data.ai !== this.aiName) return;

        console.log(`${this.aiName}: Processing judge send request`);
        try {
          const query = event.data.query;
          const submit = event.data.submit !== false; // Default to true
          if (query) {
            // Use handleQuery to inject AND submit (or not)
            await this.handleQuery(query, { waitForResponse: false, submit });
            console.log(`${this.aiName}: Judge query processed (submit=${submit})`);
          }
        } catch (error) {
          console.error(`${this.aiName}: Judge send error:`, error);
        }
      }
    });
  }

  // Get export format for this AI (can be overridden)
  getExportFormat() {
    return 'markdown';
  }

  // Get export filename for this AI (can be overridden)
  getExportFilename() {
    return `${this.aiName}-${Date.now()}.md`;
  }

  // Format export content based on format (can be overridden for AI-specific formatting)
  formatExportContent(content, format) {
    return content;
  }

  // Notify parent that injector is ready
  notifyReady() {
    window.parent.postMessage({
      type: 'PARALLEL_QUERY_INJECTOR_READY',
      ai: this.aiName
    }, '*');
  }

  // Wait for page to be ready
  async waitForPageReady(timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (document.readyState === 'complete') {
        // Additional wait for dynamic content
        await this.sleep(1000);
        return true;
      }
      await this.sleep(100);
    }

    return document.readyState === 'complete';
  }

  // Check if this script runs in the top frame of the iframe
  isRootFrame() {
    try {
      return window.parent === window.top;
    } catch (error) {
      return true;
    }
  }

  // Find element using multiple selectors
  findElement(selectors, parent = document) {
    for (const selector of selectors) {
      try {
        const element = parent.querySelector(selector);
        if (element) {
          console.log(`Found element with selector: ${selector}`);
          return element;
        }
      } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
      }
    }
    return null;
  }

  // Find all elements using multiple selectors
  findElements(selectors, parent = document) {
    for (const selector of selectors) {
      try {
        const elements = parent.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          return Array.from(elements);
        }
      } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
      }
    }
    return [];
  }

  // Wait for element to appear
  async waitForElement(selectors, timeout = 5000, parent = document) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = this.findElement(selectors, parent);
      if (element) return element;
      await this.sleep(100);
    }

    return null;
  }

  // Trigger input event for React/Vue
  triggerInputEvent(element, value) {
    // Set the value
    element.value = value;

    // Trigger various events
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' }),
      new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'a' })
    ];

    events.forEach(event => element.dispatchEvent(event));

    // For React specifically
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Trigger input event for contenteditable
  triggerContentEditableInput(element, text) {
    // Set text content
    element.textContent = text;

    // Focus the element
    element.focus();

    // Trigger events
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text })
    ];

    events.forEach(event => element.dispatchEvent(event));
  }

  // Setup response observer with debouncing
  setupResponseObserver(callback, debounceMs = 2000) {
    this.cleanupObserver();

    let debounceTimer = null;

    this.observer = new MutationObserver((mutations) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer
      debounceTimer = setTimeout(() => {
        const response = this.extractLatestResponse();
        if (response && response.length > 0) {
          const currentLength = response.length;

          // Check if response is stable
          if (currentLength === this.lastResponseLength) {
            this.stableCount++;

            // If stable for 2 checks, consider it complete
            if (this.stableCount >= 2) {
              console.log(`${this.aiName} response appears complete (stable)`);
              callback(response);
              this.cleanupObserver();
            }
          } else {
            this.lastResponseLength = currentLength;
            this.stableCount = 0;
          }
        }
      }, debounceMs);
    });

    // Observe the document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log(`${this.aiName} response observer setup`);
  }

  // Setup polling-based response detection (fallback)
  setupResponsePolling(callback, intervalMs = 1000) {
    this.cleanupPolling();

    this.responseCheckInterval = setInterval(() => {
      const response = this.extractLatestResponse();

      if (response && response.length > 0) {
        const currentLength = response.length;

        if (currentLength === this.lastResponseLength) {
          this.stableCount++;

          // If stable for 3 checks, consider it complete
          if (this.stableCount >= 3) {
            console.log(`${this.aiName} response appears complete (polling)`);
            callback(response);
            this.cleanupPolling();
          }
        } else {
          this.lastResponseLength = currentLength;
          this.stableCount = 0;
        }
      }
    }, intervalMs);

    console.log(`${this.aiName} response polling setup`);
  }

  // Setup real-time response update stream
  setupResponseUpdateStream(intervalMs = 1000) {
    this.cleanupUpdateStream();

    this.responseUpdateInterval = setInterval(async () => {
      const response = this.extractLatestResponse();

      if (response && response.length > 0) {
        // Send update to background
        try {
          await this.sendToBackground({
            type: 'RESPONSE_UPDATE',
            aiName: this.aiName,
            response: response
          });
        } catch (error) {
          console.error(`${this.aiName} error sending update:`, error);
        }
      }
    }, intervalMs);

    console.log(`${this.aiName} response update stream setup`);
  }

  // Cleanup observer
  cleanupObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // Cleanup polling
  cleanupPolling() {
    if (this.responseCheckInterval) {
      clearInterval(this.responseCheckInterval);
      this.responseCheckInterval = null;
    }
  }

  // Cleanup update stream
  cleanupUpdateStream() {
    if (this.responseUpdateInterval) {
      clearInterval(this.responseUpdateInterval);
      this.responseUpdateInterval = null;
    }
  }

  // Cleanup all resources including listeners
  cleanup() {
    this.cleanupObserver();
    this.cleanupPolling();
    this.cleanupUpdateStream();
    this.lastResponseLength = 0;
    this.stableCount = 0;
  }

  // Send message to background
  async sendToBackground(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error(`${this.aiName} error sending message:`, error);
      throw error;
    }
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if user is logged in (can be overridden)
  isLoggedIn() {
    // If config provides login indicators, use them
    if (this.config?.loginIndicators) {
      const { loggedOut, loggedOutText } = this.config.loginIndicators;

      // Check for logged-out elements
      const logoutElements = this.findElements(loggedOut || []);
      for (const element of logoutElements) {
        const text = element.textContent.toLowerCase();
        if (loggedOutText?.some(phrase => text.includes(phrase))) {
          console.log(`${this.aiName}: User appears to be logged out`);
          return false;
        }
      }

      // Check if input field exists (indicates logged in)
      const inputField = this.findElement(this.inputSelectors);
      return !!inputField;
    }

    // Default implementation - look for common login indicators
    const loginIndicators = [
      'button[aria-label*="login" i]',
      'button[aria-label*="sign in" i]',
      'a[href*="login"]',
      'a[href*="signin"]'
    ];

    const loginElement = this.findElement(loginIndicators);
    return !loginElement; // If no login button found, assume logged in
  }

  // Find input in Shadow DOM (for AIs like Gemini)
  findInputInShadowDOM() {
    if (!this.config?.hasShadowDOM || !this.config?.shadowDOMSelector) {
      return null;
    }

    const shadowHost = document.querySelector(this.config.shadowDOMSelector);
    if (!shadowHost || !shadowHost.shadowRoot) return null;

    return shadowHost.shadowRoot.querySelector('textarea, [contenteditable="true"]');
  }

  // Find element with Shadow DOM support
  async findInputElement(timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Try regular selectors first
      const element = this.findElement(this.inputSelectors);
      if (element) return element;

      // Try Shadow DOM if configured
      const shadowElement = this.findInputInShadowDOM();
      if (shadowElement) return shadowElement;

      await this.sleep(100);
    }

    return null;
  }

  // Inject query (config-driven default implementation)
  async injectQuery(query) {
    console.log(`${this.aiName}: Injecting query:`, query);

    // Check login status
    if (!this.isLoggedIn()) {
      throw new Error(`Please log in to ${this.aiName} first`);
    }

    // Find input element
    const inputElement = this.config ?
      await this.findInputElement(5000) :
      await this.waitForElement(this.inputSelectors, 5000);

    if (!inputElement) {
      throw new Error(`Could not find ${this.aiName} input field`);
    }

    console.log(`${this.aiName}: Found input element:`, inputElement.tagName);

    // Handle different input types
    const inputType = this.config?.inputType || 'textarea';

    if (inputElement.tagName === 'TEXTAREA' || inputType === 'textarea') {
      // Regular textarea
      inputElement.value = '';
      this.triggerInputEvent(inputElement, query);
    } else if (inputType === 'contenteditable' || inputElement.isContentEditable) {
      // Contenteditable div
      if (this.config?.useExecCommand) {
        // Method 1: Use execCommand (works well for Claude)
        inputElement.focus();
        await this.sleep(200);

        try {
          if (inputElement.textContent.trim() !== '') {
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
          }

          const success = document.execCommand('insertText', false, query);
          if (!success) throw new Error('execCommand failed');
        } catch (e) {
          console.log(`${this.aiName}: execCommand failed, falling back to direct manipulation`);
          inputElement.textContent = '';
          this.triggerContentEditableInput(inputElement, query);
        }
      } else {
        // Method 2: Direct manipulation
        inputElement.textContent = '';
        this.triggerContentEditableInput(inputElement, query);
      }
    } else if (inputType === 'mixed') {
      // Can be either textarea or contenteditable (like ChatGPT)
      if (inputElement.tagName === 'TEXTAREA') {
        inputElement.value = '';
        this.triggerInputEvent(inputElement, query);
      } else {
        inputElement.textContent = '';
        this.triggerContentEditableInput(inputElement, query);
      }
    }

    // Wait for UI to update
    await this.sleep(500);

    console.log(`${this.aiName}: Query injected successfully`);
    return true;
  }

  // Submit query (config-driven default implementation)
  async submitQuery() {
    console.log(`${this.aiName}: Submitting query...`);

    // Find submit button
    const submitButton = await this.waitForElement(this.submitSelectors, 3000);

    if (!submitButton) {
      throw new Error(`Could not find ${this.aiName} submit button`);
    }

    // Check if button is enabled
    if (submitButton.disabled) {
      console.warn(`${this.aiName}: Submit button is disabled, trying anyway`);
    }

    // Click the button
    submitButton.click();

    console.log(`${this.aiName}: Query submitted`);

    // Wait a bit for response to start
    await this.sleep(1000);

    return true;
  }

  // Extract latest response (config-driven default implementation)
  extractLatestResponse() {
    // Find all response elements
    const responseElements = this.findElements(this.responseSelectors);

    if (responseElements.length === 0) {
      return null;
    }

    // Get the last response
    const lastResponse = responseElements[responseElements.length - 1];

    // Extract text content
    let text = lastResponse.textContent || lastResponse.innerText;

    // Clean up the text
    text = text.trim();

    // Remove button text (like "Copy code")
    const buttons = lastResponse.querySelectorAll('button');
    buttons.forEach(btn => {
      const btnText = btn.textContent.trim();
      if (btnText) {
        text = text.replace(btnText, '');
      }
    });

    return text.trim();
  }

  // Check if response is still generating (config-driven default)
  isGenerating() {
    if (!this.stopButtonSelectors || this.stopButtonSelectors.length === 0) {
      return false;
    }

    const stopButton = this.findElement(this.stopButtonSelectors);
    return stopButton !== null;
  }

  // Wait for response to complete (can be overridden for AI-specific behavior)
  async waitForResponseComplete(timeout = 120000) {
    console.log(`${this.aiName}: Waiting for response to complete...`);

    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        this.cleanup();
        reject(new Error('Timeout waiting for response'));
      }, timeout);

      // Callback when response is ready
      const onResponseReady = (response) => {
        clearTimeout(timeoutId);
        console.log(`${this.aiName}: Response complete, length:`, response.length);
        resolve(response);
      };

      // Setup real-time update stream
      this.setupResponseUpdateStream(1000);

      // Use both observer and polling for reliability
      this.setupResponseObserver(onResponseReady, 2000);

      // Also setup polling as backup
      setTimeout(() => {
        this.setupResponsePolling(onResponseReady, 1000);
      }, 5000);

      // Additional check: wait for generation to complete
      const checkGenerating = setInterval(() => {
        if (!this.isGenerating()) {
          const response = this.extractLatestResponse();
          if (response && response.length > 50) {
            clearInterval(checkGenerating);
            clearTimeout(timeoutId);
            this.cleanup();
            console.log(`${this.aiName}: Response complete (generation finished)`);
            resolve(response);
          }
        }
      }, 2000);
    });
  }

  // Handle the full query process
  async handleQuery(query, options = {}) {
    const waitForResponse = options.waitForResponse !== false;
    const shouldSubmit = options.submit !== false;

    if (this.isProcessing) {
      throw new Error('Already processing a query');
    }

    this.isProcessing = true;
    this.currentQuery = query;
    this.cleanup();

    try {
      // Inject query
      await this.injectQuery(query);

      // Submit query
      if (shouldSubmit) {
        await this.submitQuery();
      } else {
        console.log(`${this.aiName}: Query injected only (submission skipped)`);
        this.isProcessing = false;
        return true;
      }

      if (!waitForResponse) {
        this.waitForResponseComplete()
          .then(async (response) => {
            await this.sendToBackground({
              type: 'RESPONSE_READY',
              aiName: this.aiName,
              response: response,
              query: query
            });
          })
          .catch(async (error) => {
            console.error(`${this.aiName}: Error handling query:`, error);
            await this.sendToBackground({
              type: 'ERROR',
              aiName: this.aiName,
              error: error.message
            });
          })
          .finally(() => {
            this.isProcessing = false;
          });

        return true;
      }

      const response = await this.waitForResponseComplete();

      await this.sendToBackground({
        type: 'RESPONSE_READY',
        aiName: this.aiName,
        response: response,
        query: query
      });

      this.isProcessing = false;
      return response;
    } catch (error) {
      console.error(`${this.aiName}: Error handling query:`, error);
      this.isProcessing = false;

      // Notify background of error
      await this.sendToBackground({
        type: 'ERROR',
        aiName: this.aiName,
        error: error.message
      });

      throw error;
    }
  }

  // Extract clean text content from a message element
  extractMessageContent(element) {
    if (!element) return '';

    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true);

    // Remove any button elements (copy code, etc.)
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());

    // Remove feedback prompts and other UI elements
    const divs = clone.querySelectorAll('div');
    divs.forEach(div => {
      const text = div.textContent || '';
      if (text.includes('Is this conversation helpful') ||
          text.includes('feedback') ||
          text.includes('thumbs up') ||
          text.includes('thumbs down')) {
        div.remove();
      }
    });

    // Get text content
    let text = clone.textContent || clone.innerText || '';
    return text.trim();
  }

  // Extract full conversation as markdown (can be overridden for AI-specific formatting)
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Find all message elements using common selectors
    const messageSelectors = this.getConversationSelectors();
    const messageElements = this.findElements(messageSelectors);

    for (const element of messageElements) {
      const role = this.getMessageRole(element);
      const content = this.extractMessageContent(element);

      if (content && content.length > 5) {
        // Skip footer/disclaimer text
        if (content.includes('Claude is AI') && content.includes('mistakes')) continue;
        if (content.includes('Sign in') && content.includes('Create an account')) continue;

        // Consolidate consecutive messages from the same role
        if (messages.length > 0 && messages[messages.length - 1].role === role) {
          messages[messages.length - 1].content += '\n\n' + content;
        } else {
          messages.push({ role, content });
        }
      }
    }

    // Build markdown
    for (const msg of messages) {
      markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
    }

    return markdown;
  }

  // Get selectors for finding conversation messages
  getConversationSelectors() {
    return [
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      '.user-turn',
      '.agent-turn',
      '.font-user-message',
      '.font-claude-message',
      '[class*="user-message"]',
      '[class*="assistant-message"]',
      '[class*="message"]'
    ];
  }

  // Determine the role of a message element
  getMessageRole(element) {
    // Try data attribute first
    const dataRole = element.getAttribute?.('data-message-author-role');
    if (dataRole) {
      return dataRole.toUpperCase();
    }

    // Check class names
    const classList = element.classList?.toString()?.toLowerCase() || '';
    const outerHTML = element.outerHTML?.toLowerCase() || '';

    if (classList.includes('user') || classList.includes('human') || outerHTML.includes('user-message')) {
      return 'USER';
    }
    if (classList.includes('assistant') || classList.includes('claude') || classList.includes('gpt') ||
        outerHTML.includes('assistant-message') || outerHTML.includes('model-response')) {
      return this.aiName.toUpperCase();
    }

    return 'UNKNOWN';
  }
}

// Export for use in other scripts
window.AIInjector = AIInjector;

console.log('Common utilities loaded');
