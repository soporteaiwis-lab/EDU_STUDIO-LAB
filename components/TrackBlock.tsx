import React, { useEffect, useState, useRef } from 'react';
import { Track, UserMode } from '../types';
import { Mic, Music, Trash2, CircleDot, Drum, Guitar, Keyboard, Wind, Zap, Piano, Grid, MousePointerClick,  Activity } from 'lucide-react';
import { audioService } from '../services/audioService';

interface TrackBlockProps {
  track: Track;
  mode: UserMode;
  onVolumeChange: (id: string, val: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onToggleArm: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export const TrackBlock: React.FC<TrackBlockProps> = ({ track, mode, onVolumeChange, onToggleMute, onToggleSolo, onToggleArm, onDelete, onSelect }) => {
  const [waveformPath, setWaveformPath] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generate = () => {
       if (containerRef.current && (track.type === 'AUDIO' || track.type === 'SAMPLER')) {
          const width = containerRef.current.clientWidth;
          const height = mode === UserMode.EXPLORER ? 120 : 80; 
          const path = audioService.getWaveformPath(track.id, width, height);
          setWaveformPath(path);
       }
    };
    const timer = setTimeout(generate, 200);
    return () => clearTimeout(timer);
  }, [track.id, track.audioUrl, track.samplerUrl, mode, track.type]);

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

  const isSelectedClass = track.isSelected && mode !== UserMode.EXPLORER ? 'ring-1 ring-cyan-500 z-10' : '';
  const stickyHeaderStyle = "sticky left-0 z-20 shadow-r-md";

  // --- CONTENT RENDERERS ---

  const renderMidiContent = () => {
      // 40px per second is the default zoom
      const PIXELS_PER_SECOND = 40;
      
      return (
          <div className="relative w-full h-full bg-[#181818] overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_20px] opacity-20"></div>
              
              {track.midiNotes?.map((note, i) => (
                  <div 
                    key={i}
                    className="absolute bg-cyan-500/80 border border-cyan-300 rounded-sm shadow-sm"
                    style={{
                        left: `${note.startTime * PIXELS_PER_SECOND}px`,
                        width: `${Math.max(4, note.duration * PIXELS_PER_SECOND)}px`,
                        // Simple mapping of MIDI pitch to vertical position (C4 = 60 centered)
                        top: `${Math.max(0, 100 - (note.midi - 36))}px`, 
                        height: '6px'
                    }}
                    title={`${note.note} (Vel: ${Math.round(note.velocity*127)})`}
                  />
              ))}
              
              {(!track.midiNotes || track.midiNotes.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 text-xs font-mono text-cyan-500 pointer-events-none">
                      Pista MIDI (Grabar con Teclado)
                  </div>
              )}
          </div>
      );
  };

