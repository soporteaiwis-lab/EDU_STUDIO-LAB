
import React, { memo, useState, useRef } from 'react';
import { UserMode, LoopRegion } from '../types';
import { Repeat, Flag } from 'lucide-react';

interface TimelineRulerProps {
  mode: UserMode;
  bpm: number;
  zoom: number;
  loopRegion: LoopRegion;
  onLoopChange: (region: LoopRegion) => void;
  totalBars: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = memo(({ mode, bpm, zoom, loopRegion, onLoopChange, totalBars }) => {
  const [isDragging, setIsDragging] = useState<'START' | 'END' | 'NEW' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const secondsPerBar = (60 / bpm) * 4; 
  const pixelsPerSecond = 40 * zoom; 
  const pixelsPerBar = secondsPerBar * pixelsPerSecond;

  // Calculate pixel positions for loop handles
  const startPx = (loopRegion.startBar * pixelsPerBar);
  const endPx = (loopRegion.endBar * pixelsPerBar);
  const widthPx = endPx - startPx;

  const getBarFromX = (x: number) => {
     return Math.max(0, Math.floor(x / pixelsPerBar));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // Corrected: remove paddingLeft adjustment as it's relative
    
    // Check if clicking near start or end handle (tolerance 15px)
    if (Math.abs(x - startPx) < 15 && loopRegion.isActive) {
        setIsDragging('START');
    } else if (Math.abs(x - endPx) < 15 && loopRegion.isActive) {
        setIsDragging('END');
    } else {
        // Create new loop
        const clickedBar = getBarFromX(x);
        onLoopChange({ startBar: clickedBar, endBar: clickedBar + 1, isActive: true });
        setIsDragging('NEW');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const currentBar = getBarFromX(x);

      if (isDragging === 'START') {
          const newStart = Math.min(currentBar, loopRegion.endBar - 1);
          onLoopChange({ ...loopRegion, startBar: newStart });
      } else if (isDragging === 'END') {
          const newEnd = Math.max(currentBar, loopRegion.startBar + 1);
          onLoopChange({ ...loopRegion, endBar: newEnd });
      } else if (isDragging === 'NEW') {
          if (currentBar >= loopRegion.startBar) {
              onLoopChange({ ...loopRegion, endBar: currentBar + 1 });
          }
      }
  };

  const handleMouseUp = () => setIsDragging(null);

  // Markers generation based on totalBars prop
  const markers = [];
  
  for (let i = 0; i < totalBars; i++) {
      const leftPos = (i * pixelsPerBar);
      markers.push(
          <div key={`bar-${i}`} className="absolute top-0 bottom-0 border-l border-white/20 pl-1.5 select-none h-full group" style={{ left: `${leftPos}px` }}>
              <span className="text-[10px] font-mono font-bold text-gray-500 group-hover:text-white">{i + 1}</span>
          </div>
      );
      if (zoom > 0.6) {
        const beatWidth = pixelsPerBar / 4;
        for(let j=1; j<4; j++) {
             markers.push(
                <div key={`beat-${i}-${j}`} className="absolute bottom-0 h-1.5 border-l border-gray-700" style={{ left: `${leftPos + (j * beatWidth)}px` }}></div>
             );
        }
      }
  }

  return (
    <div 
        ref={rulerRef}
        className="relative h-9 w-full bg-[#151515] overflow-hidden flex-shrink-0 cursor-ew-resize select-none border-b border-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ minWidth: `${totalBars * pixelsPerBar}px` }} // Force width
    >
       <div className="absolute inset-0 pointer-events-none" style={{ width: `${totalBars * pixelsPerBar}px` }}>
          {markers}
       </div>

       {/* Loop Region Visuals */}
       {loopRegion.isActive && (
           <>
               {/* Selection Background */}
               <div 
                    className="absolute top-0 bottom-0 bg-green-500/10 border-b-2 border-green-500 z-10 pointer-events-none"
                    style={{ left: `${startPx}px`, width: `${widthPx}px` }}
               >
                   <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-900/80 px-1 rounded-b text-[8px] text-green-300 font-bold tracking-wider flex items-center">
                        <Repeat size={8} className="mr-1"/> LOOP
                   </div>
               </div>
               
               {/* Handles */}
               <div className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize z-20 hover:brightness-150" style={{ left: `${startPx}px` }} title="Inicio Loop"></div>
               <div className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-ew-resize z-20 hover:brightness-150" style={{ left: `${endPx}px` }} title="Fin Loop"></div>
           </>
       )}
    </div>
  );
});
