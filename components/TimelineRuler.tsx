import React, { memo, useState, useRef, useEffect } from 'react';
import { UserMode, LoopRegion } from '../types';
import { Repeat } from 'lucide-react';

interface TimelineRulerProps {
  mode: UserMode;
  bpm: number;
  zoom: number;
  paddingLeft: number; 
  loopRegion: LoopRegion;
  onLoopChange: (region: LoopRegion) => void;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = memo(({ mode, bpm, zoom, paddingLeft, loopRegion, onLoopChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  const secondsPerBar = (60 / bpm) * 4; 
  const pixelsPerSecond = 40 * zoom; 
  const pixelsPerBar = secondsPerBar * pixelsPerSecond;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - paddingLeft + rulerRef.current.scrollLeft;
    
    // Calculate clicked bar (approx)
    const clickedBar = Math.max(0, Math.floor(x / pixelsPerBar));
    
    setIsDragging(true);
    // Start a new loop selection
    onLoopChange({ startBar: clickedBar, endBar: clickedBar + 1, isActive: true });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - paddingLeft + rulerRef.current.scrollLeft;
      const currentBar = Math.max(0, Math.floor(x / pixelsPerBar));
      
      // Update end bar, ensure end > start
      if (currentBar >= loopRegion.startBar) {
          onLoopChange({ ...loopRegion, endBar: currentBar + 1 });
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const markers = [];
  const totalBars = 100; // Increased range
  
  for (let i = 0; i < totalBars; i++) {
      const leftPos = (i * pixelsPerBar) + paddingLeft;
      
      // Major Bar Marker
      markers.push(
          <div key={`bar-${i}`} className="absolute top-0 bottom-0 border-l border-gray-600 pl-1.5 select-none" style={{ left: `${leftPos}px` }}>
              <span className="text-[10px] font-mono font-bold text-gray-400">{i + 1}</span>
          </div>
      );
      
      // Beat Markers (Quarter Notes) - only visible if zoom is enough
      if (zoom > 0.6) {
        const beatWidth = pixelsPerBar / 4;
        for(let j=1; j<4; j++) {
             markers.push(
                <div key={`beat-${i}-${j}`} className="absolute bottom-0 h-2 border-l border-gray-700" style={{ left: `${leftPos + (j * beatWidth)}px` }}></div>
             );
        }
      }
  }

  // Loop Region Overlay
  const loopStartPx = (loopRegion.startBar * pixelsPerBar) + paddingLeft;
  const loopWidthPx = (loopRegion.endBar - loopRegion.startBar) * pixelsPerBar;

  return (
    <div 
        ref={rulerRef}
        className="relative h-9 w-full border-b border-black bg-[#18181b] overflow-hidden flex-shrink-0 cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
       {/* Loop Region Indicator */}
       {loopRegion.isActive && (
           <div 
                className="absolute top-0 height-full bg-red-500/20 border-x-2 border-red-500 z-10 pointer-events-none transition-all duration-75 flex justify-center"
                style={{ left: `${loopStartPx}px`, width: `${loopWidthPx}px`, height: '100%' }}
           >
               <div className="bg-red-500 h-1 absolute top-0 left-0 right-0"></div>
               <span className="text-[9px] text-red-300 font-bold mt-1 bg-black/50 px-1 rounded h-fit flex items-center gap-1">
                   <Repeat size={8}/> Loop
               </span>
           </div>
       )}

       <div className="absolute inset-0 pointer-events-none w-[10000px]">
          {markers}
       </div>

       {/* HEADER MASK (Left Panel Cover) */}
       <div 
          className="absolute top-0 bottom-0 left-0 bg-[#1e1e1e] border-r border-black z-20 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-md"
          style={{ width: `${paddingLeft}px` }}
       >
          <span className="opacity-70 tracking-widest text-cyan-400">TIMELINE</span>
       </div>
    </div>
  );
});
