import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

export const VirtualKeyboard: React.FC = () => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  useEffect(() => {
      audioService.onMidiNoteActive = (note, vel) => {
          setActiveNotes(prev => {
              const newSet = new Set(prev);
              if (vel > 0) newSet.add(note);
              else newSet.delete(note);
              return newSet;
          });
      };
      return () => { audioService.onMidiNoteActive = null; };
  }, []);

  const startNote = 48; // C3
  const endNote = 72;   // C5
  const keys = [];

  const isBlack = (n: number) => [1, 3, 6, 8, 10].includes(n % 12);

  // Generate Key Objects
  for(let i=startNote; i<=endNote; i++) {
      const noteName = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][i % 12];
      const octave = Math.floor(i / 12) - 1;
      keys.push({ midi: i, note: `${noteName}${octave}`, isBlack: isBlack(i) });
  }

  return (
    <div className="h-24 bg-gray-900 border-t border-black flex items-start justify-center py-1 overflow-hidden relative select-none">
        <div className="flex relative h-full">
            {keys.map((k, i) => {
                if (!k.isBlack) {
                    const isActive = activeNotes.has(k.midi);
                    return (
                        <div 
                            key={k.midi}
                            onMouseDown={() => audioService.triggerMidiNoteOn(k.midi, 0.8)}
                            onMouseUp={() => audioService.triggerMidiNoteOff(k.midi)}
                            onMouseLeave={() => audioService.triggerMidiNoteOff(k.midi)}
                            className={`w-10 h-full border border-gray-400 rounded-b-md mx-[1px] origin-top transition-all relative z-10 flex items-end justify-center pb-1 cursor-pointer ${isActive ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 'bg-white hover:bg-gray-100 active:bg-gray-200'}`}
                        >
                            <span className="text-[9px] text-gray-400 font-bold">{k.note}</span>
                        </div>
                    )
                } 
                return null;
            })}
            
            {/* Render Black Keys Absolute */}
            {keys.map((k, i) => {
                if (k.isBlack) {
                    const isActive = activeNotes.has(k.midi);
                    // Calculate position relative to white keys
                    const whiteKeysBefore = keys.slice(0, i).filter(key => !key.isBlack).length;
                    const leftPos = (whiteKeysBefore * 42) - 14; // Approx logic
                    
                    return (
                        <div 
                            key={k.midi}
                            onMouseDown={() => audioService.triggerMidiNoteOn(k.midi, 0.8)}
                            onMouseUp={() => audioService.triggerMidiNoteOff(k.midi)}
                            onMouseLeave={() => audioService.triggerMidiNoteOff(k.midi)}
                            className={`w-7 h-14 border border-gray-800 rounded-b-sm absolute z-20 origin-top transition-all cursor-pointer ${isActive ? 'bg-cyan-600 shadow-[0_0_10px_cyan]' : 'bg-black active:bg-gray-800'}`}
                            style={{ left: `${leftPos}px` }}
                        >
                        </div>
                    )
                }
                return null;
            })}
        </div>
        <div className="absolute top-0 right-0 p-1 text-[9px] text-gray-500 font-bold uppercase flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${activeNotes.size > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {activeNotes.size > 0 ? 'MIDI SIGNAL' : 'NO MIDI'}
        </div>
    </div>
  );
};