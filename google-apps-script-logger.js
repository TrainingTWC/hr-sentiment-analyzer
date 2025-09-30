/**
 * COMBINED APPS SCRIPT - Training Checklist + HR Bot Conversation Logger
 * Updated to handle both training audit data and HR bot conversations
 */

function doPost(e) {
  try {
    // Check if this is HR Bot conversation data vs Training data
    var params = (e && e.parameter) ? e.parameter : {};
    var postData = null;
    
    // Try to parse JSON data (for HR Bot)
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        console.log('Detected HR Bot conversation data');
        return handleHRBotLogging(postData);
      } catch (jsonError) {
        console.log('Not JSON data, treating as training form data');
      }
    }
    
    // If not JSON, treat as training checklist data
    console.log('Processing training checklist data');
    return handleTrainingChecklistLogging(params);
    
  } catch (err) {
    console.error('Error in doPost:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: err.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HR Bot conversation logging
 */
function handleHRBotLogging(data) {
  try {
    // Get or create HR Bot Conversations sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('HR Bot Conversations');
    
    if (!sheet) {
      sheet = ss.insertSheet('HR Bot Conversations');
      console.log('Created new HR Bot Conversations sheet');
    }
    
    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      createHRBotHeaders(sheet);
    }
    
    // Prepare HR Bot conversation data
    var fullTranscript = data.fullTranscript || '';
    var rowData = [
      data.timestamp || new Date().toISOString(),
      data.conversationId || Date.now(),
      fullTranscript,
      (data.themes || []).join(', '),
      (data.entities?.people_mentioned || []).join(', '),
      (data.entities?.stores_mentioned || []).join(', '),
      (data.programs || []).join(', '),
      (data.escalations || []).join(', '),
      data.overall?.radar_axes?.workload_staffing || null,
      data.overall?.radar_axes?.training_onboarding || null,
      data.overall?.radar_axes?.communication_clarity || null,
      data.overall?.radar_axes?.empowerment_ownership || null,
      data.overall?.radar_axes?.manager_team_dynamics || null,
      data.overall?.radar_axes?.recognition_respect || null,
      data.overall?.radar_axes?.growth_progression || null,
      data.overall?.radar_axes?.overall_satisfaction || null,
      data.overall?.retention_intent_12mo || null,
      data.overall?.final_comment || '',
      data.userAgent || '',
      data.sessionId || ''
    ];
    
    // Add the row
    sheet.appendRow(rowData);
    
    // Format the new row
    var lastRow = sheet.getLastRow();
    formatHRBotRow(sheet, lastRow);
    
    console.log('HR Bot conversation logged successfully at row ' + lastRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'HR Bot conversation logged successfully',
        rowNumber: lastRow
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in handleHRBotLogging:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle Training Checklist logging (existing functionality)
 */
function handleTrainingChecklistLogging(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Try to find existing training sheet or create new one
  var possibleSheetNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
  var sheet = null;
  
  for (var i = 0; i < possibleSheetNames.length; i++) {
    sheet = ss.getSheetByName(possibleSheetNames[i]);
    if (sheet) {
      console.log('Using existing training sheet: ' + possibleSheetNames[i]);
      break;
    }
  }
  
  if (!sheet) {
    sheet = ss.insertSheet('Training Audit');
    console.log('Created new training sheet: Training Audit');
  }

  // Get store info from mapping
  var storeInfo = getStoreInfo(params.storeId || '');
  
  // Log all incoming parameters for debugging
  console.log('=== TRAINING CHECKLIST PARAMETERS ===');
  console.log('Store ID: ' + (params.storeId || 'not provided'));
  console.log('Region from form: ' + (params.region || 'not provided'));
  console.log('MOD from form: ' + (params.mod || 'not provided'));
  console.log('Trainer Name from form: ' + (params.trainerName || 'not provided'));
  console.log('Trainer ID from form: ' + (params.trainerId || 'not provided'));
  
  // Auto-populate ONLY region from store mapping - MOD must remain user input
  if (storeInfo.region) {
    params.region = storeInfo.region;
    console.log('Region set from store mapping: ' + params.region);
  } else {
    console.log('No region found in store mapping, keeping form value: ' + (params.region || 'empty'));
  }
  
  // Auto-populate other store-related fields from mapping
  params.storeName = storeInfo.storeName || params.storeName || '';
  params.amId = storeInfo.amId || params.amId || '';
  params.hrbpId = storeInfo.hrbpId || params.hrbpId || '';
  params.regionalHrId = storeInfo.regionalHrId || params.regionalHrId || '';
  params.hrHeadId = storeInfo.hrHeadId || params.hrHeadId || '';
  params.lmsHeadId = storeInfo.lmsHeadId || params.lmsHeadId || '';
  
  // Auto-populate trainer info from mapping if not provided by form
  if (!params.trainerName && storeInfo.trainer) {
    params.trainerName = storeInfo.trainer;
    console.log('Trainer name set from store mapping: ' + params.trainerName);
  }
  if (!params.trainerId && storeInfo.trainerId) {
    params.trainerId = storeInfo.trainerId;
    console.log('Trainer ID set from store mapping: ' + params.trainerId);
  }
  
  // MOD field MUST ONLY come from form input - never from store mapping
  console.log('MOD field preserved from form input: ' + (params.mod || 'empty'));

  var header = [
    'Server Timestamp', 'Submission Time', 'Trainer Name', 'Trainer ID',
    'AM Name', 'AM ID', 'Store Name', 'Store ID', 'Region', 'MOD',
    'HRBP ID', 'Regional HR ID', 'HR Head ID', 'LMS Head ID',
    
    // Training Materials (TM_1 to TM_9)
    'TM_1', 'TM_2', 'TM_3', 'TM_4', 'TM_5', 'TM_6', 'TM_7', 'TM_8', 'TM_9',
    
    // LMS (LMS_1 to LMS_3)
    'LMS_1', 'LMS_2', 'LMS_3',
    
    // Buddy (Buddy_1 to Buddy_6)
    'Buddy_1', 'Buddy_2', 'Buddy_3', 'Buddy_4', 'Buddy_5', 'Buddy_6',
    
    // New Joiner (NJ_1 to NJ_7)
    'NJ_1', 'NJ_2', 'NJ_3', 'NJ_4', 'NJ_5', 'NJ_6', 'NJ_7',
    
    // Partner Knowledge (PK_1 to PK_7)
    'PK_1', 'PK_2', 'PK_3', 'PK_4', 'PK_5', 'PK_6', 'PK_7',
    
    // Training Store Audit (TSA_1 to TSA_3)
    'TSA_1', 'TSA_2', 'TSA_3',
    
    // Customer Experience (CX_1 to CX_9)
    'CX_1', 'CX_2', 'CX_3', 'CX_4', 'CX_5', 'CX_6', 'CX_7', 'CX_8', 'CX_9',
    
    // Action Plan (AP_1 to AP_3)
    'AP_1', 'AP_2', 'AP_3',
    
    // Section Remarks
    'TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks', 
    'PK_remarks', 'TSA_remarks', 'CX_remarks', 'AP_remarks',
    
    // Scoring
    'Total Score', 'Max Score', 'Percentage'
  ];

  // Ensure header row exists
  var needHeader = false;
  if (sheet.getLastRow() === 0) {
    needHeader = true;
  } else {
    var firstRow = sheet.getRange(1, 1, 1, header.length).getValues()[0] || [];
    if (firstRow.length !== header.length) {
      needHeader = true;
    }
  }
  if (needHeader) {
    if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }

  var serverTimestamp = new Date();
  var submissionTime = params.submissionTime || serverTimestamp.toISOString();
  
  var row = [
    serverTimestamp, submissionTime,
    params.trainerName || '', params.trainerId || '',
    params.amName || '', params.amId || '',
    params.storeName || '', params.storeId || '',
    params.region || '', params.mod || '',
    params.hrbpId || '', params.regionalHrId || '', 
    params.hrHeadId || '', params.lmsHeadId || '',
    
    // Training Materials (TM_1 to TM_9)
    params.TM_1 || '', params.TM_2 || '', params.TM_3 || '',
    params.TM_4 || '', params.TM_5 || '', params.TM_6 || '',
    params.TM_7 || '', params.TM_8 || '', params.TM_9 || '',
    
    // LMS (LMS_1 to LMS_3)
    params.LMS_1 || '', params.LMS_2 || '', params.LMS_3 || '',
    
    // Buddy (Buddy_1 to Buddy_6)
    params.Buddy_1 || '', params.Buddy_2 || '', params.Buddy_3 || '',
    params.Buddy_4 || '', params.Buddy_5 || '', params.Buddy_6 || '',
    
    // New Joiner (NJ_1 to NJ_7)
    params.NJ_1 || '', params.NJ_2 || '', params.NJ_3 || '',
    params.NJ_4 || '', params.NJ_5 || '', params.NJ_6 || '', params.NJ_7 || '',
    
    // Partner Knowledge (PK_1 to PK_7)
    params.PK_1 || '', params.PK_2 || '', params.PK_3 || '',
    params.PK_4 || '', params.PK_5 || '', params.PK_6 || '', params.PK_7 || '',
    
    // Training Store Audit (TSA_1 to TSA_3)
    params.TSA_1 || '', params.TSA_2 || '', params.TSA_3 || '',
    
    // Customer Experience (CX_1 to CX_9)
    params.CX_1 || '', params.CX_2 || '', params.CX_3 || '',
    params.CX_4 || '', params.CX_5 || '', params.CX_6 || '',
    params.CX_7 || '', params.CX_8 || '', params.CX_9 || '',
    
    // Action Plan (AP_1 to AP_3)
    params.AP_1 || '', params.AP_2 || '', params.AP_3 || '',
    
    // Section Remarks
    params.TM_remarks || '', params.LMS_remarks || '',
    params.Buddy_remarks || '', params.NJ_remarks || '',
    params.PK_remarks || '', params.TSA_remarks || '',
    params.CX_remarks || '', params.AP_remarks || '',
    
    // Scoring
    params.totalScore || '', params.maxScore || '', params.percentage || ''
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'OK' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create headers for HR Bot conversations sheet
 */
function createHRBotHeaders(sheet) {
  var headers = [
    'Timestamp',
    'Conversation ID',
    'Full Transcript',
    'Themes',
    'People Mentioned',
    'Stores Mentioned',
    'Programs Mentioned',
    'Escalations',
    'Workload/Staffing Score',
    'Training/Onboarding Score',
    'Communication/Clarity Score',
    'Empowerment/Ownership Score',
    'Manager/Team Dynamics Score',
    'Recognition/Respect Score',
    'Growth/Progression Score',
    'Overall Satisfaction Score',
    'Retention Intent (12mo)',
    'Final Comment',
    'User Agent',
    'Session ID'
  ];
  
  sheet.appendRow(headers);
  
  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  console.log('HR Bot headers created successfully');
}

/**
 * Format HR Bot conversation row for better readability
 */
function formatHRBotRow(sheet, rowNumber) {
  var range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  
  // Alternate row colors for better readability
  if (rowNumber % 2 === 0) {
    range.setBackground('#f8f9fa');
  }
  
  // Format timestamp column
  var timestampCell = sheet.getRange(rowNumber, 1);
  timestampCell.setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
  // Format score columns (columns 9-16) with conditional formatting
  for (var col = 9; col <= 16; col++) {
    var cell = sheet.getRange(rowNumber, col);
    var value = cell.getValue();
    
    if (value && typeof value === 'number') {
      if (value >= 4) {
        cell.setBackground('#d4edda'); // Green for good scores
      } else if (value <= 2) {
        cell.setBackground('#f8d7da'); // Red for poor scores
      } else {
        cell.setBackground('#fff3cd'); // Yellow for neutral scores
      }
    }
  }
  
  // Format retention intent column with colors
  var retentionCell = sheet.getRange(rowNumber, 17);
  var retentionValue = retentionCell.getValue();
  
  if (retentionValue) {
    switch (retentionValue.toLowerCase()) {
      case 'high':
        retentionCell.setBackground('#d4edda');
        break;
      case 'medium':
        retentionCell.setBackground('#fff3cd');
        break;
      case 'low':
        retentionCell.setBackground('#f8d7da');
        break;
    }
  }
}

/**
 * Handle GET requests (for testing and data retrieval)
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    
    // Health check for HR Bot
    if (!params.action) {
      return ContentService
        .createTextOutput(JSON.stringify({
          message: 'Combined Training Checklist & HR Bot Logger is running!',
          timestamp: new Date().toISOString(),
          services: ['Training Checklist', 'HR Bot Conversations']
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle training checklist data requests
    if (params.action === 'getData') {
      return getTrainingChecklistData();
    } else if (params.action === 'getStoreInfo' && params.storeId) {
      // Provide store info to frontend for auto-population
      var storeInfo = getStoreInfo(params.storeId);
      console.log('Providing store info for ' + params.storeId + ': ' + JSON.stringify(storeInfo));
      return ContentService
        .createTextOutput(JSON.stringify(storeInfo))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Log conversation data to the spreadsheet
 */
function logConversation(data) {
  // Get the specific sheet named "HR Bot Conversations"
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('HR Bot Conversations');
  
  // If the sheet doesn't exist, create it
  if (!sheet) {
    sheet = spreadsheet.insertSheet('HR Bot Conversations');
  }
  
  // Check if headers exist, if not create them
  if (sheet.getLastRow() === 0) {
    createHeaders(sheet);
  }
  
  // Prepare the row data
  const rowData = [
    data.timestamp || new Date().toISOString(),
    data.conversationId || Date.now(),
    data.fullTranscript || '',
    (data.themes || []).join(', '),
    (data.entities?.people_mentioned || []).join(', '),
    (data.entities?.stores_mentioned || []).join(', '),
    (data.programs || []).join(', '),
    (data.escalations || []).join(', '),
    data.overall?.radar_axes?.workload_staffing || null,
    data.overall?.radar_axes?.training_onboarding || null,
    data.overall?.radar_axes?.communication_clarity || null,
    data.overall?.radar_axes?.empowerment_ownership || null,
    data.overall?.radar_axes?.manager_team_dynamics || null,
    data.overall?.radar_axes?.recognition_respect || null,
    data.overall?.radar_axes?.growth_progression || null,
    data.overall?.radar_axes?.overall_satisfaction || null,
    data.overall?.retention_intent_12mo || null,
    data.overall?.final_comment || '',
    data.userAgent || '',
    data.sessionId || ''
  ];
  
  // Add the row to the sheet
  sheet.appendRow(rowData);
  
  // Format the new row
  const lastRow = sheet.getLastRow();
  formatRow(sheet, lastRow);
  
  return {
    rowNumber: lastRow,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create headers for the spreadsheet
 */
function createHeaders(sheet) {
  const headers = [
    'Timestamp',
    'Conversation ID',
    'Full Transcript',
    'Themes',
    'People Mentioned',
    'Stores Mentioned',
    'Programs Mentioned',
    'Escalations',
    'Workload/Staffing Score',
    'Training/Onboarding Score',
    'Communication/Clarity Score',
    'Empowerment/Ownership Score',
    'Manager/Team Dynamics Score',
    'Recognition/Respect Score',
    'Growth/Progression Score',
    'Overall Satisfaction Score',
    'Retention Intent (12mo)',
    'Final Comment',
    'User Agent',
    'Session ID'
  ];
  
  sheet.appendRow(headers);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Format a data row for better readability
 */
function formatRow(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  
  // Alternate row colors for better readability
  if (rowNumber % 2 === 0) {
    range.setBackground('#f8f9fa');
  }
  
  // Format timestamp column
  const timestampCell = sheet.getRange(rowNumber, 1);
  timestampCell.setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
  // Format score columns (columns 9-16) with conditional formatting
  for (let col = 9; col <= 16; col++) {
    const cell = sheet.getRange(rowNumber, col);
    const value = cell.getValue();
    
    if (value && typeof value === 'number') {
      if (value >= 4) {
        cell.setBackground('#d4edda'); // Green for good scores
      } else if (value <= 2) {
        cell.setBackground('#f8d7da'); // Red for poor scores
      } else {
        cell.setBackground('#fff3cd'); // Yellow for neutral scores
      }
    }
  }
  
  // Format retention intent column with colors
  const retentionCell = sheet.getRange(rowNumber, 17);
  const retentionValue = retentionCell.getValue();
  
  if (retentionValue) {
    switch (retentionValue.toLowerCase()) {
      case 'high':
        retentionCell.setBackground('#d4edda');
        break;
      case 'medium':
        retentionCell.setBackground('#fff3cd');
        break;
      case 'low':
        retentionCell.setBackground('#f8d7da');
        break;
    }
  }
}

/**
 * Test function to verify HR Bot logging works
 */
function testHRBotLogging() {
  var testData = {
    timestamp: new Date().toISOString(),
    conversationId: 12345,
    fullTranscript: "HR Bot: Hello! How are you doing today?\nEmployee: I'm doing well, thanks for asking.",
    themes: ["overall_satisfaction", "communication"],
    entities: {
      people_mentioned: ["John", "Sarah"],
      stores_mentioned: ["S056"]
    },
    programs: ["RESPECT values"],
    escalations: [],
    overall: {
      radar_axes: {
        workload_staffing: 4,
        training_onboarding: 3,
        communication_clarity: 5,
        empowerment_ownership: 3,
        manager_team_dynamics: 4,
        recognition_respect: 3,
        growth_progression: 2,
        overall_satisfaction: 4
      },
      retention_intent_12mo: "High",
      final_comment: "Employee seems satisfied with their role and team."
    },
    userAgent: "Test",
    sessionId: "test-session-123"
  };
  
  var result = handleHRBotLogging(testData);
  console.log('HR Bot test result:', result);
  
  return result;
}

/**
 * Test function to verify training checklist logging works  
 */
function testTrainingLogging() {
  var testParams = {
    storeId: 'S056',
    trainerName: 'Test Trainer',
    trainerId: 'T123',
    mod: 'Test MOD',
    TM_1: 'Yes',
    TM_2: 'No',
    LMS_1: 'Yes',
    totalScore: '85',
    maxScore: '100',
    percentage: '85%'
  };
  
  var result = handleTrainingChecklistLogging(testParams);
  console.log('Training test result:', result);
  
  return result;
}

/**
 * Initialize spreadsheet with proper setup for both systems
 */
function initializeSpreadsheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize HR Bot Conversations sheet
  var hrBotSheet = spreadsheet.getSheetByName('HR Bot Conversations');
  if (!hrBotSheet) {
    hrBotSheet = spreadsheet.insertSheet('HR Bot Conversations');
    createHRBotHeaders(hrBotSheet);
    console.log('HR Bot Conversations sheet initialized');
  }
  
  // Initialize Training Audit sheet
  var trainingSheet = spreadsheet.getSheetByName('Training Audit');
  if (!trainingSheet) {
    trainingSheet = spreadsheet.insertSheet('Training Audit');
    console.log('Training Audit sheet created');
  }
  
  // Set up column widths for HR Bot sheet
  if (hrBotSheet.getLastRow() > 0) {
    hrBotSheet.setColumnWidth(1, 150); // Timestamp
    hrBotSheet.setColumnWidth(2, 100); // Conversation ID
    hrBotSheet.setColumnWidth(3, 400); // Full Transcript
    hrBotSheet.setColumnWidth(18, 300); // Final Comment
  }
  
  return 'Both HR Bot Conversations and Training Audit sheets initialized successfully!';
}