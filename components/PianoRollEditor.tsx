import React, { useState, useRef } from 'react';
import { MidiNote, MidiInstrumentName } from '../types';
import { X, Trash2, ArrowRight, ArrowLeft, Grid, Music, Sliders, ChevronDown, Check, MousePointerClick } from 'lucide-react';
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
  const [gridSize, setGridSize] = useState<number>(0.25); // 1/4 beat
  const scrollRef = useRef<HTMLDivElement>(null);

  // Constants
  const PIXELS_PER_SECOND = 100 * zoom;
  const ROW_HEIGHT = 20;

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

  const handleQuantize = () => {
      // Simple quantization to nearest grid size
      const beatDuration = 60 / audioService.bpm;
      const snap = beatDuration * gridSize;
      
      const newNotes = notes.map(n => ({
          ...n,
          startTime: Math.round(n.startTime / snap) * snap,
          duration: Math.max(snap, Math.round(n.duration / snap) * snap)
      }));
      onUpdateNotes(trackId, newNotes);
  };

  const keys = [];
  for (let i = 84; i >= 36; i--) { // C6 to C2
      const noteName = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][i % 12];
      const octave = Math.floor(i / 12) - 1;
      const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
      keys.push({ midi: i, note: `${noteName}${octave}`, isBlack });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[500px] bg-[#1e1e1e] border-t-4 border-cyan-600 z-[60] flex flex-col shadow-2xl animate-slide-up select-none font-nunito">
        
        {/* HEADER TOOLBAR */}
        <div className="h-12 bg-[#252525] border-b border-black flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center space-x-6">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
                    <span className="font-bold text-gray-200 text-sm uppercase tracking-wider">{trackName}</span>
                </div>
                
                <div className="h-6 w-px bg-gray-700"></div>

                {/* Grid Snap Control */}
                <div className="flex items-center space-x-2 bg-black/20 p-1 rounded">
                    <Grid size={14} className="text-gray-400"/>
                    <select 
                        value={gridSize} 
                        onChange={(e) => setGridSize(parseFloat(e.target.value))}
                        className="bg-transparent text-xs text-gray-300 font-bold focus:outline-none"
                    >
                        <option value={1}>1/1</option>
                        <option value={0.5}>1/2</option>
                        <option value={0.25}>1/4</option>
                        <option value={0.125}>1/8</option>
                        <option value={0.0625}>1/16</option>
                    </select>
                </div>

                <button onClick={handleQuantize} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold text-gray-300 flex items-center transition-colors">
                    <Check size={14} className="mr-1"/> Cuantificar
                </button>
            </div>
            
            <div className="flex items-center space-x-3">
                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1.5 bg-gray-800 rounded hover:text-white text-gray-400"><ArrowLeft size={14}/></button>
                <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1.5 bg-gray-800 rounded hover:text-white text-gray-400"><ArrowRight size={14}/></button>
                <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded"><X size={20}/></button>
            </div>
        </div>

        {/* MAIN EDITOR LAYOUT */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* LEFT SIDEBAR CONTROLS */}
            <div className="w-48 bg-[#222] border-r border-black flex flex-col p-4 space-y-6 overflow-y-auto shrink-0">
                
                {selectedNoteIndex !== null ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-xs font-bold text-cyan-500 uppercase border-b border-gray-700 pb-1 mb-2">Nota Seleccionada</div>
                        
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Velocidad (Dinámica)</label>
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={notes[selectedNoteIndex].velocity}
                                onChange={(e) => handleUpdateNote('velocity', parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                            <span className="text-xs text-gray-300 font-mono">{notes[selectedNoteIndex].note}</span>
                            <button onClick={handleDeleteNote} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-50 mt-10">
                        <MousePointerClick size={32} className="mx-auto text-gray-600 mb-2"/>
                        <p className="text-xs text-gray-500">Selecciona una nota para editar sus propiedades</p>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Herramientas</div>
                    <button className="w-full text-left px-3 py-2 rounded text-xs text-gray-300 hover:bg-gray-700 mb-1 flex items-center">
                        <Sliders size={14} className="mr-2"/> Humanizar
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded text-xs text-gray-300 hover:bg-gray-700 flex items-center">
                        <Music size={14} className="mr-2"/> Transponer +1
                    </button>
                </div>
            </div>

            {/* PIANO KEYS COLUMN */}
            <div className="w-[60px] overflow-hidden border-r border-black bg-[#151515] relative z-20 shadow-lg shrink-0">
                <div className="absolute top-0 left-0 right-0" style={{ transform: `translateY(-${(scrollRef.current?.scrollTop || 0)}px)` }}>
                    {keys.map(k => (
                        <div 
                            key={k.midi} 
                            className={`h-[20px] border-b border-black/50 text-[9px] flex items-center justify-end pr-1 font-bold cursor-pointer ${k.isBlack ? 'bg-black text-gray-500' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                            onMouseDown={() => audioService.previewNote(k.note)}
                        >
                            {!k.isBlack && k.note.includes('C') && k.note}
                        </div>
                    ))}
                </div>
            </div>

            {/* MIDI GRID */}
            <div className="flex-1 overflow-auto bg-[#1a1a1a] relative cursor-crosshair" ref={scrollRef}>
                <div className="relative min-w-[2000px]" style={{ height: keys.length * ROW_HEIGHT }}>
                    
                    {/* Background Grid Rows */}
                    {keys.map((k, i) => (
                        <div key={i} className={`absolute w-full h-[20px] border-b border-white/5 ${k.isBlack ? 'bg-black/20' : ''}`} style={{ top: i * ROW_HEIGHT }}></div>
                    ))}
                    
                    {/* Vertical Beats Lines */}
                    {Array.from({length: 100}).map((_, i) => (
                        <div key={i} className={`absolute top-0 bottom-0 w-px ${i%4===0 ? 'border-r border-gray-600' : 'border-r border-gray-800 border-dashed'}`} style={{ left: i * (PIXELS_PER_SECOND * (60/120)) }}></div>
                    ))}

                    {/* NOTES RENDERING */}
                    {notes.map((note, i) => {
                        const rowIndex = keys.findIndex(k => k.midi === note.midi);
                        if (rowIndex === -1) return null;

                        return (
                            <div
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setSelectedNoteIndex(i); audioService.previewNote(note.note); }}
                                className={`absolute rounded-sm border flex items-center justify-between px-1 overflow-hidden group transition-all ${selectedNoteIndex === i ? 'bg-cyan-500 border-white z-10 shadow-[0_0_10px_cyan]' : 'bg-cyan-600/90 border-cyan-800 hover:brightness-110'}`}
                                style={{
                                    top: rowIndex * ROW_HEIGHT + 1,
                                    left: note.startTime * PIXELS_PER_SECOND,
                                    width: Math.max(10, note.duration * PIXELS_PER_SECOND),
                                    height: ROW_HEIGHT - 2,
                                    opacity: 0.6 + (note.velocity * 0.4) 
                                }}
                            >
                                <span className="text-[8px] font-bold text-black/50 truncate">{note.note}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};