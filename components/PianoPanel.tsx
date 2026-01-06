
import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { Minus, Plus, Zap, Maximize2, Settings, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';
import { MidiInstrumentName } from '../types';

interface PianoPanelProps {
  currentInstrument?: MidiInstrumentName;
  onClose: () => void;
}

export const PianoPanel: React.FC<PianoPanelProps> = ({ currentInstrument, onClose }) => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  
  // Piano Configuration
  const [startOctave, setStartOctave] = useState(3);
  const [numOctaves, setNumOctaves] = useState(2); // 2 octaves default (25 keys)
  const [sustain, setSustain] = useState(false);
  const [midiConnected, setMidiConnected] = useState(false);

  useEffect(() => {
      audioService.onMidiStatusChange = (isConnected) => setMidiConnected(isConnected);
      audioService.initializeMidi();
      
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

  const handleNoteStart = async (midi: number) => {
      await audioService.triggerMidiNoteOn(midi, 0.8);
  };

  const handleNoteEnd = (midi: number) => {
      audioService.triggerMidiNoteOff(midi);
  };

  // Generate Keys based on Range
  // Standard Piano starts at C usually for these ranges.
  const startNote = 12 * startOctave; // C{startOctave}
  const totalKeys = (numOctaves * 12) + 1; // +1 to end on C
  const keys = [];

  for(let i=0; i < totalKeys; i++) {
      const midi = startNote + i;
      const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const noteName = noteNames[midi % 12];
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      const octave = Math.floor(midi / 12) - 1;
      
      keys.push({ 
          midi, 
          note: `${noteName}${octave}`, 
          isBlack, 
          label: midi % 12 === 0 ? `C${octave}` : null 
      });
  }

  // Calculate Black Key Positions using Flexbox logic requires a different approach.
  // We will render White Keys in a Flex container.
  // Black keys will be absolute positioned children of the WHITE KEYS container, 
  // or we use a precise CSS grid.
  
  // Better Approach: 
  // Render a "KeyContainer" for every White Key. 
  // If the White Key has a Black Key to its right, render the Black Key absolutely positioned on the right edge.
  
  const whiteKeys = keys.filter(k => !k.isBlack);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-72 bg-[#121212] border-t-4 border-[#333] z-50 flex flex-col shadow-2xl animate-slide-up select-none">
        
        {/* CONTROL BAR */}
        <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
                
                {/* MIDI STATUS */}
                <span className="text-xs font-bold text-gray-500 uppercase flex items-center bg-black/20 px-3 py-1.5 rounded-full border border-gray-800">
                    <span className={`w-2 h-2 rounded-full mr-2 ${midiConnected ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-red-500'}`}></span>
                    {midiConnected ? "MIDI CONECTADO" : "MIDI OFF"}
                </span>

                {/* KEYBOARD SIZE PRESETS */}
                <div className="flex items-center space-x-1 bg-[#111] rounded p-1 border border-gray-700">
                    <span className="text-[10px] text-gray-500 font-bold px-2 uppercase">Tamaño</span>
                    <button onClick={() => setNumOctaves(2)} className={`px-2 py-1 text-xs font-bold rounded ${numOctaves===2 ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}>25</button>
                    <button onClick={() => setNumOctaves(4)} className={`px-2 py-1 text-xs font-bold rounded ${numOctaves===4 ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}>49</button>
                    <button onClick={() => setNumOctaves(5)} className={`px-2 py-1 text-xs font-bold rounded ${numOctaves===5 ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}>61</button>
                </div>

                {/* OCTAVE SHIFT */}
                <div className="flex items-center space-x-2 bg-[#111] rounded p-1 border border-gray-700">
                    <span className="text-[10px] text-gray-500 font-bold px-2 uppercase">Octava {startOctave}</span>
                    <button onClick={() => setStartOctave(Math.max(0, startOctave - 1))} className="p-1 text-gray-400 hover:text-white"><ArrowLeftCircle size={16}/></button>
                    <button onClick={() => setStartOctave(Math.min(7, startOctave + 1))} className="p-1 text-gray-400 hover:text-white"><ArrowRightCircle size={16}/></button>
                </div>

                {/* SUSTAIN */}
                <button 
                    onClick={toggleSustain}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${sustain ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-[#222] text-gray-500 border-gray-700 hover:bg-[#333]'}`}
                >
                    <Zap size={14} className={sustain ? "fill-current" : ""}/>
                    <span>Sostenimiento (Pedal)</span>
                </button>
            </div>

            <div className="flex items-center space-x-4">
                 <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Instrumento</div>
                    <div className="text-sm font-bold text-cyan-500 uppercase">{currentInstrument || 'Grand Piano'}</div>
                 </div>
                 <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Maximize2 size={20} className="rotate-180"/></button>
            </div>
        </div>

        {/* KEYS CONTAINER */}
        <div className="flex-1 relative overflow-x-auto overflow-y-hidden bg-[#0a0a0a] flex justify-center custom-scrollbar">
             <div className="relative h-full flex px-10"> {/* Padding x to allow scrolling if needed */}
                
                {whiteKeys.map((wk) => {
                     // Check if this white key has a black key to its right
                     // Logic: If next midi note is black, render it here.
                     const nextMidi = wk.midi + 1;
                     const hasBlackKey = [1, 3, 6, 8, 10].includes(nextMidi % 12);
                     
                     const isWhiteActive = activeNotes.has(wk.midi);
                     const isBlackActive = hasBlackKey ? activeNotes.has(nextMidi) : false;

                     return (
                        <div key={wk.midi} className="relative h-full flex-shrink-0">
                            {/* White Key */}
                            <div 
                                onMouseDown={(e) => { if(e.buttons === 1) handleNoteStart(wk.midi); }}
                                onMouseEnter={(e) => { if(e.buttons === 1) handleNoteStart(wk.midi); }}
                                onMouseUp={() => handleNoteEnd(wk.midi)}
                                onMouseLeave={() => handleNoteEnd(wk.midi)}
                                className={`w-12 h-full border-l border-b-4 border-r border-[#999] rounded-b-lg active:bg-gray-200 cursor-pointer transition-colors z-10 flex flex-col justify-end items-center pb-4 ${isWhiteActive ? 'bg-cyan-200 border-b-cyan-400' : 'bg-white hover:bg-gray-50 border-b-[#ccc]'}`}
                            >
                                {wk.label && <span className="text-gray-400 text-xs font-bold">{wk.label}</span>}
                            </div>
                            
                            {/* Black Key (Absolute relative to this white key) */}
                            {hasBlackKey && (
                                <div 
                                    className="absolute top-0 z-20"
                                    style={{ left: '32px', width: '32px', height: '60%' }} // Positioned exactly between keys
                                >
                                     <div 
                                        onMouseDown={(e) => { e.stopPropagation(); if(e.buttons === 1) handleNoteStart(nextMidi); }}
                                        onMouseEnter={(e) => { e.stopPropagation(); if(e.buttons === 1) handleNoteStart(nextMidi); }}
                                        onMouseUp={() => handleNoteEnd(nextMidi)}
                                        onMouseLeave={() => handleNoteEnd(nextMidi)}
                                        className={`w-8 mx-auto h-full rounded-b-md border-x border-b border-black cursor-pointer shadow-lg transition-colors ${isBlackActive ? 'bg-cyan-600' : 'bg-black hover:bg-[#222] bg-gradient-to-b from-[#333] to-black'}`}
                                     ></div>
                                </div>
                            )}
                        </div>
                     );
                })}
             </div>
        </div>
    </div>
  );
};
