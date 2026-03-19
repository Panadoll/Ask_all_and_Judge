// Gemini Content Script Injector
// Configuration-driven approach (config inlined for Chrome extension compatibility)

class GeminiInjector extends AIInjector {
  constructor() {
    const config = {
      displayName: 'Gemini',
      inputSelectors: [
        'div.ql-editor[contenteditable="true"]',
        'div.ql-editor.textarea',
        'div[role="textbox"][contenteditable="true"]',
        'div[contenteditable="true"].textarea',
        'div[contenteditable="true"]',
        'textarea'
      ],
      submitSelectors: [
        'button.send-button',
        'button[aria-label*="Send" i]',
        'button[aria-label*="发送"]',
        'button[aria-label*="Submit" i]',
        'button[mattooltip*="Send" i]',
        'button[data-testid*="send" i]',
        'button[type="submit"]'
      ],
      responseSelectors: [
        '.model-response-text',
        'message-content model-response',
        '[class*="model-response"]',
        '[class*="response-container"]',
        'div[jsname] div.markdown'
      ],
      stopButtonSelectors: [
        'button[aria-label*="Stop" i]',
        'button[aria-label*="停止"]',
        'button[mattooltip*="Stop" i]'
      ],
      inputType: 'contenteditable',
      hasShadowDOM: false,
      loginIndicators: {
        loggedOut: [
          'a[href*="accounts.google.com"]',
          'button',
          'a'
        ],
        loggedOutText: ['sign in', 'get started', '登录']
      },
      conversationSelectors: {
        userMessages: '[data-test-id*="user-message"]',
        assistantMessages: '[data-test-id*="model-response"]'
      }
    };
    super('gemini', config);
  }

  // Override injectQuery for Gemini's Quill editor
  async injectQuery(query) {
    console.log(`${this.aiName}: Injecting query via Quill editor`);

    const inputElement = await this.findInputElement(5000);
    if (!inputElement) {
      throw new Error(`Could not find ${this.aiName} input field`);
    }

    console.log(`${this.aiName}: Found input element:`, inputElement.tagName, inputElement.className);

    // Focus the editor
    inputElement.focus();
    await this.sleep(200);

    // Clear existing content
    inputElement.innerHTML = '';

    // Insert text as a paragraph (Quill format)
    const p = document.createElement('p');
    p.textContent = query;
    inputElement.appendChild(p);

    // Trigger input events so Quill and the send button react
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    inputElement.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: query
    }));

    // Wait for UI to update (send button to become enabled)
    await this.sleep(500);

    console.log(`${this.aiName}: Query injected successfully`);
    return true;
  }

  // Override submitQuery to handle Gemini's send button behavior
  async submitQuery() {
    console.log(`${this.aiName}: Submitting query...`);

    // Try Enter key first as it's more reliable with Quill
    const inputElement = this.findElement(this.inputSelectors);
    if (inputElement) {
      inputElement.focus();
      await this.sleep(100);

      // Try clicking the send button
      const submitButton = this.findElement(this.submitSelectors);
      if (submitButton && !submitButton.disabled) {
        console.log(`${this.aiName}: Clicking send button`);
        submitButton.click();
        await this.sleep(500);

        // Verify the input was cleared (meaning message was sent)
        const currentInput = this.findElement(this.inputSelectors);
        if (!currentInput || currentInput.textContent.trim() === '' ||
            currentInput.querySelector('p:not(:empty)') === null) {
          console.log(`${this.aiName}: Query submitted via button click`);
          await this.sleep(1000);
          return true;
        }
      }

      // Fallback: simulate Enter key press
      console.log(`${this.aiName}: Button click may not have worked, trying Enter key`);
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputElement.dispatchEvent(enterEvent);
      await this.sleep(500);
    }

    console.log(`${this.aiName}: Query submitted`);
    await this.sleep(1000);
    return true;
  }

  // Override extractConversation for Gemini
  async extractConversation() {
    let markdown = '';
    const messages = [];

    // Strategy 1: Gemini custom elements (stable)
    const messageElements = document.querySelectorAll('user-query, model-response');

    if (messageElements.length > 0) {
      for (const element of messageElements) {
        let role = 'UNKNOWN';
        let content = '';

        if (element.tagName.toLowerCase() === 'user-query') {
          role = 'USER';
          // Content: .query-text-line is the actual text (avoiding hidden "你说"/"You said" label)
          const contentEl = element.querySelector('.query-text-line') ||
                            element.querySelector('p.query-text-line');
          if (contentEl) {
            content = contentEl.innerText || contentEl.textContent;
          } else {
            // Fallback: clone and remove hidden elements before extracting text
            const clone = element.cloneNode(true);
            clone.querySelectorAll('.cdk-visually-hidden, [aria-hidden="true"]').forEach(el => el.remove());
            content = clone.innerText || clone.textContent;
          }
        } else if (element.tagName.toLowerCase() === 'model-response') {
          role = 'GEMINI';
          // Content: message-content custom element contains clean response text
          const contentEl = element.querySelector('message-content') ||
                            element.querySelector('.markdown-text') ||
                            element.querySelector('.markdown');
          if (contentEl) {
            content = contentEl.innerText || contentEl.textContent;
          } else {
            // Fallback: clone and remove UI elements before extracting text
            const clone = element.cloneNode(true);
            clone.querySelectorAll('.cdk-visually-hidden, [aria-hidden="true"], button, .chip-container').forEach(el => el.remove());
            content = clone.innerText || clone.textContent;
          }
        }

        content = content ? content.trim() : '';

        if (content) {
          if (messages.length > 0 && messages[messages.length - 1].role === role) {
            messages[messages.length - 1].content += '\n\n' + content;
          } else {
            messages.push({ role, content });
          }
        }
      }
    }

    // Strategy 2: Use data-test-id based selectors
    if (messages.length === 0) {
      const userMsgs = document.querySelectorAll('[data-test-id*="user-message"], [data-test-id*="user-query"]');
      const aiMsgs = document.querySelectorAll('[data-test-id*="model-response"], .model-response-text');

      if (userMsgs.length > 0 || aiMsgs.length > 0) {
        // Collect all and sort by DOM position
        const allMsgs = [
          ...Array.from(userMsgs).map(el => ({ el, role: 'USER' })),
          ...Array.from(aiMsgs).map(el => ({ el, role: 'GEMINI' }))
        ].sort((a, b) => {
          const pos = a.el.compareDocumentPosition(b.el);
          return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        for (const { el, role } of allMsgs) {
          const content = (el.innerText || el.textContent || '').trim();
          if (content) {
            if (messages.length > 0 && messages[messages.length - 1].role === role) {
              messages[messages.length - 1].content += '\n\n' + content;
            } else {
              messages.push({ role, content });
            }
          }
        }
      }
    }

    if (messages.length === 0) {
      return super.extractConversation();
    }

    for (const msg of messages) {
      markdown += `### ${msg.role}\n\n${msg.content}\n\n---\n\n`;
    }

    return markdown;
  }
}

// Initialize the injector
const injector = new GeminiInjector();
injector.initialize();
