
import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: The `LiveSession` type is not exported from the library.
// Replaced `LiveSession` with `Blob` which is needed for our local interface.
import { GoogleGenAI, LiveServerMessage, Modality, Type, Blob } from '@google/genai';
import { ConversationView } from './components/ConversationView';
import { SentimentAnalysisView } from './components/SentimentAnalysisView';
import { ControlPanel } from './components/ControlPanel';
import { HistoryPanel } from './components/HistoryPanel';
import type { TranscriptionEntry, TWCAnalysisResult, SavedConversation } from './types';
import { decode, decodeAudioData, createPcmBlob } from './utils/audioUtils';
import { logConversationToGoogleSheets } from './utils/googleSheetsLogger';

// FIX: Added a local interface for the `LiveSession` object as it's not exported.
// This interface defines the methods used in this component.
interface LiveSession {
  sendRealtimeInput(params: { media: Blob }): void;
  close(): void;
}

// Polyfill for webkitAudioContext
// FIX: Cast `window` to `any` to access the vendor-prefixed `webkitAudioContext`
// without causing a TypeScript error.
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

const LOCAL_STORAGE_KEY = 'HR_SENTIMENT_HISTORY_TWC';

// Google Apps Script webhook URL - add this to your environment variables
const GOOGLE_APPS_SCRIPT_WEBHOOK = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK || '';

