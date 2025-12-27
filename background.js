// Background service worker

// Constants
const API_TIMEOUT = 60000; // 60 seconds timeout for API calls
const MAX_TOKENS = 4096;

// Helper: Escape HTML to prevent XSS (service worker compatible)
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for selected text
  chrome.contextMenus.create({
    id: 'translateSelection',
    title: '用 AI 翻譯選取文字',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'explainSelection',
    title: '用 AI 解釋選取內容',
    contexts: ['selection']
  });
  
  // Context menu for images
  chrome.contextMenus.create({
    id: 'analyzeImage',
    title: '用 AI 分析圖片',
    contexts: ['image']
  });
  
  // Context menu for pages
  chrome.contextMenus.create({
    id: 'summarizePage',
    title: '用 AI 總結此頁面',
    contexts: ['page']
  });
  
  console.log('AI Assistant extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await chrome.storage.local.get(['apiKey', 'aiProvider', 'aiModel', 'targetLang']);
  
  if (!settings.apiKey) {
    // Open popup to configure settings
    chrome.action.openPopup();
    return;
  }
  
  switch (info.menuItemId) {
    case 'translateSelection':
      await handleTranslateSelection(info.selectionText, settings, tab);
      break;
    case 'explainSelection':
      await handleExplainSelection(info.selectionText, settings, tab);
      break;
    case 'analyzeImage':
      await handleAnalyzeImage(info.srcUrl, settings, tab);
      break;
    case 'summarizePage':
      await handleSummarizePage(settings, tab);
      break;
  }
});

// Handle translate selection
async function handleTranslateSelection(text, settings, tab) {
  const langName = getLanguageName(settings.targetLang || 'zh-TW');
  const prompt = `請將以下內容翻譯成${langName}：\n\n${text}`;
  
  try {
    const response = await callAI(settings, prompt);
    await showResultInPage(tab.id, response);
  } catch (error) {
    await showResultInPage(tab.id, `錯誤：${error.message}`, true);
  }
}

// Handle explain selection
async function handleExplainSelection(text, settings, tab) {
  const prompt = `請解釋以下內容，用簡潔易懂的方式說明：\n\n${text}`;
  
  try {
    const response = await callAI(settings, prompt);
    await showResultInPage(tab.id, response);
  } catch (error) {
    await showResultInPage(tab.id, `錯誤：${error.message}`, true);
  }
}

// Handle analyze image
async function handleAnalyzeImage(imageUrl, settings, tab) {
  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    
    const prompt = '請分析這張圖片，描述你看到的內容和重要細節。';
    const aiResponse = await callAI(settings, prompt, base64);
    await showResultInPage(tab.id, aiResponse);
  } catch (error) {
    await showResultInPage(tab.id, `錯誤：${error.message}`, true);
  }
}

// Handle summarize page
async function handleSummarizePage(settings, tab) {
  try {
    // Get page content from content script
    const pageContent = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
    
    const prompt = `請總結以下網頁內容的重點：

標題：${pageContent.title}
內容：${pageContent.text.substring(0, 10000)}`;
    
    const response = await callAI(settings, prompt);
    await showResultInPage(tab.id, response);
  } catch (error) {
    await showResultInPage(tab.id, `錯誤：${error.message}`, true);
  }
}

// Call AI API
async function callAI(settings, prompt, imageBase64 = null) {
  const { aiProvider, apiKey, aiModel } = settings;
  
  if (aiProvider === 'anthropic' || aiProvider === undefined) {
    return await callAnthropicAPI(apiKey, aiModel || 'claude-sonnet-4-20250514', prompt, imageBase64);
  } else {
    return await callOpenAIAPI(apiKey, aiModel || 'gpt-4o', prompt, imageBase64);
  }
}

// Anthropic API (with timeout and required headers)
async function callAnthropicAPI(apiKey, model, prompt, imageBase64) {
  const content = [];

  if (imageBase64) {
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
      image_url: { url: imageBase64 }
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

// Show result in page (XSS-safe)
async function showResultInPage(tabId, content, isError = false) {
  // Escape HTML before passing to the page
  const safeContent = escapeHtml(content);

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (text, error) => {
      // Remove existing panel
      const existing = document.getElementById('ai-assistant-panel');
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = 'ai-assistant-panel';
      panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        max-height: 400px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: ${error ? '#ff5252' : '#e8e8e8'};
        overflow: hidden;
      `;

      // Create elements safely instead of using innerHTML with user content
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.1);';

      const title = document.createElement('span');
      title.style.cssText = 'font-weight: 600; font-size: 14px; background: linear-gradient(90deg, #00d9ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent;';
      title.textContent = 'AI Assistant';

      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = 'background: transparent; border: none; color: #888; font-size: 16px; cursor: pointer; padding: 4px 8px;';
      closeBtn.textContent = '✕';
      closeBtn.onclick = () => panel.remove();

      header.appendChild(title);
      header.appendChild(closeBtn);

      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'padding: 16px; max-height: 300px; overflow-y: auto; font-size: 14px; line-height: 1.6; white-space: pre-wrap;';
      contentDiv.textContent = text; // Safe: uses textContent, not innerHTML

      panel.appendChild(header);
      panel.appendChild(contentDiv);
      document.body.appendChild(panel);
    },
    args: [safeContent, isError]
  });
}

// Helper: Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
