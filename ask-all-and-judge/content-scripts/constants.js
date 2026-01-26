// AI Catalog - Import from shared constants (single source of truth)
import { AI_CATALOG, DEFAULT_SELECTIONS, EXTRA_AI_SERVICES } from '../shared/constants.js';

// Get AI info by hostname
function getAIByHostname(hostname) {
  for (const [aiId, config] of Object.entries(EXTRA_AI_SERVICES)) {
    if (hostname.endsWith(config.hostname)) {
      return aiId;
    }
  }
  return null;
}

// Get all supported AI IDs
function getAllAIIds() {
  return Object.keys(AI_CATALOG);
}

// Get AI config by ID
function getAIConfig(aiId) {
  return AI_CATALOG[aiId] || null;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.AI_CATALOG = AI_CATALOG;
  window.EXTRA_AI_SERVICES = EXTRA_AI_SERVICES;
  window.getAIByHostname = getAIByHostname;
  window.getAllAIIds = getAllAIIds;
  window.getAIConfig = getAIConfig;
  window.DEFAULT_SELECTIONS = DEFAULT_SELECTIONS;
}

console.log('Constants loaded');
