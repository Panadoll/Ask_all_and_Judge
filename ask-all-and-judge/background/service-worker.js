// Background Service Worker - Coordinates iframe content scripts

const EXTENSION_ORIGIN = chrome.runtime.getURL('');

// AI IDs that are supported by the extension
const AI_LIST = [
  'chatgpt',
  'claude',
  'gemini',
  'qwen',
  'deepseek',
  'doubao',
  'grok'
];

// Get AI frame state template
function createAIFrames() {
  const frames = {};
  AI_LIST.forEach(aiName => {
    frames[aiName] = { tabId: null, frameId: null, ready: false };
  });
  return frames;
}

// Allow iframe embedding by modifying response headers.
// Key insight (from ChatBrawl): SET CSP to allow chrome-extension, don't just remove it.
// This tells the browser the embedding is legitimate, preventing SecurityError.
const FRAME_CSP_VALUE = "frame-ancestors 'self' chrome-extension://* moz-extension://*";

function ensureNetRequestRules() {
  console.log('Setting up declarativeNetRequest rules...');

  const sites = [
    { id: 1, filter: '||chatgpt.com/*' },
    { id: 2, filter: '||chat.openai.com/*' },
    { id: 3, filter: '||claude.ai/*' },
    { id: 4, filter: '||gemini.google.com/*' },
    { id: 5, filter: '||chat.qwen.ai/*' },
    { id: 6, filter: '||www.doubao.com/*' },
    { id: 7, filter: '||doubao.com/*' },
    { id: 8, filter: '||chat.deepseek.com/*' },
    { id: 9, filter: '||grok.com/*' },
    { id: 10, filter: '||grokusercontent.com/*' }
  ];

  const rules = sites.map(site => ({
    id: site.id,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { header: 'X-Frame-Options', operation: 'remove' },
        { header: 'Frame-Options', operation: 'remove' },
        { header: 'Content-Security-Policy', operation: 'set', value: FRAME_CSP_VALUE }
      ]
    },
    condition: {
      urlFilter: site.filter,
      resourceTypes: ['sub_frame']
    }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  });

  console.log('declarativeNetRequest rules configured:', rules.length, 'rules');
}


// Register rules on install/update AND on every service worker startup
chrome.runtime.onInstalled.addListener(() => ensureNetRequestRules());
ensureNetRequestRules();

// Extension page tab
let extensionTabId = null;

// Iframe targets for each AI (initialized from shared constants)
const aiFrames = createAIFrames();

const activePorts = new Set();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ui') return;
  activePorts.add(port);

  // Immediately send current status to newly connected UI
  port.postMessage({
    type: 'STATUS_UPDATE',
    status: getFramesStatus()
  });

  port.onDisconnect.addListener(() => activePorts.delete(port));
});

async function resetFrames() {
  Object.keys(aiFrames).forEach(aiName => {
    aiFrames[aiName].tabId = null;
    aiFrames[aiName].frameId = null;
    aiFrames[aiName].ready = false;
  });
  await chrome.storage.local.set({ aiFrames });
}

function isExtensionTab(tab) {
  return !!tab && typeof tab.url === 'string' && tab.url.startsWith(EXTENSION_ORIGIN);
}

async function updateFrame(aiName, sender) {
  if (!sender.tab || !isExtensionTab(sender.tab)) return false;

  if (!extensionTabId) {
    extensionTabId = sender.tab.id;
    await chrome.storage.local.set({ extensionTabId });
  }

  if (extensionTabId !== sender.tab.id) return false;

  const frameId = sender.frameId;
  Object.keys(aiFrames).forEach((key) => {
    if (key !== aiName && aiFrames[key].frameId === frameId) {
      aiFrames[key].tabId = null;
      aiFrames[key].frameId = null;
      aiFrames[key].ready = false;
    }
  });

  aiFrames[aiName].tabId = sender.tab.id;
  aiFrames[aiName].frameId = frameId;
  aiFrames[aiName].ready = true;

  await chrome.storage.local.set({ aiFrames });
  return true;
}

function getFramesStatus() {
  const status = {};
  Object.keys(aiFrames).forEach(aiName => {
    status[aiName] = {
      ready: aiFrames[aiName].ready,
      tabId: aiFrames[aiName].tabId,
      frameId: aiFrames[aiName].frameId
    };
  });
  return status;
}

async function notifyExtensionPage(message) {
  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.log('Could not notify extension page:', error.message);
  }
}

