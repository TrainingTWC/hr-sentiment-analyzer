# 🎤 HR Sentiment Analyzer Bot

An AI-powered HR conversation bot that conducts real-time voice conversations and provides detailed sentiment analysis. Built specifically for Third Wave Coffee (TWC) HR check-ins with employees.

## ✨ Features

- **🗣️ Real-time Voice Conversations** - Live audio chat with Google Gemini AI
- **📊 8-Axis Sentiment Analysis** - Comprehensive radar chart analysis including:
  - Workload & Staffing
  - Training & Onboarding  
  - Communication Clarity
  - Empowerment & Ownership
  - Manager & Team Dynamics
  - Recognition & Respect
  - Growth & Progression
  - Overall Satisfaction
- **💾 Conversation History** - Local storage with replay functionality
- **📝 Google Sheets Integration** - Automatic logging via Apps Script webhook
- **🔄 New Chat Functionality** - Start fresh conversations easily
- **🎯 Domain-Specific Context** - Tailored for TWC HR scenarios
- **🛡️ Browser Compatibility Detection** - Automatic compatibility checks

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Modern browser (Chrome recommended)
- Microphone access
- Google Gemini API key (free)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd hr-sentiment-analyzer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 🔑 Getting Your Free Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env.local` file

## 📋 Google Sheets Integration (Optional)

To enable automatic conversation logging:

1. **Create a Google Apps Script:**
   - Go to [script.google.com](https://script.google.com)
   - Create a new project
   - Replace the default code with the provided `google-apps-script-logger.js`
   - Deploy as a web app with public access

2. **Configure the webhook:**
   - Copy your Apps Script webhook URL
   - Add it to `.env.local`:
   ```
   GOOGLE_APPS_SCRIPT_WEBHOOK=your_webhook_url_here
   ```

3. **Create Google Sheet:**
   - Create a sheet named "HR Bot Conversations"
   - The script will automatically format headers and data

## 🎯 How to Use

1. **Start Conversation:**
   - Click "Start Conversation" button
   - Allow microphone permissions when prompted
   - Begin speaking naturally

2. **During Conversation:**
   - Speak clearly and naturally
   - The AI will respond with voice and text
   - Real-time transcription appears on screen

3. **End & Analyze:**
   - Click "End Conversation" to stop
   - View detailed sentiment analysis
   - Start new conversations with "New Chat"

## 🛠️ Technical Stack

- **Frontend:** React 19.1.1 + TypeScript
- **AI:** Google Gemini 2.5 Flash with Live API
- **Audio:** Web Audio API + WebRTC
- **Build:** Vite 6.3.6
- **Styling:** Tailwind CSS
- **Storage:** Local Storage + Google Sheets

## 🌐 Browser Compatibility

**Recommended:**
- Google Chrome (best performance)
- Mozilla Firefox
- Safari (macOS)
- Microsoft Edge

**Requirements:**
- Microphone access support
- Web Audio API
- WebSocket support
- HTTPS or localhost

## 📁 Project Structure

```
hr-sentiment-analyzer/
├── components/           # React components
│   ├── ControlPanel.tsx     # Start/Stop controls
│   ├── ConversationView.tsx # Real-time transcript
│   ├── SentimentAnalysisView.tsx # Radar chart
│   └── HistoryPanel.tsx     # Conversation history
├── utils/               # Utility functions
│   ├── audioUtils.ts        # Audio processing
│   └── googleSheetsLogger.ts # Logging integration
├── App.tsx              # Main application
├── types.ts             # TypeScript definitions
├── twc-domain-context.json # Company-specific context
└── google-apps-script-logger.js # Apps Script code
```

## 🔧 Troubleshooting

**"Upgrade Required" Error:**
- Use Google Chrome or Firefox
- Ensure you're on HTTPS or localhost
- Update your browser to latest version

**Microphone Issues:**
- Check browser permissions
- Ensure microphone is not used by other apps
- Try refreshing the page

**API Connection Issues:**
- Verify your Gemini API key is correct
- Check internet connection
- Ensure API key has proper permissions

## 📊 Sentiment Analysis

The bot analyzes conversations across 8 key dimensions:

1. **Workload & Staffing** - Work volume and team capacity
2. **Training & Onboarding** - Learning and development satisfaction  
3. **Communication Clarity** - Information flow and transparency
4. **Empowerment & Ownership** - Autonomy and decision-making
5. **Manager & Team Dynamics** - Relationship quality
6. **Recognition & Respect** - Appreciation and values alignment
7. **Growth & Progression** - Career development opportunities
8. **Overall Satisfaction** - General workplace happiness

Each dimension is scored 1-5 based on conversation sentiment, with visual radar chart representation.

## 🔒 Privacy & Security

- Conversations stored locally in browser
- API keys kept in environment variables
- Optional Google Sheets logging (user-controlled)
- No persistent server-side storage
- GDPR-friendly design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for demonstration purposes. Please ensure compliance with your organization's policies when using AI tools for HR purposes.

## 🎯 TWC-Specific Features

- Domain-locked conversation topics
- TWC program awareness (ZingLearn LMS, RESPECT values, Bench Planning)
- Company-specific entity recognition
- Professional HR conversation flow
- Escalation detection for critical issues

---

**Powered by Google Gemini AI** | Built for Third Wave Coffee HR Operations
