# Google Sheets Integration Setup (Apps Script Method)

This guide will help you set up Google Sheets logging for your HR Bot using Google Apps Script - the most reliable method!

## 🚀 Quick Setup

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. **Important**: Name it exactly **"HR Bot Conversations"** (the Apps Script looks for this specific name)
4. Keep this tab open, you'll need it in Step 3

### Step 2: Create Google Apps Script
1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Replace the default code with the contents of `google-apps-script-logger.js` (provided in your project)
4. Save the project with a name like "HR Bot Logger"

### Step 3: Deploy as Web App
1. In Apps Script, click **"Deploy"** > **"New deployment"**
2. Choose type: **"Web app"**
3. Set description: "HR Bot Conversation Logger"
4. Execute as: **"Me"**
5. Who has access: **"Anyone"** (this is safe as we're only accepting specific data)
6. Click **"Deploy"**
7. **Copy the Web app URL** (it looks like: `https://script.google.com/macros/s/ABC123.../exec`)
8. Click **"Authorize access"** and allow permissions

### Step 4: Link to Your Spreadsheet
1. Go back to your Google Sheet from Step 1
2. In Apps Script, click **"Resources"** > **"Cloud Platform project"**
3. Or simply run the `initializeSpreadsheet()` function once to set up headers

### Step 5: Configure Your Bot
1. Open your `.env.local` file
2. Add your webhook URL:
```bash
GOOGLE_APPS_SCRIPT_WEBHOOK=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
3. Replace `YOUR_SCRIPT_ID` with your actual script ID

### Step 6: Test the Setup
1. Restart your development server: `npm run dev`
2. Start a conversation in your HR bot
3. Complete the conversation and check your Google Sheet
4. You should see the data automatically logged!

## 📋 **Apps Script Features:**

✅ **Automatic Headers**: Creates proper column headers automatically  
✅ **Data Formatting**: Applies colors based on sentiment scores  
✅ **Error Handling**: Robust error handling and logging  
✅ **No API Keys Needed**: Uses your Google account permissions  
✅ **Always Available**: 99.9% uptime with Google's infrastructure  
✅ **Secure**: Only accepts the specific data format from your bot  

## 🔧 **Apps Script Code Features:**

The provided script includes:

1. **doPost()**: Handles incoming conversation data
2. **doGet()**: Provides a health check endpoint
3. **logConversation()**: Main logging logic with data validation
4. **createHeaders()**: Sets up the spreadsheet with proper formatting
5. **formatRow()**: Applies conditional formatting for readability
6. **testLogging()**: Test function to verify everything works
7. **initializeSpreadsheet()**: One-time setup function

## 📊 **Data Structure Logged:**

Each conversation logs:
- **Timestamp**: When the conversation occurred
- **Conversation ID**: Unique identifier
- **Full Transcript**: Complete conversation text
- **Analysis Data**: Themes, entities, programs, escalations
- **Sentiment Scores**: All 8 radar axes (1-5 scale with color coding)
- **Retention Intent**: Color-coded prediction
- **Final Comment**: AI's summary
- **Technical Data**: User agent, session ID

## 🎨 **Automatic Formatting:**

- **Headers**: Bold, blue background with white text
- **Scores 4-5**: Green background (positive)
- **Scores 1-2**: Red background (negative)  
- **Score 3**: Yellow background (neutral)
- **High Retention**: Green background
- **Low Retention**: Red background
- **Alternating Rows**: For better readability

## 🛠️ **Troubleshooting:**

### Common Issues:

1. **"Authorization Required"**: Re-deploy the web app and authorize permissions
2. **"Script not found"**: Check that the webhook URL is correct
3. **"No data appearing"**: Verify the bot is sending POST requests to the webhook
4. **"Permission denied"**: Make sure web app has "Anyone" access

### Testing the Connection:

1. **In Apps Script**: Run the `testLogging()` function manually
2. **In Browser**: Visit your webhook URL (should show a health check message)
3. **In Console**: Check browser console for success/error messages

### Debug Mode:

Add this to your Apps Script for debugging:
```javascript
function doPost(e) {
  console.log('Received data:', e.postData.contents);
  // ... rest of your code
}
```

## 🔒 **Security Notes:**

- The webhook only accepts POST requests with specific data structure
- Uses your Google account permissions (not public API keys)
- Data stays within your Google account
- Can restrict access by changing deployment settings

## 🚀 **Advanced Options:**

### Multiple Sheets:
Modify the script to log to different sheets based on data:
```javascript
// In logConversation function:
const sheetName = data.department || 'General';
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
```

### Email Notifications:
Add email alerts for escalations:
```javascript
if (data.escalations && data.escalations.length > 0) {
  MailApp.sendEmail({
    to: 'hr@company.com',
    subject: 'HR Bot Escalation Alert',
    body: `Escalation detected: ${data.escalations.join(', ')}`
  });
}
```

### Data Validation:
The script automatically validates incoming data and handles missing fields gracefully.

## ✅ **Why Apps Script is Better:**

1. **No API Key Management**: Uses OAuth, more secure
2. **Better Error Handling**: Google's robust infrastructure
3. **Automatic Formatting**: Professional-looking sheets
4. **Built-in Analytics**: Easy to add charts and analysis
5. **Email Integration**: Can send notifications
6. **Version Control**: Apps Script has built-in version history
7. **Free Tier**: Generous limits for typical usage

Your HR bot will now reliably log all conversations to Google Sheets! 🎉