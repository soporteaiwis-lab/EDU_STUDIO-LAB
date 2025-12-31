
import React, { useState, useEffect, useRef } from 'react';
import { MidiNote, MidiInstrumentName } from '../types';
import { X, Play, Square, Trash2, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { audioService } from '../services/audioService';

interface PianoRollEditorProps {
  trackId: string;
  trackName: string;
  notes: MidiNote[];
  instrument: MidiInstrumentName;
  onUpdateNotes: (trackId: string, notes: MidiNote[]) => void;
  onClose: () => void;
}

export const PianoRollEditor: React.FC<PianoRollEditorProps> = ({ trackId, trackName, notes, instrument, onUpdateNotes, onClose }) => {
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Constants
  const PIXELS_PER_SECOND = 100 * zoom;
  const ROW_HEIGHT = 20;
  const KEY_WIDTH = 60;

  const handleDeleteNote = () => {
      if (selectedNoteIndex !== null) {
          const newNotes = [...notes];
          newNotes.splice(selectedNoteIndex, 1);
          onUpdateNotes(trackId, newNotes);
          setSelectedNoteIndex(null);
      }
  };

  const handleUpdateNote = (field: keyof MidiNote, value: number) => {
      if (selectedNoteIndex !== null) {
          const newNotes = [...notes];
          newNotes[selectedNoteIndex] = { ...newNotes[selectedNoteIndex], [field]: value };
          onUpdateNotes(trackId, newNotes);
      }
  };

  const keys = [];
  for (let i = 84; i >= 36; i--) { // C6 to C2
      const noteName = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][i % 12];
      const octave = Math.floor(i / 12) - 1;
      const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
      keys.push({ midi: i, note: `${noteName}${octave}`, isBlack });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-96 bg-[#1e1e1e] border-t-4 border-cyan-600 z-[60] flex flex-col shadow-2xl animate-slide-up select-none">
        
        {/* TOOLBAR */}
        <div className="h-10 bg-[#252525] border-b border-black flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
                <span className="font-bold text-cyan-400 text-sm flex items-center uppercase">
                    <span className="bg-cyan-900/50 px-2 py-0.5 rounded mr-2 border border-cyan-700">MIDI</span> 
                    {trackName}
                </span>
                
                {selectedNoteIndex !== null ? (
                    <div className="flex items-center space-x-2 text-xs text-gray-300 bg-black/30 px-2 py-1 rounded">
                        <span className="font-bold text-white">Nota Seleccionada:</span>
                        <div className="flex items-center space-x-1">
                            <span>Vel:</span>
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={notes[selectedNoteIndex].velocity}
                                onChange={(e) => handleUpdateNote('velocity', parseFloat(e.target.value))}
                                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>
                        <button onClick={handleDeleteNote} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-500 italic">Haz clic en una nota para editar</span>
                )}
            </div>
            
            <div className="flex items-center space-x-2">
                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 text-gray-400 hover:text-white"><ArrowLeft size={16}/></button>
                <span className="text-xs text-gray-500 font-mono">ZOOM</span>
                <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 text-gray-400 hover:text-white"><ArrowRight size={16}/></button>
                <div className="w-px h-4 bg-gray-700 mx-2"></div>
                <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
            </div>
        </div>

        {/* EDITOR AREA */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* PIANO KEYS (Left) */}
            <div className="w-[60px] overflow-hidden border-r border-black bg-[#111] relative z-20 shadow-lg">
                <div className="absolute top-0 left-0 right-0" style={{ transform: `translateY(-${(scrollRef.current?.scrollTop || 0)}px)` }}>
                    {keys.map(k => (
                        <div 
                            key={k.midi} 
                            className={`h-[20px] border-b border-black text-[9px] flex items-center justify-end pr-1 font-bold ${k.isBlack ? 'bg-black text-gray-500' : 'bg-white text-gray-800'}`}
                            onMouseDown={() => audioService.previewNote(k.note)}
                        >
                            {!k.isBlack && k.note.includes('C') && k.note}
                        </div>
                    ))}
                </div>
            </div>

            {/* GRID (Right) */}
            <div className="flex-1 overflow-auto bg-[#181818] relative cursor-crosshair" ref={scrollRef}>
                <div className="relative min-w-[2000px]" style={{ height: keys.length * ROW_HEIGHT }}>
                    
                    {/* Background Grid */}
                    {keys.map((k, i) => (
                        <div key={i} className={`absolute w-full h-[20px] border-b border-white/5 ${k.isBlack ? 'bg-black/20' : ''}`} style={{ top: i * ROW_HEIGHT }}></div>
                    ))}
                    {/* Vertical Beats */}
                    {Array.from({length: 100}).map((_, i) => (
                        <div key={i} className={`absolute top-0 bottom-0 w-px ${i%4===0 ? 'border-r border-gray-600' : 'border-r border-gray-800 border-dashed'}`} style={{ left: i * (PIXELS_PER_SECOND * (60/120)) }}></div>
                    ))}

                    {/* NOTES */}
                    {notes.map((note, i) => {
                        // Calculate Top Position: (84 (Max MIDI) - note.midi) * ROW_HEIGHT
                        // Keys array starts at 84. index 0.
                        const rowIndex = keys.findIndex(k => k.midi === note.midi);
                        if (rowIndex === -1) return null;

                        return (
                            <div
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setSelectedNoteIndex(i); audioService.previewNote(note.note); }}
                                className={`absolute rounded-sm border flex items-center justify-between px-1 overflow-hidden group ${selectedNoteIndex === i ? 'bg-cyan-500 border-white z-10 shadow-md' : 'bg-cyan-700/80 border-cyan-900'}`}
                                style={{
                                    top: rowIndex * ROW_HEIGHT + 1,
                                    left: note.startTime * PIXELS_PER_SECOND,
                                    width: Math.max(10, note.duration * PIXELS_PER_SECOND),
                                    height: ROW_HEIGHT - 2,
                                    opacity: 0.5 + (note.velocity * 0.5) // Visual velocity
                                }}
                            >
                                <span className="text-[8px] font-bold text-black opacity-50 truncate">{note.note}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};
