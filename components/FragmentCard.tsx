
import React from 'react';

interface FragmentCardProps {
  text: string;
  index: number;
  isFixed: boolean;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export const FragmentCard: React.FC<FragmentCardProps> = ({ 
  text, 
  index, 
  isFixed,
  onDragStart, 
  onDragEnter, 
  onDragEnd 
}) => {
  return (
    <div
      draggable={!isFixed}
      onDragStart={() => !isFixed && onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`relative p-4 mb-3 rounded-lg transition-all shadow-sm group overflow-hidden border
        ${isFixed 
          ? 'bg-slate-900/80 border-slate-800 cursor-not-allowed opacity-90' 
          : 'bg-slate-800/50 border-slate-700 cursor-grab active:cursor-grabbing hover:border-pink-500/50'
        }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors
        ${isFixed ? 'bg-slate-600' : 'bg-slate-700 group-hover:bg-pink-500'}
      `}></div>
      
      <p className={`serif text-lg leading-relaxed select-none ${isFixed ? 'text-slate-400 italic' : 'text-slate-200'}`}>
        {text}
      </p>

      <div className="absolute right-3 top-3 opacity-20 group-hover:opacity-50">
        {isFixed ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        )}
      </div>

      {isFixed && (
        <div className="mt-2 text-[10px] uppercase tracking-tighter text-slate-600 font-bold">
          锚定碎片
        </div>
      )}
    </div>
  );
};
