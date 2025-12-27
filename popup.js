// Constants
const API_TIMEOUT = 60000; // 60 seconds timeout for API calls
const MAX_TOKENS = 4096;

// i18n helper function
function i18n(messageName, substitutions) {
  return chrome.i18n.getMessage(messageName, substitutions) || messageName;
}

// Localize page elements with data-i18n attributes
function localizePage() {
  // Localize text content
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageName = element.getAttribute('data-i18n');
    const message = i18n(messageName);
    if (message) {
      element.textContent = message;
    }
  });

  // Localize placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const messageName = element.getAttribute('data-i18n-placeholder');
    const message = i18n(messageName);
    if (message) {
      element.placeholder = message;
    }
  });

  // Localize titles
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const messageName = element.getAttribute('data-i18n-title');
    const message = i18n(messageName);
    if (message) {
      element.title = message;
    }
  });
}

// DOM Elements
const elements = {
  // Panels
  mainPanel: document.getElementById('mainPanel'),
  settingsPanel: document.getElementById('settingsPanel'),
  
  // Buttons
  settingsBtn: document.getElementById('settingsBtn'),
  backBtn: document.getElementById('backBtn'),
  scanPageBtn: document.getElementById('scanPageBtn'),
  summarizeVideoBtn: document.getElementById('summarizeVideoBtn'),
  translateBtn: document.getElementById('translateBtn'),
  translateSelectionBtn: document.getElementById('translateSelectionBtn'),
  sendCustomBtn: document.getElementById('sendCustomBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  copyResultBtn: document.getElementById('copyResultBtn'),
  closeResultBtn: document.getElementById('closeResultBtn'),
  toggleApiKey: document.getElementById('toggleApiKey'),
  
  // Inputs
  customPrompt: document.getElementById('customPrompt'),
  aiProvider: document.getElementById('aiProvider'),
  apiKey: document.getElementById('apiKey'),
  aiModel: document.getElementById('aiModel'),
  targetLang: document.getElementById('targetLang'),
  
  // Sections
  resultSection: document.getElementById('resultSection'),
  resultContent: document.getElementById('resultContent'),
  loadingSection: document.getElementById('loadingSection'),
  loadingText: document.getElementById('loadingText'),
  settingsStatus: document.getElementById('settingsStatus'),
  
  // Model groups
  anthropicModels: document.getElementById('anthropicModels'),
  openaiModels: document.getElementById('openaiModels'),
  geminiModels: document.getElementById('geminiModels')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  localizePage();
  await loadSettings();
  setupEventListeners();
  updateModelVisibility();
});

// Load saved settings
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'aiProvider',
    'apiKey',
    'aiModel',
    'targetLang'
  ]);
  
  if (settings.aiProvider) elements.aiProvider.value = settings.aiProvider;
  if (settings.apiKey) elements.apiKey.value = settings.apiKey;
  if (settings.aiModel) elements.aiModel.value = settings.aiModel;
  if (settings.targetLang) elements.targetLang.value = settings.targetLang;
  
  updateModelVisibility();
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  elements.settingsBtn.addEventListener('click', showSettings);
  elements.backBtn.addEventListener('click', showMain);
  
  // Actions
  elements.scanPageBtn.addEventListener('click', scanPage);
  elements.summarizeVideoBtn.addEventListener('click', summarizeVideo);
  elements.translateBtn.addEventListener('click', translatePage);
  elements.translateSelectionBtn.addEventListener('click', translateSelection);
  elements.sendCustomBtn.addEventListener('click', sendCustomPrompt);
  
  // Settings
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.aiProvider.addEventListener('change', updateModelVisibility);
  elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
  
  // Result
  elements.copyResultBtn.addEventListener('click', copyResult);
  elements.closeResultBtn.addEventListener('click', hideResult);
}

// Panel Navigation
function showSettings() {
  elements.mainPanel.classList.add('hidden');
  elements.settingsPanel.classList.remove('hidden');
}

function showMain() {
  elements.settingsPanel.classList.add('hidden');
  elements.mainPanel.classList.remove('hidden');
}