const App: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'analyzing' | 'finished'>('idle');
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
  const [sentimentResult, setSentimentResult] = useState<TWCAnalysisResult | null>(null);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [domainContext, setDomainContext] = useState<any | null>(null);
  const [browserCompatible, setBrowserCompatible] = useState<boolean>(true);
  const [compatibilityMessage, setCompatibilityMessage] = useState<string>('');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const outputAudioQueueRef = useRef<{ source: AudioBufferSourceNode; buffer: AudioBuffer }[]>([]);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Check browser compatibility
  useEffect(() => {
    const checkCompatibility = () => {
      const issues: string[] = [];
      
      // Check for required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        issues.push('• Microphone access not supported');
      }
      
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        issues.push('• Web Audio API not supported');
      }
      
      if (!window.WebSocket) {
        issues.push('• WebSocket not supported');
      }
      
      // Check protocol
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        issues.push('• HTTPS required for microphone access');
      }
      
      // Browser detection
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
      const isFirefox = /Firefox/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isEdge = /Edg/.test(userAgent);
      
      if (!isChrome && !isFirefox && !isSafari && !isEdge) {
        issues.push('• Unsupported browser detected');
      }
      
      if (issues.length > 0) {
        setBrowserCompatible(false);
        setCompatibilityMessage(`Browser compatibility issues detected:\n${issues.join('\n')}\n\nRecommended: Use Google Chrome for best experience.`);
      }
    };
    
    checkCompatibility();
  }, []);
  const ai = useRef<GoogleGenAI | null>(null);
  
  useEffect(() => {
    fetch('./twc-domain-context.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => setDomainContext(data))
        .catch(error => {
            console.error("Failed to load domain context:", error);
            alert("Critical error: Could not load application configuration. Please refresh the page.");
        });
  }, []);

  useEffect(() => {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as SavedConversation[];
            parsed.sort((a, b) => b.id - a.id);
            setSavedConversations(parsed);
        }
    } catch (error) {
        console.error("Failed to load conversation history:", error);
    }
  }, []);

  const getAi = useCallback(() => {
    if (!ai.current) {
        if (!process.env.GEMINI_API_KEY) {
            alert("GEMINI_API_KEY environment variable not set.");
            throw new Error("GEMINI_API_KEY not set");
        }
        ai.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai.current;
  }, []);
  
  const saveAndSetConversations = async (newConversation: SavedConversation) => {
    try {
        const updatedConversations = [newConversation, ...savedConversations];
        updatedConversations.sort((a, b) => b.id - a.id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConversations));
        setSavedConversations(updatedConversations);

        // Log to Google Sheets if configured
        if (GOOGLE_APPS_SCRIPT_WEBHOOK) {
          try {
            const success = await logConversationToGoogleSheets(
              GOOGLE_APPS_SCRIPT_WEBHOOK,
              newConversation.id,
              newConversation.transcriptionHistory,
              newConversation.sentimentResult
            );
            if (success) {
              console.log('✅ Conversation logged to Google Sheets');
            } else {
              console.warn('⚠️ Failed to log to Google Sheets, but conversation saved locally');
            }
          } catch (error) {
            console.error('❌ Google Sheets logging error:', error);
          }
        }
    } catch (error) {
        console.error("Failed to save conversation history:", error);
        alert("Could not save conversation to local storage. It might be full.");
    }
  };

  const handleStartConversation = async () => {
    if (!domainContext) {
        alert("Application configuration is loading. Please try again in a moment.");
        return;
    }

    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser doesn't support microphone access. Please use Chrome, Firefox, Safari, or Edge.");
        return;
    }

    if (!window.AudioContext && !(window as any).webkitAudioContext) {
        alert("Your browser doesn't support Web Audio API. Please update your browser or try Chrome/Firefox.");
        return;
    }

    // Check if running on HTTPS or localhost (required for microphone access)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        alert("Microphone access requires HTTPS or localhost. Please use https:// or run locally.");
        return;
    }

    setStatus('connecting');
    setTranscriptionHistory([]);
    setSentimentResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const systemInstruction = `You are an empathetic and professional HR representative for a company called 'Third Wave Coffee' (TWC). You are conducting a routine 'HR Connect' check-in call with an employee. Your goal is to understand how the employee is feeling about their work, their team, and TWC.
      - Keep your responses concise, friendly, and conversational.
      - You must strictly adhere to the allowed topics: ${domainContext.domain_lock.allowed_topics.join(', ')}.
      - If the employee talks about topics outside of this scope, you must respond with: "${domainContext.domain_lock.out_of_scope_message}".
      - Be aware of TWC programs like 'ZingLearn LMS', 'RESPECT values & badges', and 'Bench Planning' and you can refer to them if the employee brings up related topics.
      - Your first turn should be a friendly greeting, introducing yourself as being from TWC HR and asking the employee how they are doing.`;


      sessionPromiseRef.current = getAi().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTranscriptionRef.current.trim();
              const modelOutput = currentOutputTranscriptionRef.current.trim();
              
              setTranscriptionHistory(prev => {
                  const newHistory = [...prev];
                  if(userInput) newHistory.push({ speaker: 'You', text: userInput });
                  if(modelOutput) newHistory.push({ speaker: 'HR Bot', text: modelOutput });
                  return newHistory;
              });

              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }
            
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                const audioContext = outputAudioContextRef.current;
                if(audioContext){
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }
            }

            if (message.serverContent?.interrupted) {
                for (const source of sourcesRef.current.values()) {
                    source.stop();
                    sourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);

            // Perform cleanup on error to release all audio resources
            scriptProcessorRef.current?.disconnect();
            mediaStreamSourceRef.current?.disconnect();
            mediaStreamRef.current?.getTracks().forEach(track => track.stop());

            if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
              inputAudioContextRef.current.close();
            }
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
              outputAudioContextRef.current.close();
            }

            sourcesRef.current.forEach(source => source.stop());
            sourcesRef.current.clear();

            sessionPromiseRef.current = null;
            scriptProcessorRef.current = null;
            mediaStreamSourceRef.current = null;
            mediaStreamRef.current = null;
            
            setStatus('idle');
            
            // Provide more specific error messages
            const errorMessage = e.message || 'Unknown error';
            if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
              alert('Authentication Error: Invalid API key. Please check your Gemini API key configuration.');
            } else if (errorMessage.includes('429')) {
              alert('Rate Limit Error: Too many requests. Please wait a moment and try again.');
            } else if (errorMessage.includes('upgrade') || errorMessage.includes('websocket')) {
              alert('Connection Error: WebSocket upgrade failed. This may be due to:\n• Browser compatibility issues\n• Network/firewall restrictions\n• Try using Chrome or Firefox\n• Ensure you\'re on HTTPS or localhost');
            } else {
              alert(`Connection Error: ${errorMessage}\n\nTroubleshooting:\n• Check your internet connection\n• Try refreshing the page\n• Ensure microphone permissions are granted\n• Use Chrome, Firefox, Safari, or Edge browser`);
            }
          },
          onclose: () => {
            console.log('Session closed.');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
        },
      });

    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      setStatus('idle');
      
      // Clean up any partially initialized resources
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      // Provide specific error messages based on the error type
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please:\n• Allow microphone permissions in your browser\n• Check browser settings\n• Refresh the page and try again');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please:\n• Connect a microphone\n• Check device settings\n• Ensure microphone is not being used by another application');
      } else if (error.name === 'NotSupportedError') {
        alert('Your browser doesn\'t support audio recording. Please use:\n• Chrome (recommended)\n• Firefox\n• Safari\n• Edge');
      } else if (error.message && error.message.includes('upgrade')) {
        alert('Browser Compatibility Issue:\n\nThe "Upgrade Required" error indicates your browser doesn\'t fully support the required WebRTC features.\n\nSolutions:\n• Use Google Chrome (recommended)\n• Update your browser to the latest version\n• Try Firefox as an alternative\n• Ensure you\'re accessing via HTTPS or localhost');
      } else {
        alert(`Failed to start conversation: ${error.message || 'Unknown error'}\n\nTroubleshooting:\n• Check microphone permissions\n• Try refreshing the page\n• Use Chrome or Firefox browser\n• Ensure stable internet connection`);
      }
    }
  };

  const handleEndConversation = async () => {
    if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
    }
    
    // Cleanup audio resources
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    sessionPromiseRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    mediaStreamRef.current = null;

    setStatus('analyzing');
    const fullTranscript = transcriptionHistory.map(t => `${t.speaker}: ${t.text}`).join('\n');
    
    const emptyAnalysis: TWCAnalysisResult = {
        themes: [],
        entities: { people_mentioned: [], stores_mentioned: [] },
        programs: [],
        escalations: [],
        overall: {
            radar_axes: {
                workload_staffing: null, training_onboarding: null, communication_clarity: null,
                empowerment_ownership: null, manager_team_dynamics: null, recognition_respect: null,
                growth_progression: null, overall_satisfaction: null
            },
            retention_intent_12mo: null,
            final_comment: "No conversation was recorded."
        }
    };

    if (fullTranscript.trim().length === 0) {
        setStatus('finished');
        setSentimentResult(emptyAnalysis);
        return;
    }

    if (!domainContext) {
        console.error("Analysis failed: domain context not loaded.");
        const errorResult: TWCAnalysisResult = { ...emptyAnalysis, overall: { ...emptyAnalysis.overall, final_comment: "Failed to analyze conversation: Configuration missing."}};
        setSentimentResult(errorResult);
        setStatus('finished');
        return;
    }

    try {
        const analysisPrompt = `You are an expert HR analyst for 'Third Wave Coffee' (TWC). Analyze the following HR Connect conversation transcript.
        
        TWC Context for your analysis:
        ${JSON.stringify(domainContext, null, 2)}
        
        Conversation Transcript:
        ---
        ${fullTranscript}
        ---
        
        Based on the context and transcript, extract the required information.
        - For 'radar_axes' scores, rate each theme from 1 (very negative) to 5 (very positive) based on the employee's sentiment. If a theme is not discussed, use null.
        - For 'retention_intent_12mo', classify as 'High', 'Medium', 'Low', or 'Unclear'.
        - Identify any TWC programs, people, or stores mentioned.
        - List any critical issues under 'escalations'.
        - Provide a concise 'final_comment' summarizing the conversation.
        - Identify all relevant 'themes' discussed.`;

        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: analysisPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        themes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        entities: {
                            type: Type.OBJECT,
                            properties: {
                                people_mentioned: { type: Type.ARRAY, items: { type: Type.STRING } },
                                stores_mentioned: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        },
                        programs: { type: Type.ARRAY, items: { type: Type.STRING } },
                        escalations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        overall: {
                            type: Type.OBJECT,
                            properties: {
                                radar_axes: {
                                    type: Type.OBJECT,
                                    properties: {
                                        workload_staffing: { type: Type.NUMBER, nullable: true },
                                        training_onboarding: { type: Type.NUMBER, nullable: true },
                                        communication_clarity: { type: Type.NUMBER, nullable: true },
                                        empowerment_ownership: { type: Type.NUMBER, nullable: true },
                                        manager_team_dynamics: { type: Type.NUMBER, nullable: true },
                                        recognition_respect: { type: Type.NUMBER, nullable: true },
                                        growth_progression: { type: Type.NUMBER, nullable: true },
                                        overall_satisfaction: { type: Type.NUMBER, nullable: true }
                                    }
                                },
                                retention_intent_12mo: { type: Type.STRING, nullable: true },
                                final_comment: { type: Type.STRING }
                            }
                        }
                    }
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result: TWCAnalysisResult = JSON.parse(jsonText);
        setSentimentResult(result);
        await saveAndSetConversations({
            id: Date.now(),
            date: new Date().toLocaleString(),
            transcriptionHistory,
            sentimentResult: result,
        });

    } catch (error) {
        console.error("TWC analysis failed:", error);
        const errorResult: TWCAnalysisResult = { ...emptyAnalysis, overall: { ...emptyAnalysis.overall, final_comment: "Failed to analyze conversation."}};
        setSentimentResult(errorResult);
        await saveAndSetConversations({
            id: Date.now(),
            date: new Date().toLocaleString(),
            transcriptionHistory,
            sentimentResult: errorResult,
        });
    } finally {
        setStatus('finished');
    }
  };

  const handleNewChat = () => {
    // Clear current conversation
    setTranscriptionHistory([]);
    setSentimentResult(null);
    setStatus('idle');
  };

  const handleSelectHistory = (conversation: SavedConversation) => {
    setTranscriptionHistory(conversation.transcriptionHistory);
    setSentimentResult(conversation.sentimentResult);
    setStatus('finished');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      {/* Browser Compatibility Warning */}
      {!browserCompatible && (
        <div className="w-full max-w-7xl mx-auto mb-4 bg-amber-900/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="text-amber-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-amber-300 font-semibold">Browser Compatibility Warning</h3>
              <p className="text-amber-100 text-sm mt-1 whitespace-pre-line">{compatibilityMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Panel: Conversation */}
        <div className="w-full lg:w-1/2 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700/50 overflow-hidden flex flex-col">
          <header className="p-4 border-b border-slate-700/50">
            <h1 className="text-xl font-bold text-sky-400">TWC HR Connect</h1>
            <p className="text-sm text-slate-400">AI-Powered Employee Check-in</p>
          </header>
          <ConversationView transcriptionHistory={transcriptionHistory} status={status} />
          <ControlPanel 
            status={status} 
            onStart={handleStartConversation} 
            onEnd={handleEndConversation} 
            onNewChat={handleNewChat}
            startDisabled={!domainContext || !browserCompatible} 
          />
        </div>

        {/* Middle Panel: Analysis */}
        <div className="w-full lg:w-1/4 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700/50 p-6 flex flex-col">
           <SentimentAnalysisView result={sentimentResult} status={status} />
        </div>

        {/* Right Panel: History */}
        <HistoryPanel conversations={savedConversations} onSelect={handleSelectHistory} />
      </div>
       <footer className="text-center mt-8 text-slate-500 text-xs">
            <p>Powered by Google Gemini. For Third Wave Coffee demonstration purposes only.</p>
        </footer>
    </div>
  );
};

export default App;
