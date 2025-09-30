
import React from 'react';
import type { TranscriptionEntry } from '../types';

interface ConversationViewProps {
  transcriptionHistory: TranscriptionEntry[];
  status: 'idle' | 'connecting' | 'connected' | 'analyzing' | 'finished';
}

const LoadingDots: React.FC = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
    </div>
);

export const ConversationView: React.FC<ConversationViewProps> = ({ transcriptionHistory, status }) => {
  return (
    <div className="flex-grow p-6 overflow-y-auto space-y-4">
      {transcriptionHistory.length === 0 && (status === 'idle' || status === 'connecting') && (
         <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p>Click "Start Conversation" to begin.</p>
        </div>
      )}
      {transcriptionHistory.map((entry, index) => (
        <div key={index} className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-md p-3 rounded-lg ${entry.speaker === 'You' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
            <p className="text-sm">{entry.text}</p>
          </div>
        </div>
      ))}
      {status === 'connected' && (
          <div className="flex justify-start">
             <div className="max-w-md p-3 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none">
                <LoadingDots />
            </div>
          </div>
      )}
    </div>
  );
};
