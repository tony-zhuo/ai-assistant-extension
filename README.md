# AI Assistant Chrome Extension

<p align="center">
  <img src="icons/icon128.png" alt="AI Assistant Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Integrate AI assistants into your browser to boost daily productivity</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/manifest-v3-green.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#supported-ai-models">AI Models</a> •
  <a href="#privacy--security">Privacy</a>
</p>

---

## Preview

<!-- Add extension screenshots here -->
<!-- ![Screenshot](screenshots/demo.png) -->

> Screenshots coming soon

---

## Features

### Core Features

| Feature | Description |
|:---:|:---|
| 📸 **Scan Page** | Capture visible screen and analyze content with AI |
| 🎬 **Summarize Video** | Auto-extract YouTube video info and captions to generate summaries |
| 🌐 **Translate Page** | Translate entire webpage content to a target language |
| ✏️ **Translate Selection** | Quickly translate selected text |
| 💬 **Custom Prompt** | Send any instruction with a screenshot for AI processing |

### Context Menu

- **Translate Selection** - Right-click on selected text for quick translation
- **Explain Selection** - Let AI explain the selected content
- **Analyze Image** - Right-click on any image for AI analysis
- **Summarize Page** - Right-click on blank area to summarize the entire page

### Supported Languages

🇹🇼 Traditional Chinese | 🇨🇳 Simplified Chinese | 🇺🇸 English | 🇯🇵 Japanese | 🇰🇷 Korean

---

## Installation

### Method: Manual Load (Developer Mode)

1. **Download the project**
   ```bash
   git clone https://github.com/yourusername/ai-assistant-extension.git
   ```
   Or download ZIP and extract

2. **Open Chrome Extensions page**
   - Enter `chrome://extensions/` in the address bar
   - Or navigate via menu: `⋮` → `Extensions` → `Manage Extensions`

3. **Enable Developer Mode**
   - Toggle on "Developer mode" in the top right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `ai-assistant-extension` folder

5. **Done!**
   - The extension icon will appear in your browser toolbar

---

## Usage

### Initial Setup

1. Click the extension icon 🤖 in the toolbar
2. Click the gear icon ⚙️ in the top right to open settings
3. Configure the following:

| Setting | Description |
|---------|-------------|
| AI Provider | Choose Anthropic (Claude) or OpenAI (GPT) |
| API Key | Enter your API key |
| Model | Select the AI model to use |
| Target Language | Choose default translation language |

4. Click "Save Settings"

### Getting API Keys

<details>
<summary><strong>Anthropic (Claude)</strong></summary>

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to `API Keys` page
4. Click `Create Key` to generate a new key
5. Copy the key and paste it in the extension settings

</details>

<details>
<summary><strong>OpenAI (GPT)</strong></summary>

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to `API Keys` page
4. Click `Create new secret key`
5. Copy the key and paste it in the extension settings

</details>

### Feature Guide

#### 📸 Scan Page
Click "Scan Page" button to capture the visible area and send it to AI for analysis.

#### 🎬 Summarize Video
On a YouTube video page, click "Summarize Video" to auto-extract:
- Video title and channel info
- Video description
- Captions/Transcript (if available)

#### 🌐 Translate Page
Click "Translate Page" to translate the main text content of the page.

#### ✏️ Translate Selection
Select text on the webpage first, then click "Translate Selection".

#### 💬 Custom Prompt
Enter any instruction in the text box and click "Send" to process with the current screenshot.

---

## Supported AI Models

### Anthropic (Claude)

| Model | Model ID | Description |
|-------|----------|-------------|
| **Claude Sonnet 4** ⭐ | `claude-sonnet-4-20250514` | Recommended - Balance of speed and quality |
| Claude Opus 4 | `claude-opus-4-0-20250514` | Most powerful reasoning capabilities |
| Claude 3.5 Sonnet | `claude-3-5-sonnet-20241022` | Excellent multitasking ability |
| Claude 3.5 Haiku | `claude-3-5-haiku-20241022` | Fast response, lower cost |

### OpenAI (GPT)

| Model | Model ID | Description |
|-------|----------|-------------|
| **GPT-4o** ⭐ | `gpt-4o` | Recommended - Latest multimodal model |
| GPT-4o Mini | `gpt-4o-mini` | Lightweight version, lower cost |
| GPT-4 Turbo | `gpt-4-turbo` | Strong vision understanding |

---

## Project Structure

```
ai-assistant-extension/
├── manifest.json       # Extension config (Manifest V3)
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── popup.css           # Popup styles
├── background.js       # Service Worker (API requests)
├── content.js          # Content Script (page interaction)
├── content.css         # Injected page styles
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Documentation
```

---

## Privacy & Security

### Data Handling

- ✅ **Local Storage** - API keys are only stored in browser's `chrome.storage.local`
- ✅ **Direct Communication** - Data is transmitted only between your browser and chosen AI service
- ✅ **No Server** - Extension has no backend server, no data is collected
- ✅ **Open Source** - Code is fully open for review

### Permission Explanation

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for screenshots and content reading |
| `storage` | Store settings and API keys |
| `scripting` | Execute content scripts on pages |
| `contextMenus` | Create right-click menu features |

---

## Troubleshooting

<details>
<summary><strong>❌ API Error / Connection Failed</strong></summary>

- Verify API key is entered correctly
- Check API account balance
- Confirm the selected model is available
- Check network connection

</details>

<details>
<summary><strong>❌ Cannot Scan Page</strong></summary>

- Chrome system pages (e.g., `chrome://`) cannot be captured
- Ensure the page is fully loaded
- Try refreshing the page

</details>

<details>
<summary><strong>❌ YouTube Summary Incomplete</strong></summary>

- Confirm the video has captions or auto-generated transcript
- Try enabling "Show captions" feature
- Some videos may restrict caption access

</details>

<details>
<summary><strong>❌ Poor Translation Results</strong></summary>

- Try switching to a different AI model
- Use more powerful models (e.g., Claude Sonnet 4 or GPT-4o)
- Verify the correct target language is selected

</details>

---

## Important Notes

> ⚠️ **API Costs**
> Using AI APIs incurs costs. Monitor your usage and set budget limits.

> 🔐 **API Key Security**
> Never share your API key. If you suspect a leak, revoke and regenerate it immediately in the provider's dashboard.

> 🖼️ **Vision Capability**
> Scan page and image analysis features require models with vision support.

---

## Technical Specifications

- **Manifest Version**: V3
- **Minimum Chrome Version**: 88+
- **Language**: JavaScript (Vanilla)
- **API Protocol**: REST (Anthropic & OpenAI API)

---

## Contributing

Issues and Pull Requests are welcome!

1. Fork this project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Changelog

### v1.0.0 (2024)
- 🎉 Initial release
- ✨ Support for Anthropic (Claude) and OpenAI (GPT)
- 📸 Scan page feature
- 🎬 YouTube video summarization
- 🌐 Page translation
- ✏️ Selection translation
- 📋 Context menu integration

---

<p align="center">
  Made with ❤️ for productivity
</p>

<p align="center">
  <a href="#ai-assistant-chrome-extension">⬆️ Back to top</a>
</p>
