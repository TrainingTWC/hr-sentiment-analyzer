

export interface TranscriptionEntry {
  speaker: 'You' | 'HR Bot';
  text: string;
}

export interface TWCAnalysisResult {
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
    retention_intent_12mo: 'High' | 'Medium' | 'Low' | 'Unclear' | null;
    final_comment: string;
  };
}


export interface SavedConversation {
  id: number; // Using timestamp as ID
  date: string;
  transcriptionHistory: TranscriptionEntry[];
  sentimentResult: TWCAnalysisResult;
}
