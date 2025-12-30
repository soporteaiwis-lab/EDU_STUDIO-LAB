import React, { useEffect, useState, useRef } from 'react';
import { Track, UserMode, InstrumentType } from '../types';
import { Volume2, Mic, Music, Disc, Trash2, CircleDot, Drum, Guitar, Keyboard, Wind, Zap, Piano, Grid } from 'lucide-react';
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
       if (containerRef.current && track.type === 'AUDIO') {
          const width = containerRef.current.clientWidth;
          const height = mode === UserMode.EXPLORER ? 120 : 80; 
          const path = audioService.getWaveformPath(track.id, width, height);
          setWaveformPath(path);
       }
    };
    const timer = setTimeout(generate, 200);
    return () => clearTimeout(timer);
  }, [track.id, track.audioUrl, mode, track.type]);

  const getIcon = () => {
    const size = mode === UserMode.EXPLORER ? 32 : 16;
    const props = { size, className: mode === UserMode.PRO ? "text-gray-400" : "text-white" };
    
    switch (track.instrument) {
        case 'DRUMS': return <Drum {...props} />;
        case 'GUITAR': 
        case 'BASS': return <Guitar {...props} />;
        case 'KEYS': return <Keyboard {...props} />;
        case 'VOCAL': return <Mic {...props} />;
        case 'WIND': return <Wind {...props} />;
        case 'FX': return <Zap {...props} />;
        case 'CHORD': return <Grid {...props} />;
        default: return track.type === 'MIDI' ? <Piano {...props} /> : <Music {...props} />;
    }
  };

  const isSelectedClass = track.isSelected && mode !== UserMode.EXPLORER ? 'ring-2 ring-blue-500 z-10' : '';
  const stickyHeaderStyle = "sticky left-0 z-20 shadow-r-md";

  // --- RENDER CHORD TRACK CONTENT ---
  const renderChordContent = () => {
      // Assuming 120bpm, 4/4 sig, 40px per second -> ~80px per bar (2s per bar)
      // This is approximate. Studio.tsx handles exact Ruler logic. 
      // We will blindly place chords based on bar index * 160px (approx visual bar width for default zoom)
      // Ideally pixelsPerBar should be passed as prop, but we'll use a constant for visual simplicity.
      const pixelsPerBar = 160; 

      return (
        <div className="relative w-full h-full flex items-center">
            {track.chordData?.map((chord, idx) => (
                <div 
                    key={idx}
                    className="absolute h-16 bg-white border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-sm z-10"
                    style={{ 
                        left: `${(chord.bar - 1) * pixelsPerBar}px`, 
                        width: `${pixelsPerBar - 4}px`, // Slight gap
                        top: '4px'
                    }}
                >
                    <span className="text-xl font-black text-blue-800">{chord.name}</span>
                </div>
            ))}
            {/* Empty grid background */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px)] bg-[size:160px_100%]"></div>
        </div>
      );
  };

  // --- RENDER: BASIC MODE ---
  if (mode === UserMode.EXPLORER) {
    return (
      <div className={`flex w-full mb-4 ${track.color} rounded-2xl shadow-md overflow-hidden h-32 border-4 border-white/30 relative shrink-0`}>
          <div className={`w-64 ${stickyHeaderStyle} bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center border-r-4 border-white/20 p-2 flex-shrink-0`}>
             <div className="bg-white/20 p-3 rounded-full mb-1">{getIcon()}</div>
             <h3 className="font-fredoka text-xl font-bold text-white shadow-sm truncate w-full text-center">{track.name}</h3>
             <div className="flex space-x-2 mt-2">
                 <button onClick={() => onDelete(track.id)} className="p-2 rounded-full bg-white/20 text-white hover:bg-red-500"><Trash2 size={20}/></button>
             </div>
          </div>
          <div className="flex-1 relative flex items-center bg-black/5 min-w-[800px]" ref={containerRef}>
             {track.type === 'CHORD' ? renderChordContent() : (
                 track.type === 'MIDI' ? <div className="p-4 opacity-50 font-bold text-white">MIDI Block</div> :
                <div className="w-full h-20 opacity-70">
                    {waveformPath && <svg height="100%" width="100%" preserveAspectRatio="none"><path d={waveformPath} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" /></svg>}
                </div>
             )}
          </div>
      </div>
    );
  }

  // --- RENDER: MAKER/PRO MODE (Shared structure, different styles) ---
  const isPro = mode === UserMode.PRO;
  const containerClass = isPro 
    ? "bg-gray-800 border-gray-900 h-24 mb-1" 
    : "bg-white border-gray-100 h-28 mb-2 shadow-sm hover:shadow-md";
    
  return (
      <div 
        onClick={() => onSelect(track.id)}
        className={`flex w-full ${containerClass} rounded-sm border overflow-hidden group transition-all cursor-pointer ${isSelectedClass} shrink-0`}
      >
         {/* HEADER */}
         <div className={`w-64 ${stickyHeaderStyle} ${isPro ? 'bg-gray-900 border-black text-gray-300' : 'bg-gray-50 border-gray-100'} border-r flex flex-col p-3 justify-between relative flex-shrink-0`}>
             {!isPro && <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: track.color.replace('bg-', 'rgb(').replace(')', ')') }}></div>}
             <div className={`${!isPro && 'pl-3'}`}>
                 <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-2">
                        <div className={`${isPro ? '' : 'bg-gray-200 p-1 rounded-full'}`}>{getIcon()}</div>
                        <span className="font-bold font-fredoka text-sm truncate w-24">{track.name}</span>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(track.id);}} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                 </div>
                 
                 {track.type !== 'CHORD' && (
                    <div className="flex items-center space-x-1 mt-2">
                        <button onClick={(e) => {e.stopPropagation(); onToggleMute(track.id);}} className={`px-2 py-0.5 rounded text-[10px] font-bold ${track.isMuted ? 'bg-yellow-500 text-black' : 'bg-gray-200 text-gray-500'}`}>M</button>
                        <button onClick={(e) => {e.stopPropagation(); onToggleSolo(track.id);}} className={`px-2 py-0.5 rounded text-[10px] font-bold ${track.isSolo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>S</button>
                        <button onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} className={`p-1 rounded-full ${track.isArmed ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}><CircleDot size={12}/></button>
                    </div>
                 )}
             </div>
         </div>

         {/* TIMELINE CONTENT */}
         <div className={`flex-1 relative overflow-hidden flex items-center min-w-[800px] ${isPro ? 'bg-gray-800' : 'bg-gray-50'}`} ref={containerRef}>
            {track.type === 'CHORD' ? (
                renderChordContent()
            ) : track.type === 'MIDI' ? (
                <div className={`relative h-16 w-full opacity-50 flex items-center justify-center border-y border-dashed ${isPro ? 'border-gray-600' : 'border-blue-200 bg-blue-50'}`}>
                     <span className="text-xs font-mono">MIDI DATA</span>
                </div>
            ) : (
                <div className={`relative h-full w-full flex items-center justify-center opacity-80 z-10 ${track.color.replace('bg-', isPro ? 'bg-opacity-10 ' : 'bg-opacity-10 ')}`}>
                    {waveformPath && <svg height={isPro ? 60 : 80} width="100%" preserveAspectRatio="none" className="w-full h-full"><path d={waveformPath} fill="none" stroke={isPro ? "#a3a3a3" : "#4f46e5"} strokeWidth="2" strokeLinecap="round" /></svg>}
                </div>
            )}
         </div>
      </div>
  );
};