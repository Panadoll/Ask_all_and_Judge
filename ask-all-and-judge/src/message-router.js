import { validateMessage } from './message-types.js';

/**
 * MessageRouter - Centralized message routing system
 * Provides type-safe message handling with error management
 */
export class MessageRouter {
  constructor() {
    this.handlers = new Map();
    this.globalErrorHandler = null;
    this.beforeHandlers = [];
    this.afterHandlers = [];
  }

  /**
   * Register a handler for a specific message type
   */
  on(messageType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    this.handlers.set(messageType, handler);
    return this; // Support chaining
  }

  /**
   * Register multiple handlers at once
   */
  register(handlers) {
    Object.entries(handlers).forEach(([type, handler]) => {
      this.on(type, handler);
    });
    return this;
  }

  /**
   * Register a global error handler
   */
  onError(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Error handler must be a function');
    }

    this.globalErrorHandler = handler;
    return this;
  }

  /**
   * Register middleware that runs before message handling
   */
  before(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }

    this.beforeHandlers.push(middleware);
    return this;
  }

  /**
   * Register middleware that runs after message handling
   */
  after(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }

    this.afterHandlers.push(middleware);
    return this;
  }

  /**
   * Route a message to its handler
   */
  async route(message, sender, sendResponse) {
    // Validate message
    const validation = validateMessage(message);
    if (!validation.valid) {
      console.error('[MessageRouter] Invalid message:', validation.error, message);
      if (this.globalErrorHandler) {
        this.globalErrorHandler(new Error(validation.error), message);
      }
      if (sendResponse) {
        sendResponse({ success: false, error: validation.error });
      }
      return false;
    }

    // Run before middleware
    for (const middleware of this.beforeHandlers) {
      try {
        await middleware(message, sender);
      } catch (error) {
        console.error('[MessageRouter] Before middleware error:', error);
      }
    }

    // Find handler
    const handler = this.handlers.get(message.type);
    if (!handler) {
      console.warn('[MessageRouter] No handler registered for message type:', message.type);
      if (sendResponse) {
        sendResponse({ success: false, error: `No handler for type: ${message.type}` });
      }
      return false;
    }

    // Execute handler
    let result = null;
    try {
      result = await handler(message, sender, sendResponse);

      // Run after middleware
      for (const middleware of this.afterHandlers) {
        try {
          await middleware(message, sender, result);
        } catch (error) {
          console.error('[MessageRouter] After middleware error:', error);
        }
      }

      return result;
    } catch (error) {
      console.error('[MessageRouter] Error handling message:', message.type, error);

      if (this.globalErrorHandler) {
        this.globalErrorHandler(error, message);
      }

      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }

      return false;
    }
  }

  /**
   * Unregister a handler
   */
  off(messageType) {
    return this.handlers.delete(messageType);
  }

  /**
   * Clear all handlers
   */
  clear() {
    this.handlers.clear();
    this.beforeHandlers = [];
    this.afterHandlers = [];
    this.globalErrorHandler = null;
  }

  /**
   * Get all registered message types
   */
  getRegisteredTypes() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a handler is registered for a type
   */
  hasHandler(messageType) {
    return this.handlers.has(messageType);
  }
}

/**
 * Create a router instance with logging middleware
 */
export function createRouterWithLogging(logPrefix = '[MessageRouter]') {
  const router = new MessageRouter();

  // Add logging middleware
  router.before((message, sender) => {
    console.log(`${logPrefix} Received:`, message.type, message);
  });

  router.after((message, sender, result) => {
    console.log(`${logPrefix} Handled:`, message.type, 'Result:', result);
  });

  router.onError((error, message) => {
    console.error(`${logPrefix} Error:`, message.type, error);
  });

  return router;
}
