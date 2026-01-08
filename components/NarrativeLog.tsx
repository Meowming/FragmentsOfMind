
import React from 'react';
import { NarrativeEntry } from '../types';

interface NarrativeLogProps {
  history: NarrativeEntry[];
}

export const NarrativeLog: React.FC<NarrativeLogProps> = ({ history }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div className="mt-8 space-y-6 max-h-[400px] overflow-y-auto pr-4 scroll-smooth" ref={scrollRef}>
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-widest border-b border-slate-800 pb-2">叙事回响</h3>
      {history.map((entry, idx) => (
        <div key={idx} className="border-l-2 border-slate-800 pl-4 py-2 group">
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs px-2 py-0.5 rounded ${entry.happinessDelta >= 0 ? 'bg-emerald-950/30 text-emerald-400' : 'bg-rose-950/30 text-rose-400'}`}>
              {entry.happinessDelta > 0 ? `+${entry.happinessDelta}` : entry.happinessDelta} 心灵共鸣
            </span>
          </div>
          <p className="text-slate-300 italic mb-2 serif text-sm leading-relaxed">
            “{entry.sequence.join(' ')}”
          </p>
          <p className="text-slate-500 text-xs leading-relaxed group-hover:text-slate-400 transition-colors">
            {entry.interpretation}
          </p>
        </div>
      ))}
    </div>
  );
};
