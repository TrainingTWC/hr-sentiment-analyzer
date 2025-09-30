// Google Sheets logging utility using Google Apps Script webhook
import type { TranscriptionEntry, TWCAnalysisResult } from '../types';

export interface GoogleAppsScriptConfig {
  webhookUrl: string;
}

export interface ConversationLogEntry {
  timestamp: string;
  conversationId: number;
  fullTranscript: string;
  themes: string[];
  entities: {
    people_mentioned: string[];
    stores_mentioned: string[];
  };
  programs: string[];
  escalations: string[];
  overall: {
    radar_axes: {
      workload_staffing: number | null;
      training_onboarding: number | null;
      communication_clarity: number | null;
      empowerment_ownership: number | null;
      manager_team_dynamics: number | null;
      recognition_respect: number | null;
      growth_progression: number | null;
      overall_satisfaction: number | null;
    };
    retention_intent_12mo: string | null;
    final_comment: string;
  };
  userAgent: string;
  sessionId: string;
}

export async function logConversationToGoogleSheets(
  webhookUrl: string,
  conversationId: number,
  transcriptionHistory: TranscriptionEntry[],
  sentimentResult: TWCAnalysisResult
): Promise<boolean> {
  try {
    if (!webhookUrl) {
      console.log('⚠️ No Google Apps Script webhook URL configured');
      return false;
    }

    // Prepare the data
    const fullTranscript = transcriptionHistory
      .map(entry => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const logEntry: ConversationLogEntry = {
      timestamp: new Date().toISOString(),
      conversationId,
      fullTranscript,
      themes: sentimentResult.themes,
      entities: {
        people_mentioned: sentimentResult.entities.people_mentioned,
        stores_mentioned: sentimentResult.entities.stores_mentioned
      },
      programs: sentimentResult.programs,
      escalations: sentimentResult.escalations,
      overall: {
        radar_axes: sentimentResult.overall.radar_axes,
        retention_intent_12mo: sentimentResult.overall.retention_intent_12mo,
        final_comment: sentimentResult.overall.final_comment
      },
      userAgent: navigator.userAgent,
      sessionId: `session-${Date.now()}`
    };

    // Send to Google Apps Script webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    });

    if (!response.ok) {
      throw new Error(`Apps Script webhook error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Conversation logged to Google Sheets successfully via Apps Script');
      return true;
    } else {
      throw new Error(`Apps Script error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Failed to log conversation to Google Sheets:', error);
    return false;
  }
}

export async function testGoogleSheetsConnection(webhookUrl: string): Promise<boolean> {
  try {
    if (!webhookUrl) {
      console.log('⚠️ No webhook URL provided');
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Google Apps Script connection successful:', result);
    return true;

  } catch (error) {
    console.error('❌ Google Apps Script connection test failed:', error);
    return false;
  }
}