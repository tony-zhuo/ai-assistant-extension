// Content script for page interaction

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations properly
  (async () => {
    try {
      switch (request.action) {
        case 'getVideoInfo':
          sendResponse(getYouTubeVideoInfo());
          break;
        case 'getPageContent':
          sendResponse(getPageContent());
          break;
        case 'getSelection':
          sendResponse(getSelectedText());
          break;
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  })();
  return true; // Required for async sendResponse
});

// Get YouTube video information
function getYouTubeVideoInfo() {
  try {
    // Get video title
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
                         document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                         document.querySelector('#title h1 yt-formatted-string');
    const title = titleElement?.textContent?.trim() || document.title.replace(' - YouTube', '');
    
    // Get channel name
    const channelElement = document.querySelector('#channel-name a') ||
                           document.querySelector('ytd-channel-name a') ||
                           document.querySelector('.ytd-video-owner-renderer #channel-name');
    const channel = channelElement?.textContent?.trim() || 'Unknown';
    
    // Get video description
    const descriptionElement = document.querySelector('#description-inline-expander yt-attributed-string') ||
                               document.querySelector('#description yt-formatted-string') ||
                               document.querySelector('ytd-text-inline-expander #attributed-snippet-text');
    const description = descriptionElement?.textContent?.trim()?.substring(0, 2000) || '';
    
    // Try to get transcript/captions
    const transcript = getYouTubeTranscript();
    
    return {
      title,
      channel,
      description,
      transcript,
      url: window.location.href
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    return {
      title: document.title,
      channel: '',
      description: '',
      transcript: '',
      url: window.location.href
    };
  }
}

// Try to get YouTube transcript
function getYouTubeTranscript() {
  try {
    // Check if transcript panel is open
    const transcriptItems = document.querySelectorAll('ytd-transcript-segment-renderer');
    
    if (transcriptItems.length > 0) {
      const texts = [];
      transcriptItems.forEach(item => {
        const text = item.querySelector('.segment-text')?.textContent?.trim();
        if (text) texts.push(text);
      });
      return texts.join(' ').substring(0, 15000); // Limit transcript length
    }
    
    // Alternative: try to find captions in video player
    const captionWindow = document.querySelector('.ytp-caption-window-container');
    if (captionWindow) {
      return captionWindow.textContent?.trim() || '';
    }
    
    return '';
  } catch (error) {
    console.error('Error getting transcript:', error);
    return '';
  }
}

// Get main page content
function getPageContent() {
  try {
    // Remove script and style elements
    const clone = document.body.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style, noscript, iframe');
    scripts.forEach(el => el.remove());
    
    // Get text content
    let text = clone.textContent || '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Get page metadata
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content || '';
    
    return {
      title,
      description,
      text: text.substring(0, 20000), // Limit content length
      url: window.location.href
    };
  } catch (error) {
    console.error('Error getting page content:', error);
    return {
      title: document.title,
      text: '',
      url: window.location.href
    };
  }
}

// Get selected text
function getSelectedText() {
  try {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    return {
      text: text || '',
      hasSelection: text.length > 0
    };
  } catch (error) {
    console.error('Error getting selection:', error);
    return {
      text: '',
      hasSelection: false
    };
  }
}

// Create floating result panel (XSS-safe)
function createFloatingPanel(content) {
  // Remove existing panel
  const existing = document.getElementById('ai-assistant-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'ai-assistant-panel';

  // Create header safely using DOM methods
  const header = document.createElement('div');
  header.className = 'ai-panel-header';

  const title = document.createElement('span');
  title.textContent = 'AI Assistant';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'ai-panel-close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => panel.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Create content safely using textContent (prevents XSS)
  const contentDiv = document.createElement('div');
  contentDiv.className = 'ai-panel-content';
  contentDiv.textContent = content; // Safe: uses textContent, not innerHTML

  panel.appendChild(header);
  panel.appendChild(contentDiv);
  document.body.appendChild(panel);

  return panel;
}
