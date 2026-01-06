
import React, { useEffect, useState, useRef } from 'react';
import { Track, UserMode } from '../types';
import { Mic, Music, Trash2, CircleDot, Drum, Guitar, Keyboard, Wind, Zap, Piano, Grid, MousePointerClick,  Activity, Edit3, Volume2, MoveHorizontal } from 'lucide-react';
import { audioService } from '../services/audioService';

interface TrackBlockProps {
  track: Track;
  mode: UserMode;
  bpm: number;
  zoom: number; // Global Zoom
  totalWidth?: number; // Total project width in pixels
  onVolumeChange: (id: string, val: number) => void;
  onPanChange?: (id: string, val: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onToggleArm: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onEditMidi?: (id: string) => void; 
}

export const TrackBlock: React.FC<TrackBlockProps> = ({ track, mode, bpm, zoom, totalWidth, onVolumeChange, onPanChange, onToggleMute, onToggleSolo, onToggleArm, onDelete, onSelect, onEditMidi }) => {
  const [waveformPath, setWaveformPath] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate Pixels Per Second based on Zoom
  const PIXELS_PER_SECOND = 40 * zoom; 

  // Determine if this is a MIDI-based track (Notes) or Audio-based (Waveform)
  const isMidiTrack = ['MIDI', 'CHORD', 'MELODY'].includes(track.type);

  useEffect(() => {
    const generate = () => {
       // Only generate waveform for Audio/Sampler types
       if (containerRef.current && (track.type === 'AUDIO' || track.type === 'SAMPLER')) {
          const width = containerRef.current.clientWidth;
          const height = mode === UserMode.EXPLORER ? 140 : 80; 
          const path = audioService.getWaveformPath(track.id, width, height);
          setWaveformPath(path);
       }
    };
    const interval = setInterval(generate, 500); 
    return () => clearInterval(interval);
  }, [track.id, track.audioUrl, track.samplerUrl, mode, track.type, zoom]);

  const getIcon = () => {
    const size = mode === UserMode.EXPLORER ? 40 : 18;
    const colorClass = mode === UserMode.EXPLORER 
        ? track.color.replace('bg-', 'text-').replace('600', '600').replace('500', '600') 
        : "text-gray-300";
        
    const props = { size, className: colorClass };
    
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

  const isSelectedClass = track.isSelected 
    ? (mode === UserMode.EXPLORER ? 'ring-4 ring-cyan-400 transform scale-[1.01] z-20 shadow-xl' : 'ring-2 ring-cyan-500 z-10 bg-[#2f2f2f]') 
    : '';
  
  const stickyHeaderStyle = "sticky left-0 z-20 shadow-xl";

  // --- CONTENT RENDERERS ---

  const renderMidiContent = () => {
      const bgClass = mode === UserMode.EXPLORER ? "bg-white" : "bg-[#181818]";
      const gridColor = mode === UserMode.EXPLORER ? "border-gray-100" : "border-white/5";
      const noteColor = mode === UserMode.EXPLORER ? "bg-cyan-500 border-cyan-600" : "bg-cyan-500/80 border-cyan-300";

      return (
          <div className={`relative w-full h-full ${bgClass} overflow-hidden group border-l border-gray-200`} onDoubleClick={() => onEditMidi && onEditMidi(track.id)}>
              {/* Grid Lines */}
              {Array.from({length: 50}).map((_, i) => (
                  <div key={i} className={`absolute top-0 bottom-0 border-l ${gridColor}`} style={{ left: `${i * ((60/bpm)*4 * PIXELS_PER_SECOND)}px` }}>
                      {mode === UserMode.EXPLORER && <span className="text-[9px] text-gray-300 ml-1">{i+1}</span>}
                  </div>
              ))}

              {/* Render Notes (Handles AI Chords/Melodies too) */}
              {track.midiNotes?.map((note, i) => (
                  <div key={i} className={`absolute ${noteColor} rounded-md shadow-sm border`}
                    style={{
                        left: `${note.startTime * PIXELS_PER_SECOND}px`,
                        width: `${Math.max(6, note.duration * PIXELS_PER_SECOND)}px`,
                        top: `${Math.max(0, 100 - (note.midi - 36))}px`, 
                        height: '8px'
                    }}
                    title={`${note.note} (Vel: ${note.velocity})`}
                  />
              ))}
              
              {/* Overlay for interaction hint */}
              {mode === UserMode.EXPLORER && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/50 transition-opacity backdrop-blur-sm">
                    <button onClick={(e) => {e.stopPropagation(); if(onEditMidi) onEditMidi(track.id)}} className="bg-cyan-600 text-white text-sm font-bold px-6 py-3 rounded-full shadow-lg flex items-center hover:bg-cyan-700 hover:scale-105 transition-all">
                        <Edit3 size={18} className="mr-2"/> Abrir Editor
                    </button>
                </div>
              )}
          </div>
      );
  };

  const renderAudioContent = () => {
      const isExplorer = mode === UserMode.EXPLORER;
      // Basic logic to get a hex roughly from tailwind name for stroke, or fallback to dark gray
      const strokeColor = isExplorer ? "#374151" : "rgba(255,255,255,0.8)";
      
      return (
        <div className={`relative h-full w-full flex items-center justify-center z-10 ${isExplorer ? 'bg-white' : track.color.replace('bg-', 'bg-opacity-20 ')}`}>
            {/* Grid Lines */}
            {Array.from({length: 50}).map((_, i) => (
                    <div key={i} className={`absolute top-0 bottom-0 border-l pointer-events-none ${isExplorer ? 'border-gray-100' : 'border-white/10'}`} style={{ left: `${i * ((60/bpm)*4 * PIXELS_PER_SECOND)}px` }}></div>
            ))}
            
            {waveformPath && (
                <svg height={isExplorer ? 140 : 80} width="100%" preserveAspectRatio="none" className="w-full h-full absolute inset-0">
                    {/* Shadow/Depth Line */}
                    {isExplorer && <path d={waveformPath} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="4" strokeLinecap="round" transform="translate(1, 2)" />}
                    {/* Main Line */}
                    <path d={waveformPath} fill="none" stroke={isExplorer ? strokeColor : "rgba(255,255,255,0.8)"} strokeWidth={isExplorer ? "3" : "1"} strokeLinecap="round" />
                </svg>
            )}
            {!waveformPath && track.audioUrl && (
                <div className="flex flex-col items-center animate-pulse opacity-50">
                    <Activity size={24} className="text-gray-400 mb-2"/>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Procesando Audio...</span>
                </div>
            )}
            
            {/* Visual Indicator for "Empty & Armed" */}
            {track.isArmed && !track.audioUrl && isExplorer && (
                <div className="absolute inset-0 bg-red-50/50 flex items-center justify-center border-2 border-dashed border-red-200 m-2 rounded-xl">
                    <div className="text-red-300 font-bold text-lg flex items-center">
                        <Mic className="mr-2 animate-bounce"/> Esperando grabación...
                    </div>
                </div>
            )}
        </div>
      );
  };

  const containerClass = mode === UserMode.EXPLORER ? "h-40 mb-6 rounded-3xl shadow-md border-4 border-white transition-all bg-white" : "bg-[#2a2a2a] border-b border-black h-28";
  
  const widthStyle = totalWidth ? { width: `${totalWidth}px` } : { minWidth: '100%' };

  // --- EXPLORER MODE (DIDACTIC DESIGN) ---
  if (mode === UserMode.EXPLORER) {
      let headerBg = "bg-gray-50";
      if(track.color.includes('rose') || track.color.includes('red')) headerBg = "bg-red-50";
      if(track.color.includes('blue') || track.color.includes('cyan') || track.color.includes('sky')) headerBg = "bg-blue-50";
      if(track.color.includes('green') || track.color.includes('emerald')) headerBg = "bg-green-50";
      if(track.color.includes('yellow') || track.color.includes('amber') || track.color.includes('orange')) headerBg = "bg-orange-50";
      if(track.color.includes('purple') || track.color.includes('violet')) headerBg = "bg-purple-50";

      return (
        <div 
            onClick={() => onSelect(track.id)} 
            className={`flex w-full ${containerClass} overflow-hidden relative shrink-0 cursor-pointer ${isSelectedClass}`}
        >
            {/* HEADER PANEL (Control Station) */}
            <div className={`w-80 ${stickyHeaderStyle} ${headerBg} flex flex-col border-r-2 border-gray-100 flex-shrink-0 relative`}>
                
                {/* Top Row: Icon + Name + Delete (CORNERED) */}
                <div className="flex items-center justify-between p-3 pb-1">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100">
                            {getIcon()}
                        </div>
                        <h3 className="font-fredoka text-xl font-bold text-gray-700 truncate" title={track.name}>{track.name}</h3>
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(track.id) }} 
                        className="p-2 rounded-xl text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                        title="Eliminar Pista"
                    >
                        <Trash2 size={20}/>
                    </button>
                </div>

                {/* Middle Row: Primary Actions */}
                <div className="flex-1 flex items-center justify-between px-4 py-2">
                    {track.type !== 'CHORD' && (
                        <div className="flex flex-col items-center justify-center w-full">
                            <button 
                                onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} 
                                className={`
                                    relative group w-full py-2 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all shadow-sm
                                    ${track.isArmed 
                                        ? 'bg-red-500 border-red-600 text-white shadow-red-200 animate-pulse' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-500 hover:shadow-md'
                                    }
                                `}
                                title={track.isArmed ? "LISTO PARA GRABAR" : "ACTIVAR GRABACIÓN"}
                            >
                                <CircleDot size={24} fill={track.isArmed ? "currentColor" : "none"} className={track.isArmed ? "animate-ping absolute opacity-20" : ""}/>
                                <CircleDot size={24} fill={track.isArmed ? "currentColor" : "none"} className="relative z-10"/>
                                <span className="font-bold text-sm uppercase tracking-wider relative z-10">
                                    {track.isArmed ? 'GRABANDO...' : 'GRABAR'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Bottom Row: Volume Slider */}
                <div className="px-5 pb-4 pt-1 flex items-center space-x-3">
                    <Volume2 size={18} className="text-gray-400"/>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full relative overflow-hidden">
                        <div 
                            className={`absolute top-0 left-0 h-full rounded-full ${track.color.replace('bg-', 'bg-')}`} 
                            style={{width: `${track.volume}%`}}
                        ></div>
                        <input 
                            type="range" min="0" max="100" value={track.volume} 
                            onChange={(e) => { e.stopPropagation(); onVolumeChange(track.id, parseInt(e.target.value)) }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

            </div>
            
            {/* TRACK CONTENT (Auto switch Audio vs MIDI) */}
            <div className="flex-1 relative flex items-center bg-white overflow-hidden" ref={containerRef} style={widthStyle}>
                {isMidiTrack ? renderMidiContent() : renderAudioContent()}
            </div>
        </div>
      );
  }

  // --- MAKER / PRO MODE (Darker) ---
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
                 <div className="flex-1">
                     <input 
                        type="range" min="0" max="100" value={track.volume} 
                        onChange={(e) => {e.stopPropagation(); onVolumeChange(track.id, parseInt(e.target.value))}}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                     />
                 </div>
             </div>

             <div className="pl-2 flex items-center space-x-1">
                {track.type !== 'CHORD' && (
                    <>
                        <button onClick={(e) => {e.stopPropagation(); onToggleMute(track.id);}} className={`px-2 py-0.5 rounded text-[9px] font-bold border border-gray-600 ${track.isMuted ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>M</button>
                        <button onClick={(e) => {e.stopPropagation(); onToggleSolo(track.id);}} className={`px-2 py-0.5 rounded text-[9px] font-bold border border-gray-600 ${track.isSolo ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>S</button>
                        <button 
                            onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} 
                            className={`p-1 rounded-full border ${track.isArmed ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-[#2a2a2a] text-gray-600 border-gray-600 hover:text-red-400'}`}
                        >
                            <CircleDot size={10}/>
                        </button>
                    </>
                 )}
             </div>
         </div>
         <div className="flex-1 relative overflow-hidden flex items-center bg-[#222]" ref={containerRef} style={widthStyle}>
            {isMidiTrack ? renderMidiContent() : renderAudioContent()}
         </div>
      </div>
  );
};
