// Constants
const API_TIMEOUT = 60000; // 60 seconds timeout for API calls
const MAX_TOKENS = 4096;

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
  openaiModels: document.getElementById('openaiModels')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
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
  const anthropicOptions = elements.anthropicModels.querySelectorAll('option');
  const openaiOptions = elements.openaiModels.querySelectorAll('option');
  
  if (provider === 'anthropic') {
    elements.anthropicModels.style.display = '';
    elements.openaiModels.style.display = 'none';
    // Select first Anthropic model if current selection is OpenAI
    if (elements.aiModel.value.startsWith('gpt')) {
      elements.aiModel.value = 'claude-sonnet-4-20250514';
    }
  } else {
    elements.anthropicModels.style.display = 'none';
    elements.openaiModels.style.display = '';
    // Select first OpenAI model if current selection is Claude
    if (elements.aiModel.value.startsWith('claude')) {
      elements.aiModel.value = 'gpt-4o';
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
    return { valid: false, message: 'API Key 不能為空' };
  }

  if (provider === 'anthropic') {
    if (!apiKey.startsWith('sk-ant-')) {
      return { valid: false, message: 'Anthropic API Key 應該以 sk-ant- 開頭' };
    }
  } else if (provider === 'openai') {
    if (!apiKey.startsWith('sk-')) {
      return { valid: false, message: 'OpenAI API Key 應該以 sk- 開頭' };
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

  showStatus('設定已儲存！', 'success');
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
function showLoading(text = '處理中...') {
  elements.loadingText.textContent = text;
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
    showResult('請先在設定中輸入你的 API Key', true);
    return null;
  }
  return settings;
}

// ===== Main Actions =====

// Scan current page/screenshot
async function scanPage() {
  const settings = await checkSettings();
  if (!settings) return;
  
  showLoading('正在掃描畫面...');
  
  try {
    // Capture visible tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    const customPrompt = elements.customPrompt.value.trim();
    const prompt = customPrompt || '請分析這張截圖中的內容，描述你看到的重要資訊。';
    
    const response = await sendToAI(settings, prompt, screenshot);
    showResult(response);
  } catch (error) {
    showResult(`錯誤：${error.message}`, true);
  }
}

// Summarize YouTube video
async function summarizeVideo() {
  const settings = await checkSettings();
  if (!settings) return;
  
  showLoading('正在取得影片資訊...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('youtube.com/watch')) {
      showResult('請在 YouTube 影片頁面使用此功能', true);
      return;
    }
    
    // Get video info from content script
    const videoInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });
    
    if (!videoInfo || !videoInfo.title) {
      showResult('無法取得影片資訊，請確認頁面已完全載入', true);
      return;
    }
    
    showLoading('正在總結影片...');
    
    let prompt = `請總結以下 YouTube 影片的內容：

標題：${videoInfo.title}
頻道：${videoInfo.channel}
`;

    if (videoInfo.description) {
      prompt += `\n描述：${videoInfo.description}`;
    }

    if (videoInfo.transcript) {
      prompt += `\n\n字幕內容：\n${videoInfo.transcript}`;
    }

    prompt += `\n\n請提供：
1. 影片主要內容摘要
2. 重點整理（條列式）
3. 關鍵結論或重點`;

    const response = await sendToAI(settings, prompt);
    showResult(response);
  } catch (error) {
    showResult(`錯誤：${error.message}`, true);
  }
}

// Translate entire page
async function translatePage() {
  const settings = await checkSettings();
  if (!settings) return;
  
  showLoading('正在取得頁面內容...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageContent = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
    
    if (!pageContent || !pageContent.text) {
      showResult('無法取得頁面內容', true);
      return;
    }
    
    showLoading('正在翻譯...');
    
    const targetLang = await chrome.storage.local.get('targetLang');
    const langName = getLanguageName(targetLang.targetLang || 'zh-TW');
    
    const prompt = `請將以下內容翻譯成${langName}：

${pageContent.text.substring(0, 10000)}`;

    const response = await sendToAI(settings, prompt);
    showResult(response);
  } catch (error) {
    showResult(`錯誤：${error.message}`, true);
  }
}

// Translate selected text
async function translateSelection() {
  const settings = await checkSettings();
  if (!settings) return;
  
  showLoading('正在取得選取內容...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const selection = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
    
    if (!selection || !selection.text) {
      showResult('請先選取要翻譯的文字', true);
      return;
    }
    
    showLoading('正在翻譯...');
    
    const targetLang = await chrome.storage.local.get('targetLang');
    const langName = getLanguageName(targetLang.targetLang || 'zh-TW');
    
    const prompt = `請將以下內容翻譯成${langName}：

${selection.text}`;

    const response = await sendToAI(settings, prompt);
    showResult(response);
  } catch (error) {
    showResult(`錯誤：${error.message}`, true);
  }
}

// Send custom prompt
async function sendCustomPrompt() {
  const settings = await checkSettings();
  if (!settings) return;
  
  const prompt = elements.customPrompt.value.trim();
  if (!prompt) {
    showResult('請輸入指令', true);
    return;
  }
  
  showLoading('處理中...');
  
  try {
    // Also capture screenshot for context
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    const response = await sendToAI(settings, prompt, screenshot);
    showResult(response);
  } catch (error) {
    showResult(`錯誤：${error.message}`, true);
  }
}

// ===== AI API Calls =====

async function sendToAI(settings, prompt, imageBase64 = null) {
  const { aiProvider, apiKey, aiModel } = settings;
  
  if (aiProvider === 'anthropic') {
    return await callAnthropicAPI(apiKey, aiModel, prompt, imageBase64);
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
      throw new Error(error.error?.message || `API 錯誤：${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('API 請求超時，請重試');
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
      throw new Error(error.error?.message || `API 錯誤：${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('API 請求超時，請重試');
    }
    throw error;
  }
}

// Helper: Get language name
function getLanguageName(code) {
  const languages = {
    'zh-TW': '繁體中文',
    'zh-CN': '簡體中文',
    'en': '英文',
    'ja': '日文',
    'ko': '韓文'
  };
  return languages[code] || code;
}