// Update model visibility based on provider
function updateModelVisibility() {
  const provider = elements.aiProvider.value;

  // Hide all model groups first
  elements.anthropicModels.style.display = 'none';
  elements.openaiModels.style.display = 'none';
  elements.geminiModels.style.display = 'none';

  // Show relevant model group and set default model
  if (provider === 'anthropic') {
    elements.anthropicModels.style.display = '';
    if (!elements.aiModel.value.startsWith('claude')) {
      elements.aiModel.value = 'claude-sonnet-4-20250514';
    }
  } else if (provider === 'openai') {
    elements.openaiModels.style.display = '';
    if (!elements.aiModel.value.startsWith('gpt')) {
      elements.aiModel.value = 'gpt-4o';
    }
  } else if (provider === 'gemini') {
    elements.geminiModels.style.display = '';
    if (!elements.aiModel.value.startsWith('gemini')) {
      elements.aiModel.value = 'gemini-2.0-flash-exp';
    }
  }
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
  const input = elements.apiKey;
  input.type = input.type === 'password' ? 'text' : 'password';
  elements.toggleApiKey.textContent = input.type === 'password' ? '👁️' : '🔒';
}

// Validate API key format
function validateApiKey(provider, apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, message: i18n('errorApiKeyEmpty') };
  }

  if (provider === 'anthropic') {
    if (!apiKey.startsWith('sk-ant-')) {
      return { valid: false, message: i18n('errorApiKeyAnthropicFormat') };
    }
  } else if (provider === 'openai') {
    if (!apiKey.startsWith('sk-')) {
      return { valid: false, message: i18n('errorApiKeyOpenAIFormat') };
    }
  } else if (provider === 'gemini') {
    // Gemini API keys are typically 39 characters
    if (apiKey.length < 30) {
      return { valid: false, message: i18n('errorApiKeyGeminiFormat') };
    }
  }

  return { valid: true };
}

// Save settings
async function saveSettings() {
  const provider = elements.aiProvider.value;
  const apiKey = elements.apiKey.value.trim();

  // Validate API key
  const validation = validateApiKey(provider, apiKey);
  if (!validation.valid) {
    showStatus(validation.message, 'error');
    return;
  }

  const settings = {
    aiProvider: provider,
    apiKey: apiKey,
    aiModel: elements.aiModel.value,
    targetLang: elements.targetLang.value
  };

  await chrome.storage.local.set(settings);

  showStatus(i18n('settingsSaved'), 'success');
}

// Show status message
function showStatus(message, type) {
  elements.settingsStatus.textContent = message;
  elements.settingsStatus.className = `status-message ${type}`;
  elements.settingsStatus.classList.remove('hidden');
  
  setTimeout(() => {
    elements.settingsStatus.classList.add('hidden');
  }, 3000);
}

// Loading state
function showLoading(text = null) {
  elements.loadingText.textContent = text || i18n('processing');
  elements.loadingSection.classList.remove('hidden');
  elements.resultSection.classList.add('hidden');
}

function hideLoading() {
  elements.loadingSection.classList.add('hidden');
}

// Result display
function showResult(content, isError = false) {
  hideLoading();
  elements.resultContent.textContent = content;
  elements.resultContent.className = `result-content ${isError ? 'error' : ''}`;
  elements.resultSection.classList.remove('hidden');
}

function hideResult() {
  elements.resultSection.classList.add('hidden');
}

// Copy result
async function copyResult() {
  await navigator.clipboard.writeText(elements.resultContent.textContent);
  elements.copyResultBtn.textContent = '✓';
  setTimeout(() => {
    elements.copyResultBtn.textContent = '📋';
  }, 1500);
}

// Check settings
async function checkSettings() {
  const settings = await chrome.storage.local.get(['apiKey', 'aiProvider', 'aiModel']);
  if (!settings.apiKey) {
    showResult(i18n('errorEnterApiKey'), true);
    return null;
  }
  return settings;
}

// ===== Main Actions =====

// Scan current page/screenshot
async function scanPage() {
  const settings = await checkSettings();
  if (!settings) return;

  showLoading(i18n('scanningPage'));

  try {
    // Capture visible tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    const customPrompt = elements.customPrompt.value.trim();
    const prompt = customPrompt || i18n('promptAnalyzeScreenshot');

    const response = await sendToAI(settings, prompt, screenshot);
    showResult(response);
  } catch (error) {
    showResult(i18n('errorPrefix', [error.message]), true);
  }
}

// Summarize YouTube video
async function summarizeVideo() {
  const settings = await checkSettings();
  if (!settings) return;

  showLoading(i18n('gettingVideoInfo'));

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('youtube.com/watch')) {
      showResult(i18n('errorYouTubeOnly'), true);
      return;
    }

    // Get video info from content script
    const videoInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });

    if (!videoInfo || !videoInfo.title) {
      showResult(i18n('errorVideoInfo'), true);
      return;
    }

    showLoading(i18n('summarizingVideo'));

    const descPart = videoInfo.description ? `\nDescription: ${videoInfo.description}` : '';
    const transPart = videoInfo.transcript ? `\n\nTranscript:\n${videoInfo.transcript}` : '';

    const prompt = i18n('promptSummarizeVideo', [
      videoInfo.title,
      videoInfo.channel,
      descPart,
      transPart
    ]);

    const response = await sendToAI(settings, prompt);
    showResult(response);
  } catch (error) {
    showResult(i18n('errorPrefix', [error.message]), true);
  }
}

