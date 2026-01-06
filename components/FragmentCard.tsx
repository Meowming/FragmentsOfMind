
import React from 'react';

interface FragmentCardProps {
  text: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export const FragmentCard: React.FC<FragmentCardProps> = ({ 
  text, 
  index, 
  onDragStart, 
  onDragEnter, 
  onDragEnd 
}) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className="bg-slate-800/50 border border-slate-700 p-4 mb-3 rounded-lg cursor-grab active:cursor-grabbing hover:border-pink-500/50 transition-colors shadow-sm group relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-700 group-hover:bg-pink-500 transition-colors"></div>
      <p className="text-slate-200 serif text-lg leading-relaxed select-none">
        {text}
      </p>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
    </div>
  );
};