async function sendQueryToAll(query, targets = []) {
  // Ensure state is restored from storage if service worker was restarted
  if (!extensionTabId || Object.values(aiFrames).every(f => !f.ready)) {
    const result = await chrome.storage.local.get(['extensionTabId', 'aiFrames']);
    if (result.extensionTabId) {
      extensionTabId = result.extensionTabId;
    }
    if (result.aiFrames) {
      Object.assign(aiFrames, result.aiFrames);
    }
    console.log('State restored in sendQueryToAll:', { extensionTabId, aiFrames });
  }

  const targetSet = new Set(targets);
  const entries = await Promise.all(
    Object.entries(aiFrames).map(async ([aiName, target]) => {
      if (targets.length > 0 && !targetSet.has(aiName)) {
        return [aiName, { success: false, error: 'Not selected' }];
      }
      if (!target.ready || target.tabId === null || target.frameId === null) {
        return [aiName, { success: false, error: 'Frame not ready' }];
      }

      try {
        await chrome.tabs.sendMessage(
          target.tabId,
          { type: 'INJECT_QUERY', query },
          { frameId: target.frameId }
        );
        return [aiName, { success: true }];
      } catch (error) {
        return [aiName, { success: false, error: error.message }];
      }
    })
  );

  return Object.fromEntries(entries);
}

// Open extension page when icon clicked
chrome.action.onClicked.addListener(async () => {
  console.log('Extension icon clicked');

  if (extensionTabId) {
    try {
      await chrome.tabs.get(extensionTabId);
      await chrome.tabs.update(extensionTabId, { active: true });
      return;
    } catch (e) {
      extensionTabId = null;
    }
  }

  const tab = await chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });

  extensionTabId = tab.id;
  await chrome.storage.local.set({ extensionTabId });
  await resetFrames();
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === extensionTabId) {
    extensionTabId = null;
    await chrome.storage.local.remove(['extensionTabId']);
    await resetFrames();
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type, sender);

  (async () => {
    try {
      switch (message.type) {
        case 'REGISTER_EXTENSION_TAB':
          extensionTabId = message.tabId || extensionTabId;
          await chrome.storage.local.set({ extensionTabId });
          await resetFrames();
          sendResponse({ success: true });
          break;

        case 'SEND_QUERY':
          if (!message.query) {
            sendResponse({ success: false, error: 'Missing query' });
            break;
          }
          const results = await sendQueryToAll(message.query, message.targets || []);
          sendResponse({ success: true, results });
          break;

        case 'GET_STATUS':
          // Ensure state is restored before returning status
          if (!extensionTabId || Object.values(aiFrames).every(f => !f.ready)) {
            const result = await chrome.storage.local.get(['extensionTabId', 'aiFrames']);
            if (result.extensionTabId) {
              extensionTabId = result.extensionTabId;
            }
            if (result.aiFrames) {
              Object.assign(aiFrames, result.aiFrames);
            }
          }
          sendResponse({ success: true, status: getFramesStatus() });
          break;

        case 'CONTENT_READY':
          if (aiFrames[message.aiName]) {
            if (message.isRootFrame === false) {
              sendResponse({ success: true, ignored: true });
              break;
            }
            const updated = await updateFrame(message.aiName, sender);
            if (updated) {
              await notifyExtensionPage({
                type: 'STATUS_UPDATE',
                status: getFramesStatus()
              });
            }
          }
          sendResponse({ success: true });
          break;

        case 'ERROR':
          if (message.aiName && message.error) {
            await notifyExtensionPage({
              type: 'ERROR',
              aiName: message.aiName,
              error: message.error
            });
          }
          sendResponse({ success: true });
          break;

        case 'RESPONSE_READY':
        case 'RESPONSE_UPDATE':
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});

console.log('Background service worker loaded');

// Restore state when service worker starts/restarts
(async function restoreState() {
  try {
    const result = await chrome.storage.local.get(['extensionTabId', 'aiFrames']);

    if (result.extensionTabId) {
      extensionTabId = result.extensionTabId;
      console.log('Restored extensionTabId:', extensionTabId);
    }

    if (result.aiFrames) {
      Object.assign(aiFrames, result.aiFrames);
      console.log('Restored aiFrames:', aiFrames);

      // Notify all connected UIs about restored state
      const statusMessage = {
        type: 'STATUS_UPDATE',
        status: getFramesStatus()
      };

      // Send through both channels
      await notifyExtensionPage(statusMessage);

      // Also send through ports
      activePorts.forEach(port => {
        try {
          port.postMessage(statusMessage);
        } catch (error) {
          console.log('Could not notify port:', error.message);
          activePorts.delete(port);
        }
      });
    }
  } catch (error) {
    console.error('Failed to restore state:', error);
  }
})();