// Translate entire page
async function translatePage() {
  const settings = await checkSettings();
  if (!settings) return;

  showLoading(i18n('gettingPageContent'));

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageContent = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });

    if (!pageContent || !pageContent.text) {
      showResult(i18n('errorPageContent'), true);
      return;
    }

    showLoading(i18n('translating'));

    const targetLang = await chrome.storage.local.get('targetLang');
    const langName = getLanguageName(targetLang.targetLang || 'en');

    const prompt = i18n('promptTranslateTo', [langName, pageContent.text.substring(0, 10000)]);

    const response = await sendToAI(settings, prompt);
    showResult(response);
  } catch (error) {
    showResult(i18n('errorPrefix', [error.message]), true);
  }
}

// Translate selected text
async function translateSelection() {
  const settings = await checkSettings();
  if (!settings) return;

  showLoading(i18n('gettingSelection'));

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const selection = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });

    if (!selection || !selection.text) {
      showResult(i18n('errorSelectText'), true);
      return;
    }

    showLoading(i18n('translating'));

    const targetLang = await chrome.storage.local.get('targetLang');
    const langName = getLanguageName(targetLang.targetLang || 'en');

    const prompt = i18n('promptTranslateTo', [langName, selection.text]);

    const response = await sendToAI(settings, prompt);
    showResult(response);
  } catch (error) {
    showResult(i18n('errorPrefix', [error.message]), true);
  }
}

// Send custom prompt
async function sendCustomPrompt() {
  const settings = await checkSettings();
  if (!settings) return;

  const prompt = elements.customPrompt.value.trim();
  if (!prompt) {
    showResult(i18n('errorEnterPrompt'), true);
    return;
  }

  showLoading(i18n('processing'));

  try {
    // Also capture screenshot for context
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    const response = await sendToAI(settings, prompt, screenshot);
    showResult(response);
  } catch (error) {
    showResult(i18n('errorPrefix', [error.message]), true);
  }
}

// ===== AI API Calls =====

async function sendToAI(settings, prompt, imageBase64 = null) {
  const { aiProvider, apiKey, aiModel } = settings;

  if (aiProvider === 'anthropic') {
    return await callAnthropicAPI(apiKey, aiModel, prompt, imageBase64);
  } else if (aiProvider === 'gemini') {
    return await callGeminiAPI(apiKey, aiModel, prompt, imageBase64);
  } else {
    return await callOpenAIAPI(apiKey, aiModel, prompt, imageBase64);
  }
}

// Anthropic API (with timeout)
async function callAnthropicAPI(apiKey, model, prompt, imageBase64) {
  const content = [];

  if (imageBase64) {
    // Remove data URL prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: base64Data
      }
    });
  }

  content.push({
    type: 'text',
    text: prompt
  });

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: MAX_TOKENS,
        messages: [{
          role: 'user',
          content: content
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || i18n('errorApiGeneric', [response.status]));
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(i18n('errorApiTimeout'));
    }
    throw error;
  }
}

// OpenAI API (with timeout)
async function callOpenAIAPI(apiKey, model, prompt, imageBase64) {
  const content = [];

  content.push({
    type: 'text',
    text: prompt
  });

  if (imageBase64) {
    content.push({
      type: 'image_url',
      image_url: {
        url: imageBase64
      }
    });
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        max_tokens: MAX_TOKENS,
        messages: [{
          role: 'user',
          content: content
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || i18n('errorApiGeneric', [response.status]));
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(i18n('errorApiTimeout'));
    }
    throw error;
  }
}

// Gemini API (with timeout)
async function callGeminiAPI(apiKey, model, prompt, imageBase64) {
  const parts = [];

  if (imageBase64) {
    // Remove data URL prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: base64Data
      }
    });
  }

  parts.push({
    text: prompt
  });

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          maxOutputTokens: MAX_TOKENS
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || i18n('errorApiGeneric', [response.status]));
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(i18n('errorApiTimeout'));
    }
    throw error;
  }
}

// Helper: Get language name (localized)
function getLanguageName(code) {
  const langKeys = {
    'zh-TW': 'langTraditionalChinese',
    'zh-CN': 'langSimplifiedChinese',
    'en': 'langEnglish',
    'ja': 'langJapanese',
    'ko': 'langKorean'
  };
  return i18n(langKeys[code]) || code;
}
