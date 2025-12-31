import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { Minus, Plus, Zap, Maximize2, Settings, ArrowUpCircle } from 'lucide-react';
import { MidiInstrumentName } from '../types';

interface PianoPanelProps {
  currentInstrument?: MidiInstrumentName;
  onClose: () => void;
}

export const PianoPanel: React.FC<PianoPanelProps> = ({ currentInstrument, onClose }) => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [octave, setOctave] = useState(3);
  const [sustain, setSustain] = useState(false);
  const [midiConnected, setMidiConnected] = useState(false);
  const [scaleMode, setScaleMode] = useState('Chromatic');

  useEffect(() => {
      // Connect to MIDI Status
      audioService.onMidiStatusChange = (isConnected) => {
          setMidiConnected(isConnected);
      };
      
      // Initialize Audio Midi
      audioService.initializeMidi();

      // Visualize Notes
      audioService.onMidiNoteActive = (note, vel) => {
          setActiveNotes(prev => {
              const newSet = new Set(prev);
              if (vel > 0) newSet.add(note);
              else newSet.delete(note);
              return newSet;
          });
      };
      return () => { 
          audioService.onMidiNoteActive = null; 
          audioService.onMidiStatusChange = null;
      };
  }, []);

  const toggleSustain = () => {
      const newState = !sustain;
      setSustain(newState);
      audioService.setSustain(newState);
  };

  // Generate Keys based on Octave
  const startNote = 12 * octave; // C{octave}
  const endNote = startNote + 24; // 2 Octaves
  const keys = [];
  const isBlack = (n: number) => [1, 3, 6, 8, 10].includes(n % 12);

  for(let i=startNote; i<=endNote; i++) {
      const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const noteName = noteNames[i % 12];
      const oct = Math.floor(i / 12) - 1;
      keys.push({ midi: i, note: `${noteName}${oct}`, isBlack: isBlack(i), label: i % 12 === 0 ? `C${oct}` : null });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-[#121212] border-t-4 border-[#333] z-50 flex flex-col shadow-2xl animate-slide-up">
        
        {/* CONTROL BAR */}
        <div className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4">
            <div className="flex items-center space-x-6">
                <span className="text-sm font-bold text-gray-400 uppercase flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${midiConnected ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-red-500'}`}></span>
                    {midiConnected ? "MIDI ON" : "MIDI OFF"}
                </span>

                <div className="flex items-center space-x-2 bg-[#111] rounded p-1 border border-gray-700">
                    <span className="text-xs text-gray-500 font-bold px-2">Octava {octave}</span>
                    <button onClick={() => setOctave(Math.max(0, octave - 1))} className="p-1 text-gray-400 hover:text-white"><Minus size={14}/></button>
                    <button onClick={() => setOctave(Math.min(7, octave + 1))} className="p-1 text-gray-400 hover:text-white"><Plus size={14}/></button>
                </div>

                <button 
                    onClick={toggleSustain}
                    className={`flex items-center space-x-2 px-3 py-1 rounded border text-xs font-bold transition-all ${sustain ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500' : 'bg-[#222] text-gray-500 border-gray-700'}`}
                >
                    <Zap size={12} className={sustain ? "fill-current" : ""}/>
                    <span>Sostenimiento</span>
                </button>

                <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-bold">Escala</span>
                    <select value={scaleMode} onChange={(e) => setScaleMode(e.target.value)} className="bg-[#222] text-gray-300 text-xs p-1 rounded border border-gray-700 focus:outline-none">
                        <option>Chromatic</option>
                        <option>Major</option>
                        <option>Minor</option>
                        <option>Pentatonic</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                 <span className="text-xs font-bold text-cyan-500 uppercase">{currentInstrument || 'Grand Piano'}</span>
                 <button onClick={onClose} className="text-gray-500 hover:text-white"><Maximize2 size={16} className="rotate-180"/></button>
            </div>
        </div>

        {/* KEYS CONTAINER */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0a0a] select-none flex justify-center">
             <div className="relative h-full flex">
                {/* White Keys */}
                {keys.map((k) => {
                    if(!k.isBlack) {
                         const isActive = activeNotes.has(k.midi);
                         return (
                            <div 
                                key={k.midi}
                                onMouseDown={() => audioService.triggerMidiNoteOn(k.midi, 0.8)}
                                onMouseUp={() => audioService.triggerMidiNoteOff(k.midi)}
                                onMouseLeave={() => audioService.triggerMidiNoteOff(k.midi)}
                                className={`w-14 h-full border-r border-[#333] rounded-b-lg active:bg-gray-300 flex flex-col justify-end items-center pb-2 cursor-pointer transition-colors ${isActive ? 'bg-cyan-200' : 'bg-white hover:bg-gray-100'}`}
                            >
                                {k.label && <span className="text-[#999] font-bold text-xs">{k.label}</span>}
                            </div>
                         )
                    }
                    return null;
                })}

                {/* Black Keys (Overlay) */}
                <div className="absolute top-0 left-0 flex h-32 pointer-events-none">
                    {/* Spacer logic needed for absolute positioning.
                        Simplification: Render keys absolute based on index. 
                    */}
                    {keys.map((k, i) => {
                        if(k.isBlack) {
                            // Find how many white keys came before this in THIS specific array slice
                            // This is tricky without exact pixel math.
                            // Better approach: Calculate offset based on pattern 
                            // 12 notes = 7 white keys.
                            // C(0), D(2), E(4), F(5), G(7), A(9), B(11)
                            
                            // Let's use a simpler heuristic for this demo component:
                            // We need to find the PREVIOUS white key index to anchor this black key.
                            
                            // Re-calculate visual offset:
                            // Each white key is w-14 (56px approx). 
                            // We iterate and sum width.
                            
                            const whiteKeysBefore = keys.slice(0, i).filter(key => !key.isBlack).length;
                            const leftOffset = (whiteKeysBefore * 56) - 18; // Center on line
                            
                            const isActive = activeNotes.has(k.midi);

                            return (
                                <div 
                                    key={k.midi}
                                    style={{ left: `${leftOffset}px` }}
                                    className="absolute w-9 h-full pointer-events-auto"
                                >
                                    <div 
                                        onMouseDown={() => audioService.triggerMidiNoteOn(k.midi, 0.8)}
                                        onMouseUp={() => audioService.triggerMidiNoteOff(k.midi)}
                                        onMouseLeave={() => audioService.triggerMidiNoteOff(k.midi)}
                                        className={`w-full h-full rounded-b-md border border-black cursor-pointer transition-colors ${isActive ? 'bg-cyan-600' : 'bg-black hover:bg-[#222]'}`}
                                    ></div>
                                </div>
                            )
                        }
                        return null;
                    })}
                </div>
             </div>
        </div>
    </div>
  );
};
