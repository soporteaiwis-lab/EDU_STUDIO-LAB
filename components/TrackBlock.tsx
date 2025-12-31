import React, { useEffect, useState, useRef } from 'react';
import { Track, UserMode } from '../types';
import { Mic, Music, Trash2, CircleDot, Drum, Guitar, Keyboard, Wind, Zap, Piano, Grid, MousePointerClick,  Activity, Edit3 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface TrackBlockProps {
  track: Track;
  mode: UserMode;
  bpm: number;
  zoom: number; // Global Zoom
  onVolumeChange: (id: string, val: number) => void;
  onPanChange?: (id: string, val: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onToggleArm: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onEditMidi?: (id: string) => void; 
}

export const TrackBlock: React.FC<TrackBlockProps> = ({ track, mode, bpm, zoom, onVolumeChange, onPanChange, onToggleMute, onToggleSolo, onToggleArm, onDelete, onSelect, onEditMidi }) => {
  const [waveformPath, setWaveformPath] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate Pixels Per Second based on Zoom
  const PIXELS_PER_SECOND = 40 * zoom; 

  useEffect(() => {
    const generate = () => {
       if (containerRef.current && (track.type === 'AUDIO' || track.type === 'SAMPLER')) {
          const width = containerRef.current.clientWidth;
          const height = mode === UserMode.EXPLORER ? 120 : 80; 
          const path = audioService.getWaveformPath(track.id, width, height);
          setWaveformPath(path);
       }
    };
    const interval = setInterval(generate, 1000); 
    return () => clearInterval(interval);
  }, [track.id, track.audioUrl, track.samplerUrl, mode, track.type, zoom]);

  const getIcon = () => {
    const size = mode === UserMode.EXPLORER ? 32 : 16;
    const props = { size, className: "text-gray-300" };
    switch (track.instrument) {
        case 'DRUMS': return <Drum {...props} />;
        case 'GUITAR': case 'BASS': return <Guitar {...props} />;
        case 'KEYS': return <Keyboard {...props} />;
        case 'VOCAL': return <Mic {...props} />;
        case 'WIND': return <Wind {...props} />;
        case 'FX': return <Zap {...props} />;
        case 'SAMPLER': return <MousePointerClick {...props} />;
        case 'CHORD': return <Grid {...props} />;
        default: return track.type === 'MIDI' ? <Piano {...props} /> : <Music {...props} />;
    }
  };

  const isSelectedClass = track.isSelected ? 'ring-2 ring-cyan-500 z-10 bg-[#2f2f2f]' : '';
  const stickyHeaderStyle = "sticky left-0 z-20 shadow-r-md";

  // --- CONTENT RENDERERS ---

  const renderMidiContent = () => {
      return (
          <div className="relative w-full h-full bg-[#181818] overflow-hidden group" onDoubleClick={() => onEditMidi && onEditMidi(track.id)}>
              {/* Subtle bar lines inside the track */}
              {Array.from({length: 50}).map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${i * ((60/bpm)*4 * PIXELS_PER_SECOND)}px` }}></div>
              ))}

              {track.midiNotes?.map((note, i) => (
                  <div key={i} className="absolute bg-cyan-500/80 border border-cyan-300 rounded-sm shadow-sm"
                    style={{
                        left: `${note.startTime * PIXELS_PER_SECOND}px`,
                        width: `${Math.max(4, note.duration * PIXELS_PER_SECOND)}px`,
                        top: `${Math.max(0, 100 - (note.midi - 36))}px`, 
                        height: '6px'
                    }}
                  />
              ))}
              {/* Overlay Button for Edit - Visible in all modes if hovered */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <button onClick={(e) => {e.stopPropagation(); if(onEditMidi) onEditMidi(track.id)}} className="bg-cyan-600 text-white text-xs px-2 py-1 rounded shadow flex items-center hover:bg-cyan-500">
                      <Edit3 size={12} className="mr-1"/> Editar MIDI
                  </button>
              </div>
          </div>
      );
  };

  const renderAudioContent = () => (
     <div className={`relative h-full w-full flex items-center justify-center opacity-90 z-10 ${track.color.replace('bg-', 'bg-opacity-20 ')}`}>
         {/* Vertical Grid Lines for alignment visual */}
         {Array.from({length: 50}).map((_, i) => (
              <div key={i} className="absolute top-0 bottom-0 border-l border-white/10 pointer-events-none" style={{ left: `${i * ((60/bpm)*4 * PIXELS_PER_SECOND)}px` }}></div>
         ))}
         
         {waveformPath && (
             <svg height={80} width="100%" preserveAspectRatio="none" className="w-full h-full absolute inset-0">
                 <path d={waveformPath} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="3" strokeLinecap="round" />
                 <path d={waveformPath} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeLinecap="round" />
             </svg>
         )}
         {!waveformPath && track.audioUrl && <span className="text-xs opacity-50 animate-pulse relative z-10 bg-black/50 px-2 rounded">Cargando Onda...</span>}
     </div>
  );

  const containerClass = mode === UserMode.EXPLORER ? "h-32 mb-4 rounded-2xl shadow-md border-4 border-white/30" : "bg-[#2a2a2a] border-b border-black h-28";
  
  // Explorer Mode (BASIC)
  if (mode === UserMode.EXPLORER) {
      return (
        <div 
            onClick={() => onSelect(track.id)} // IMPORTANT: Select track on click to show Piano
            className={`flex w-full ${containerClass} ${track.color} overflow-hidden relative shrink-0 transition-transform ${track.isSelected ? 'scale-[1.01] ring-4 ring-cyan-400' : 'hover:scale-[1.005]'}`}
        >
            <div className={`w-72 ${stickyHeaderStyle} bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center border-r-4 border-white/20 p-2 flex-shrink-0 relative`}>
                
                <div className="flex w-full items-center justify-between px-2 mb-2">
                    <div className="bg-white/20 p-2 rounded-full">{getIcon()}</div>
                    
                    {track.type !== 'CHORD' && (
                        <button 
                            onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} 
                            className={`p-3 rounded-full border-4 shadow-sm transition-all ${track.isArmed ? 'bg-red-500 border-red-200 animate-pulse text-white' : 'bg-gray-200 border-gray-300 text-gray-400 hover:bg-gray-300'}`}
                            title="GRABAR AQUÍ"
                        >
                            <CircleDot size={24} fill={track.isArmed ? "white" : "transparent"}/>
                        </button>
                    )}
                </div>

                <h3 className="font-fredoka text-lg font-bold text-white shadow-sm truncate w-full text-center mb-1">{track.name}</h3>
                
                <div className="w-full px-4">
                    <input 
                        type="range" min="0" max="100" value={track.volume} 
                        onChange={(e) => { e.stopPropagation(); onVolumeChange(track.id, parseInt(e.target.value)) }}
                        className="w-full h-2 rounded-lg appearance-none bg-white/30 cursor-pointer"
                    />
                </div>

                <button onClick={(e) => { e.stopPropagation(); onDelete(track.id) }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500/80 transition-colors"><Trash2 size={16}/></button>
            </div>
            
            <div className="flex-1 relative flex items-center bg-black/5 min-w-[800px]" ref={containerRef}>
                {track.type === 'MIDI' ? renderMidiContent() : renderAudioContent()}
            </div>
        </div>
      );
  }

  // Maker/Pro Mode
  return (
      <div onClick={() => onSelect(track.id)} className={`flex w-full ${containerClass} overflow-hidden group transition-all cursor-pointer ${isSelectedClass} shrink-0`}>
         <div className={`w-64 ${stickyHeaderStyle} bg-[#1e1e1e] border-r border-black text-gray-300 flex flex-col p-2 justify-between relative flex-shrink-0`}>
             <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: track.color.replace('bg-', 'rgb(').replace(')', ')') }}></div>
             
             <div className="pl-2 flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                    <div className="opacity-70 scale-75">{getIcon()}</div>
                    <span className="font-bold font-fredoka text-xs truncate w-24 text-gray-200">{track.name}</span>
                </div>
                <button onClick={(e) => {e.stopPropagation(); onDelete(track.id);}} className="text-gray-600 hover:text-red-400"><Trash2 size={12}/></button>
             </div>
             
             <div className="pl-2 flex items-center space-x-3 mb-1">
                 <div className="flex flex-col items-center">
                     <div className="w-6 h-6 rounded-full border border-gray-600 bg-[#222] relative flex items-center justify-center" title="Pan (L/R)">
                         <div className="w-0.5 h-2 bg-gray-400 absolute top-1 origin-bottom transition-transform" style={{ transform: `rotate(${track.pan * 1.8}deg)` }}></div>
                     </div>
                     <input 
                        type="range" min="-50" max="50" value={track.pan} 
                        onChange={(e) => { e.stopPropagation(); if(onPanChange) onPanChange(track.id, parseInt(e.target.value)) }}
                        className="opacity-0 absolute w-6 h-6 cursor-ew-resize"
                        title="Pan"
                     />
                     <span className="text-[8px] text-gray-500 mt-0.5">{track.pan === 0 ? 'C' : track.pan > 0 ? 'R' : 'L'}</span>
                 </div>

                 <div className="flex-1">
                     <input 
                        type="range" min="0" max="100" value={track.volume} 
                        onChange={(e) => {e.stopPropagation(); onVolumeChange(track.id, parseInt(e.target.value))}}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                        title={`Volumen: ${track.volume}%`}
                     />
                 </div>
                 <div className="text-[9px] font-mono text-cyan-500 w-6 text-right">{track.volume}</div>
             </div>

             <div className="pl-2 flex items-center space-x-1">
                {track.type !== 'CHORD' && (
                    <>
                        <button onClick={(e) => {e.stopPropagation(); onToggleMute(track.id);}} className={`px-2 py-0.5 rounded text-[9px] font-bold border border-gray-600 ${track.isMuted ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>M</button>
                        <button onClick={(e) => {e.stopPropagation(); onToggleSolo(track.id);}} className={`px-2 py-0.5 rounded text-[9px] font-bold border border-gray-600 ${track.isSolo ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>S</button>
                        <button 
                            onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} 
                            className={`p-1 rounded-full border ${track.isArmed ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-[#2a2a2a] text-gray-600 border-gray-600 hover:text-red-400'}`}
                            title={track.isArmed ? "Armada" : "Armar"}
                        >
                            <CircleDot size={10}/>
                        </button>
                    </>
                 )}
             </div>
         </div>
         <div className="flex-1 relative overflow-hidden flex items-center min-w-[800px] bg-[#222]" ref={containerRef}>
            {track.type === 'MIDI' ? renderMidiContent() : renderAudioContent()}
         </div>
      </div>
  );
};