  const renderChordContent = () => (
    <div className="relative w-full h-full flex items-center">
        {track.chordData?.map((chord, idx) => (
            <div key={idx} onClick={(e) => {e.stopPropagation(); audioService.previewChord(chord.name)}} className="absolute h-16 bg-white border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-sm z-10 hover:bg-blue-50 cursor-pointer active:scale-95 transition-transform" style={{ left: `${(chord.bar - 1) * 160}px`, width: `156px`, top: '4px' }}>
                <span className="text-xl font-black text-blue-800">{chord.name}</span>
            </div>
        ))}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px)] bg-[size:160px_100%]"></div>
    </div>
  );

  const renderSamplerContent = () => (
      <div className="w-full h-full flex items-center bg-gray-900/50 relative overflow-hidden">
          {/* Visual indicator for Sampler/One Shot */}
          <div className="h-full w-24 bg-orange-500/10 border-r border-orange-500/30 flex flex-col items-center justify-center z-10 flex-shrink-0">
              <Activity size={20} className="text-orange-500 mb-1 opacity-80"/>
              <span className="text-[9px] font-bold text-orange-400 tracking-wider">ONE SHOT</span>
          </div>
          <div className="flex-1 h-full flex items-center justify-center relative">
               {waveformPath && <svg height="100%" width="100%" preserveAspectRatio="none"><path d={waveformPath} fill="none" stroke="#f97316" strokeWidth="2" /></svg>}
          </div>
      </div>
  );

  const renderAudioContent = () => (
     <div className={`relative h-full w-full flex items-center justify-center opacity-80 z-10 ${track.color.replace('bg-', 'bg-opacity-10 ')}`}>
         {waveformPath && <svg height={80} width="100%" preserveAspectRatio="none" className="w-full h-full"><path d={waveformPath} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" /></svg>}
     </div>
  );

  // --- MAIN RENDER ---
  const containerClass = mode === UserMode.EXPLORER 
      ? "h-32 mb-4 rounded-2xl shadow-md border-4 border-white/30" 
      : "bg-[#2a2a2a] border-b border-black h-24";
  
  // Explorer Mode
  if (mode === UserMode.EXPLORER) {
      return (
        <div className={`flex w-full ${containerClass} ${track.color} overflow-hidden relative shrink-0`}>
            {/* Header Basic Mode */}
            <div className={`w-72 ${stickyHeaderStyle} bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center border-r-4 border-white/20 p-2 flex-shrink-0 relative`}>
                <div className="flex w-full items-center justify-between px-2 mb-1">
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
                
                <div className="w-full px-2 flex items-center space-x-2">
                    <Music size={12} className="text-white"/>
                    <input 
                        type="range" min="0" max="100" value={track.volume} 
                        onChange={(e) => onVolumeChange(track.id, parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none bg-white/30 cursor-pointer"
                    />
                </div>

                <button onClick={() => onDelete(track.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500/80 transition-colors"><Trash2 size={16}/></button>
            </div>
            
            <div className="flex-1 relative flex items-center bg-black/5 min-w-[800px]" ref={containerRef}>
                {track.type === 'CHORD' ? renderChordContent() : track.type === 'SAMPLER' ? renderSamplerContent() : track.type === 'MIDI' ? renderMidiContent() : renderAudioContent()}
            </div>
        </div>
      );
  }

  // Maker/Pro Mode (Dark Theme)
  return (
      <div onClick={() => onSelect(track.id)} className={`flex w-full ${containerClass} overflow-hidden group transition-all cursor-pointer ${isSelectedClass} shrink-0`}>
         <div className={`w-64 ${stickyHeaderStyle} bg-[#1e1e1e] border-r border-black text-gray-300 flex flex-col p-3 justify-between relative flex-shrink-0`}>
             
             {/* Track Indicator Strip */}
             <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: track.color.replace('bg-', 'rgb(').replace(')', ')') }}></div>
             
             <div className="pl-2">
                 <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-2">
                        <div className="opacity-70 scale-75">{getIcon()}</div>
                        <span className="font-bold font-fredoka text-sm truncate w-24 text-gray-200">{track.name}</span>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(track.id);}} className="text-gray-600 hover:text-red-400"><Trash2 size={14}/></button>
                 </div>
                 
                 {/* Volume Slider (Cyan) */}
                 <div className="mb-2 mt-1 px-1">
                     <input 
                        type="range" min="0" max="100" value={track.volume} 
                        onChange={(e) => {e.stopPropagation(); onVolumeChange(track.id, parseInt(e.target.value))}}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                        title={`Volumen: ${track.volume}%`}
                     />
                 </div>

                 {/* CONTROLS */}
                 {track.type !== 'CHORD' && (
                    <div className="flex items-center space-x-1">
                        <button onClick={(e) => {e.stopPropagation(); onToggleMute(track.id);}} className={`px-2 py-0.5 rounded text-[9px] font-bold border border-gray-600 ${track.isMuted ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>M</button>
                        <button onClick={(e) => {e.stopPropagation(); onToggleSolo(track.id);}} className={`px-2 py-0.5 rounded text-[9px] font-bold border border-gray-600 ${track.isSolo ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>S</button>
                        <button 
                            onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} 
                            className={`p-1 rounded-full border ${track.isArmed ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-[#2a2a2a] text-gray-600 border-gray-600 hover:text-red-400'}`}
                            title={track.isArmed ? "Armada" : "Armar"}
                        >
                            <CircleDot size={10}/>
                        </button>
                    </div>
                 )}
             </div>
         </div>
         <div className="flex-1 relative overflow-hidden flex items-center min-w-[800px] bg-[#222]" ref={containerRef}>
            {track.type === 'CHORD' ? renderChordContent() : track.type === 'SAMPLER' ? renderSamplerContent() : track.type === 'MIDI' ? renderMidiContent() : renderAudioContent()}
         </div>
      </div>
  );
};