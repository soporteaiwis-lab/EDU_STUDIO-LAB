import React, { memo } from 'react';
import { UserMode } from '../types';

interface TimelineRulerProps {
  mode: UserMode;
  bpm: number;
  zoom: number;
  paddingLeft: number; // New prop for alignment
}

export const TimelineRuler: React.FC<TimelineRulerProps> = memo(({ mode, bpm, zoom, paddingLeft }) => {
  const secondsPerBar = (60 / bpm) * 4; 
  const pixelsPerSecond = 40 * zoom; 
  const pixelsPerBar = secondsPerBar * pixelsPerSecond;
  
  const markers = [];
  const totalBars = 30;
  
  for (let i = 0; i < totalBars; i++) {
      markers.push(
          <div key={i} className="absolute top-0 bottom-0 border-l border-gray-600/30 pl-1 group" style={{ left: `${(i * pixelsPerBar) + paddingLeft}px` }}>
              <span className="text-[10px] font-mono text-gray-500 font-bold group-hover:text-white select-none">{i + 1}</span>
          </div>
      );
      // Quarter notes
      for(let j=1; j<4; j++) {
           markers.push(
              <div key={`${i}-${j}`} className="absolute bottom-0 h-2 border-l border-gray-600/10" style={{ left: `${(i * pixelsPerBar) + (j * (pixelsPerBar/4)) + paddingLeft}px` }}></div>
           );
      }
  }

  return (
    <div className="relative h-6 w-full border-b border-gray-700 bg-gray-900 overflow-hidden flex-shrink-0">
       <div className="absolute inset-0 pointer-events-none w-[3000px]">
          {markers}
       </div>
       {/* HEADER MASK: Visually blocks the ruler area above track headers to reduce confusion */}
       <div 
          className="absolute top-0 bottom-0 left-0 bg-gray-800 border-r border-black z-10 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-md"
          style={{ width: `${paddingLeft}px` }}
       >
          <span className="opacity-50 tracking-widest">TIMELINE</span>
       </div>
    </div>
  );
});