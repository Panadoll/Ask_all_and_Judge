// Grok Frame Fix - MAIN world, document_start
// Override ALL cross-origin-sensitive Window properties and suppress remaining errors

(function () {
  'use strict';
  console.log('[GrokFrameFix] Running frame bypass...');

  // Override parent (confirmed working)
  try {
    Object.defineProperty(window, 'parent', {
      get: function () { return window; },
      configurable: true
    });
  } catch (e) {}

  // Override top
  try {
    Object.defineProperty(window, 'top', {
      get: function () { return window; },
      configurable: true
    });
  } catch (e) {}

  // Override frameElement (returns null when same-origin top frame)
  try {
    Object.defineProperty(window, 'frameElement', {
      get: function () { return null; },
      configurable: true
    });
  } catch (e) {}

  // Override opener
  try {
    Object.defineProperty(window, 'opener', {
      get: function () { return null; },
      configurable: true
    });
  } catch (e) {}

  // Override window.length (number of sub-frames, sometimes checked)
  // Keep original behavior - don't override

  // Global error suppression for any remaining SecurityError
  // Use capture phase to intercept before React's error boundary
  window.addEventListener('error', function (event) {
    var msg = (event.message || '') + ((event.error && event.error.message) || '');
    if (msg.indexOf('SecurityError') !== -1 ||
        msg.indexOf('Blocked a frame') !== -1 ||
        msg.indexOf('cross-origin') !== -1) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    if (reason && (reason.name === 'SecurityError' ||
        (reason.message && reason.message.indexOf('Blocked a frame') !== -1))) {
      event.preventDefault();
    }
  }, true);

  // Monkey-patch setTimeout/setInterval to wrap callbacks with SecurityError suppression
  var _setTimeout = window.setTimeout;
  window.setTimeout = function (fn, delay) {
    if (typeof fn === 'function') {
      var wrapped = function () {
        try {
          return fn.apply(this, arguments);
        } catch (e) {
          if (e.name === 'SecurityError') return;
          throw e;
        }
      };
      return _setTimeout.call(window, wrapped, delay);
    }
    return _setTimeout.apply(window, arguments);
  };

  var _setInterval = window.setInterval;
  window.setInterval = function (fn, delay) {
    if (typeof fn === 'function') {
      var wrapped = function () {
        try {
          return fn.apply(this, arguments);
        } catch (e) {
          if (e.name === 'SecurityError') return;
          throw e;
        }
      };
      return _setInterval.call(window, wrapped, delay);
    }
    return _setInterval.apply(window, arguments);
  };

  // Final verification
  try {
    var doc = window.parent.document;
    console.log('[GrokFrameFix] DONE - parent.document OK, frameElement:', window.frameElement);
  } catch (e) {
    console.log('[GrokFrameFix] DONE - parent.document FAILED:', e.message);
  }
})();
