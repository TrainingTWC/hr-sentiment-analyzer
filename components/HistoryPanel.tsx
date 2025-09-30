

import React from 'react';
import type { SavedConversation, TWCAnalysisResult } from '../types';

interface HistoryPanelProps {
  conversations: SavedConversation[];
  onSelect: (conversation: SavedConversation) => void;
}

const getOverallSentimentFromScores = (radar_axes: TWCAnalysisResult['overall']['radar_axes']): 'Positive' | 'Neutral' | 'Negative' => {
    if (!radar_axes) return 'Neutral';
    const scores = Object.values(radar_axes).filter(score => score !== null) as number[];
    if (scores.length === 0) return 'Neutral';

    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (avg > 3.5) return 'Positive';
    if (avg < 2.5) return 'Negative';
    return 'Neutral';
}

const sentimentBadgeStyles = {
    Positive: 'bg-green-500/20 text-green-400',
    Neutral: 'bg-yellow-500/20 text-yellow-400',
    Negative: 'bg-red-500/20 text-red-400',
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ conversations, onSelect }) => {
  return (
    <div className="w-full lg:w-1/4 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700/50 p-6 flex flex-col">
        <h2 className="text-lg font-bold text-sky-400 border-b border-slate-700/50 pb-4 mb-4">Conversation History</h2>
        {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Saved conversations will appear here.</p>
            </div>
        ) : (
            <div className="overflow-y-auto space-y-2 -mr-2 pr-2">
                {conversations.map((convo) => {
                    const overallSentiment = getOverallSentimentFromScores(convo.sentimentResult.overall.radar_axes);
                    return (
                    <button 
                        key={convo.id} 
                        onClick={() => onSelect(convo)}
                        className="w-full text-left p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-slate-300">{convo.date}</p>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${sentimentBadgeStyles[overallSentiment]}`}>
                                {overallSentiment}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate italic">"{convo.sentimentResult.overall.final_comment}"</p>
                    </button>
                )})}
            </div>
        )}
    </div>
  );
};
