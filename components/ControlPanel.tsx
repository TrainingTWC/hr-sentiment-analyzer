
import React from 'react';

interface ControlPanelProps {
  status: 'idle' | 'connecting' | 'connected' | 'analyzing' | 'finished';
  onStart: () => void;
  onEnd: () => void;
  onNewChat: () => void;
  startDisabled?: boolean;
}

const MicrophoneIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
  </svg>
);

const StopIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
  </svg>
);


const NewChatIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({ status, onStart, onEnd, onNewChat, startDisabled = false }) => {
    
    const getStatusMessage = () => {
        switch (status) {
            case 'connecting':
                return 'Connecting...';
            case 'connected':
                return 'Live - Conversation in progress...';
            case 'analyzing':
                return 'Analyzing...';
            case 'finished':
                return 'Conversation ended & analyzed.';
            case 'idle':
            default:
                return 'Ready to start.';
        }
    }

  return (
    <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between">
      <div className="flex items-center space-x-2 text-sm text-slate-400">
         {status === 'connected' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
        <span>{getStatusMessage()}</span>
      </div>
      <div>
        {(status === 'idle' || status === 'finished') && (
          <div className="flex space-x-2">
            <button 
              onClick={onStart} 
              disabled={startDisabled}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 transition-colors flex items-center space-x-2 disabled:bg-sky-800/50 disabled:cursor-not-allowed"
            >
              <MicrophoneIcon className="w-5 h-5" />
              <span>Start Conversation</span>
            </button>
            {status === 'finished' && (
              <button 
                onClick={onNewChat}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors flex items-center space-x-2"
              >
                <NewChatIcon className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            )}
          </div>
        )}
        {(status === 'connecting' || status === 'connected') && (
          <button onClick={onEnd} disabled={status === 'connecting'} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors flex items-center space-x-2">
            <StopIcon className="w-5 h-5" />
            <span>End Conversation</span>
          </button>
        )}
      </div>
    </div>
  );
};
