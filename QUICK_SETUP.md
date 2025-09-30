# Google Apps Script Setup - Simple Steps

## 📋 **What You Need to Do:**

### 1. Create Google Sheet
- Go to [Google Sheets](https://sheets.google.com) 
- Create new spreadsheet
- **Important**: Name it exactly **"HR Bot Conversations"**

### 2. Create Apps Script
- Go to [Google Apps Script](https://script.google.com)
- Click "New Project"
- Delete default code
- Copy and paste ALL the code from `google-apps-script-logger.js`
- Save project as "HR Bot Logger"

### 3. Deploy as Web App
- Click "Deploy" → "New deployment"
- Type: "Web app"
- Execute as: "Me"
- Who has access: "Anyone"
- Click "Deploy"
- **COPY THE WEB APP URL** (looks like: `https://script.google.com/macros/s/ABC123.../exec`)
- Allow permissions when prompted

### 4. Add URL to Your Bot
- Open `.env.local` file in your project
- Add this line:
```
GOOGLE_APPS_SCRIPT_WEBHOOK=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
- Replace `YOUR_SCRIPT_ID` with your actual URL

### 5. Test It
- Restart your bot: `npm run dev`
- Have a conversation
- Check your Google Sheet - data should appear automatically!

## ✅ **That's It!**

Your conversations will now automatically log to Google Sheets with:
- Full transcript
- Sentiment scores with color coding
- Themes and analysis
- Professional formatting

The Apps Script will handle everything automatically - no API keys needed!