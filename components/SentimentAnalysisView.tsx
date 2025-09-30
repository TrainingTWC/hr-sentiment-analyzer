

import React from 'react';
import type { TWCAnalysisResult } from '../types';

interface SentimentAnalysisViewProps {
  result: TWCAnalysisResult | null;
  status: 'idle' | 'connecting' | 'connected' | 'analyzing' | 'finished';
}

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-2">{title}</h3>
        {children}
    </div>
);

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-block bg-sky-500/20 text-sky-300 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
        {children}
    </span>
);

const RadarScore: React.FC<{ label: string; score: number | null }> = ({ label, score }) => (
    <div className="flex justify-between items-center text-sm text-slate-300">
        <span>{label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        <span className={`font-bold ${score ? (score > 3 ? 'text-green-400' : score < 3 ? 'text-red-400' : 'text-yellow-400') : 'text-slate-500'}`}>
            {score ? `${score}/5` : 'N/A'}
        </span>
    </div>
);

export const SentimentAnalysisView: React.FC<SentimentAnalysisViewProps> = ({ result, status }) => {
    
    const renderContent = () => {
        if (status === 'analyzing') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mb-4"></div>
                    <p className="font-semibold">Analyzing TWC Feedback...</p>
                    <p className="text-sm text-slate-500">Extracting themes and entities.</p>
                </div>
            )
        }
        
        if (!result) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>Analysis will appear here after the conversation ends.</p>
                </div>
            )
        }
        
        const { themes, entities, programs, escalations, overall } = result;

        return (
             <div className="space-y-6 overflow-y-auto -mr-2 pr-2">
                <Section title="Summary">
                    <p className="text-slate-300 italic">"{overall.final_comment}"</p>
                </Section>
                
                {overall.retention_intent_12mo &&
                    <Section title="Retention Intent (12 Mo.)">
                        <Pill>{overall.retention_intent_12mo}</Pill>
                    </Section>
                }

                <Section title="Sentiment Scores">
                    <div className="space-y-1">
                        {Object.entries(overall.radar_axes).map(([key, value]) => (
                            <RadarScore key={key} label={key} score={value} />
                        ))}
                    </div>
                </Section>
                
                {themes?.length > 0 && 
                    <Section title="Identified Themes">
                        <div>{themes.map(t => <Pill key={t}>{t}</Pill>)}</div>
                    </Section>
                }

                {entities?.people_mentioned?.length > 0 && 
                    <Section title="People Mentioned">
                        <div>{entities.people_mentioned.map(p => <Pill key={p}>{p}</Pill>)}</div>
                    </Section>
                }

                {entities?.stores_mentioned?.length > 0 && 
                    <Section title="Stores Mentioned">
                        <div>{entities.stores_mentioned.map(s => <Pill key={s}>{s}</Pill>)}</div>
                    </Section>
                }

                {programs?.length > 0 && 
                    <Section title="Programs Mentioned">
                        <div>{programs.map(p => <Pill key={p}>{p}</Pill>)}</div>
                    </Section>
                }

                {escalations?.length > 0 && 
                    <Section title="Escalations">
                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-md p-3">
                            <ul className="list-disc list-inside">
                                {escalations.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    </Section>
                }
            </div>
        )
    }

  return (
    <>
      <h2 className="text-lg font-bold text-sky-400 border-b border-slate-700/50 pb-4 mb-4">Conversation Analysis</h2>
      {renderContent()}
    </>
  );
};
