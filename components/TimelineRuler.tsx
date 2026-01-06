
import React, { memo, useState, useRef } from 'react';
import { UserMode, LoopRegion } from '../types';
import { Repeat } from 'lucide-react';
import { audioService } from '../services/audioService';

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

  // Constants
  const PIXELS_PER_SECOND = 40 * zoom; 
  const SECONDS_PER_BAR = (60 / bpm) * 4; 
  const PIXELS_PER_BAR = SECONDS_PER_BAR * PIXELS_PER_SECOND;

  // Calculate pixel positions for loop handles
  const startPx = (loopRegion.startBar * PIXELS_PER_BAR);
  const endPx = (loopRegion.endBar * PIXELS_PER_BAR);
  const widthPx = endPx - startPx;

  const getBarFromX = (x: number) => {
     return Math.max(0, Math.floor(x / PIXELS_PER_BAR));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Check if clicking near start or end handle (tolerance 15px)
    if (Math.abs(x - startPx) < 15 && loopRegion.isActive) {
        setIsDragging('START');
    } else if (Math.abs(x - endPx) < 15 && loopRegion.isActive) {
        setIsDragging('END');
    } else {
        // SEEK LOGIC: Set Transport Time
        const time = x / PIXELS_PER_SECOND;
        audioService.setTime(Math.max(0, time));
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
      }
  };

  const handleMouseUp = () => setIsDragging(null);

  // Markers generation based on totalBars prop
  const markers = [];
  
  for (let i = 0; i < totalBars; i++) {
      const leftPos = (i * PIXELS_PER_BAR);
      const timeInSeconds = i * SECONDS_PER_BAR;
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      markers.push(
          <div key={`bar-${i}`} className="absolute top-0 bottom-0 border-l border-white/20 pl-1.5 select-none h-full group" style={{ left: `${leftPos}px` }}>
              <div className="flex flex-col justify-between h-full py-1">
                  <span className="text-[10px] font-mono font-bold text-gray-400 group-hover:text-white">{i + 1}</span>
                  {i % 4 === 0 && <span className="text-[8px] font-mono text-gray-600 group-hover:text-gray-400">{timeLabel}</span>}
              </div>
          </div>
      );
      if (zoom > 0.6) {
        const beatWidth = PIXELS_PER_BAR / 4;
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
        className="relative h-10 w-full bg-[#151515] overflow-hidden flex-shrink-0 cursor-pointer select-none border-b border-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ minWidth: `${totalBars * PIXELS_PER_BAR}px` }} 
    >
       <div className="absolute inset-0 pointer-events-none" style={{ width: `${totalBars * PIXELS_PER_BAR}px` }}>
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
               <div className="absolute top-0 bottom-0 w-2 bg-green-500 cursor-ew-resize z-20 hover:brightness-150 opacity-50 hover:opacity-100" style={{ left: `${startPx}px` }} title="Inicio Loop"></div>
               <div className="absolute top-0 bottom-0 w-2 bg-red-500 cursor-ew-resize z-20 hover:brightness-150 opacity-50 hover:opacity-100" style={{ left: `${endPx}px` }} title="Fin Loop"></div>
           </>
       )}
    </div>
  );
});
