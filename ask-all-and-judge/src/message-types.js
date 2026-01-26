/**
 * Message Types and Message Creation Utilities
 * Provides type-safe message definitions and validation
 */

// Message type constants
export const MessageTypes = {
  // Extension tab ↔ Service Worker
  REGISTER_EXTENSION_TAB: 'REGISTER_EXTENSION_TAB',
  GET_STATUS: 'GET_STATUS',
  SEND_QUERY: 'SEND_QUERY',

  // Service Worker ↔ Content Scripts
  PING: 'PING',
  INJECT_QUERY: 'INJECT_QUERY',
  GET_RESPONSE: 'GET_RESPONSE',
  CHECK_LOGIN: 'CHECK_LOGIN',
  EXTRACT_CONVERSATION: 'EXTRACT_CONVERSATION',
  CONTENT_READY: 'CONTENT_READY',

  // Status updates
  STATUS_UPDATE: 'STATUS_UPDATE',
  RESPONSE_READY: 'RESPONSE_READY',
  RESPONSE_UPDATE: 'RESPONSE_UPDATE',
  ERROR: 'ERROR',

  // Export/Import
  PARALLEL_QUERY_EXPORT_REQUEST: 'PARALLEL_QUERY_EXPORT_REQUEST',
  PARALLEL_QUERY_IMPORT_REQUEST: 'PARALLEL_QUERY_IMPORT_REQUEST',
  PARALLEL_QUERY_SEND: 'PARALLEL_QUERY_SEND',
  PARALLEL_QUERY_EXPORT_RESPONSE: 'PARALLEL_QUERY_EXPORT_RESPONSE',
  PARALLEL_QUERY_IMPORT_RESPONSE: 'PARALLEL_QUERY_IMPORT_RESPONSE',
  PARALLEL_QUERY_EXPORT_ERROR: 'PARALLEL_QUERY_EXPORT_ERROR',
  PARALLEL_QUERY_INJECTOR_READY: 'PARALLEL_QUERY_INJECTOR_READY'
};

/**
 * Message creation factory functions
 * Provides type-safe message creation with validation
 */
export const createMessage = {
  registerTab: () => ({
    type: MessageTypes.REGISTER_EXTENSION_TAB
  }),

  sendQuery: (query, targets) => {
    if (!query || !targets) {
      throw new Error('Query and targets are required');
    }
    return {
      type: MessageTypes.SEND_QUERY,
      query,
      targets
    };
  },

  getStatus: () => ({
    type: MessageTypes.GET_STATUS
  }),

  ping: () => ({
    type: MessageTypes.PING
  }),

  injectQuery: (query) => ({
    type: MessageTypes.INJECT_QUERY,
    query
  }),

  getResponse: () => ({
    type: MessageTypes.GET_RESPONSE
  }),

  checkLogin: () => ({
    type: MessageTypes.CHECK_LOGIN
  }),

  extractConversation: () => ({
    type: MessageTypes.EXTRACT_CONVERSATION
  }),

  contentReady: (aiName, isRootFrame) => ({
    type: MessageTypes.CONTENT_READY,
    aiName,
    isRootFrame
  }),

  statusUpdate: (aiName, status, additionalData = {}) => ({
    type: MessageTypes.STATUS_UPDATE,
    aiName,
    status,
    ...additionalData
  }),

  responseReady: (aiName, response, responseTime) => ({
    type: MessageTypes.RESPONSE_READY,
    aiName,
    response,
    responseTime
  }),

  responseUpdate: (aiName, response) => ({
    type: MessageTypes.RESPONSE_UPDATE,
    aiName,
    response
  }),

  error: (aiName, error, details = {}) => ({
    type: MessageTypes.ERROR,
    aiName,
    error: error.message || error,
    ...details
  }),

  exportRequest: (ai) => ({
    type: MessageTypes.PARALLEL_QUERY_EXPORT_REQUEST,
    ai
  }),

  exportResponse: (content, filename, ai, format) => ({
    type: MessageTypes.PARALLEL_QUERY_EXPORT_RESPONSE,
    content,
    filename,
    ai,
    format
  }),

  exportError: (error, ai) => ({
    type: MessageTypes.PARALLEL_QUERY_EXPORT_ERROR,
    error,
    ai
  }),

  importRequest: (ai, content) => ({
    type: MessageTypes.PARALLEL_QUERY_IMPORT_REQUEST,
    ai,
    content
  }),

  importResponse: (ai, success) => ({
    type: MessageTypes.PARALLEL_QUERY_IMPORT_RESPONSE,
    ai,
    success
  }),

  judgeSend: (ai, query, submit = true) => ({
    type: MessageTypes.PARALLEL_QUERY_SEND,
    ai,
    query,
    submit
  }),

  injectorReady: (ai) => ({
    type: MessageTypes.PARALLEL_QUERY_INJECTOR_READY,
    ai
  })
};

/**
 * Validate a message object
 */
export function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Message must be an object' };
  }

  if (!message.type) {
    return { valid: false, error: 'Message must have a type' };
  }

  if (!Object.values(MessageTypes).includes(message.type)) {
    return { valid: false, error: `Unknown message type: ${message.type}` };
  }

  return { valid: true };
}

/**
 * Check if a message is of a specific type
 */
export function isMessageType(message, type) {
  return message && message.type === type;
}
