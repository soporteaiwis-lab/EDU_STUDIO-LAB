import React, { useEffect, useState, useRef } from 'react';
import { Track, UserMode, InstrumentType } from '../types';
import { Volume2, Mic, Music, Disc, Trash2, CircleDot, Drum, Guitar, Keyboard, Wind, Zap, Piano } from 'lucide-react';
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
       if (containerRef.current) {
          const width = containerRef.current.clientWidth;
          const height = mode === UserMode.EXPLORER ? 120 : 80; 
          const path = audioService.getWaveformPath(track.id, width, height);
          setWaveformPath(path);
       }
    };
    const timer = setTimeout(generate, 500);
    return () => clearTimeout(timer);
  }, [track.id, track.audioUrl, mode]);

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
        default: return track.type === 'MIDI' ? <Piano {...props} /> : <Music {...props} />;
    }
  };

  const isSelectedClass = track.isSelected && mode !== UserMode.EXPLORER ? 'ring-2 ring-blue-500 z-10' : '';

  // --- RENDER: BASIC MODE (EXPLORER) ---
  // In Basic mode, we treat it as a simplified block, but to align with timeline, 
  // we might want a similar structure if the user wants the playhead to pass over it.
  // However, Basic mode usually implies "Lego Blocks".
  // If the user demanded "Linea de tiempo" in Basic, we will render it similar to Maker but bigger/simpler.
  if (mode === UserMode.EXPLORER) {
    return (
      <div className={`flex w-full mb-4 ${track.color} rounded-2xl shadow-md overflow-hidden h-32 border-4 border-white/30 relative`}>
          {/* Header Area (Fixed Width 16rem = w-64 for consistency) */}
          <div className="w-64 bg-black/10 flex flex-col items-center justify-center border-r-4 border-white/20 p-2 flex-shrink-0">
             <div className="bg-white/20 p-3 rounded-full mb-1">{getIcon()}</div>
             <h3 className="font-fredoka text-xl font-bold text-white shadow-sm truncate w-full text-center">{track.name}</h3>
             <div className="flex space-x-2 mt-2">
                 <button onClick={() => onToggleMute(track.id)} className={`p-2 rounded-full ${track.isMuted ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'}`}><Volume2 size={20}/></button>
                 <button onClick={() => onDelete(track.id)} className="p-2 rounded-full bg-white/20 text-white hover:bg-red-500"><Trash2 size={20}/></button>
             </div>
          </div>

          {/* Timeline Area */}
          <div className="flex-1 relative flex items-center bg-black/5" ref={containerRef}>
             {track.type === 'MIDI' ? (
                 <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="flex space-x-1">
                        {[...Array(20)].map((_,i) => <div key={i} className="w-4 h-8 bg-white rounded-sm"></div>)}
                    </div>
                 </div>
             ) : (
                <div className="w-full h-20 opacity-70">
                    {waveformPath && <svg height="100%" width="100%" preserveAspectRatio="none"><path d={waveformPath} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" /></svg>}
                </div>
             )}
          </div>
      </div>
    );
  }

  // --- RENDER: MAKER MODE ---
  if (mode === UserMode.MAKER) {
    return (
      <div 
        onClick={() => onSelect(track.id)}
        className={`flex w-full mb-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-28 group hover:shadow-md transition-all cursor-pointer ${isSelectedClass}`}
      >
         {/* Fixed Width Header: w-64 */}
         <div className={`w-64 bg-gray-50 border-r border-gray-100 flex flex-col p-3 justify-between relative flex-shrink-0`}>
             <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: track.color.replace('bg-', 'rgb(').replace(')', ')') }}>
                 <div className={`h-full w-full ${track.color}`}></div>
             </div>
             <div className="pl-3">
                 <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-200 p-1 rounded-full">{getIcon()}</div>
                        <span className="font-bold text-gray-700 font-fredoka text-lg truncate w-24">{track.name}</span>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(track.id);}} className="text-gray-300 hover:text-red-400"><Trash2 size={16}/></button>
                 </div>
                 <div className="flex space-x-2 mb-2">
                    <button onClick={(e) => {e.stopPropagation(); onToggleMute(track.id);}} className={`px-2 py-1 rounded-lg text-xs font-bold ${track.isMuted ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>Mute</button>
                    <button onClick={(e) => {e.stopPropagation(); onToggleSolo(track.id);}} className={`px-2 py-1 rounded-lg text-xs font-bold ${track.isSolo ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>Solo</button>
                    <button onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} className={`p-1 rounded-full ${track.isArmed ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}><CircleDot size={14}/></button>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Volume2 size={14} className="text-gray-400"/>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                        <div className={`h-full ${track.color}`} style={{width: `${track.volume}%`}}></div>
                        <input type="range" min="0" max="100" value={track.volume} onChange={(e) => onVolumeChange(track.id, parseInt(e.target.value))} className="absolute inset-0 opacity-0 cursor-ew-resize"/>
                    </div>
                 </div>
             </div>
         </div>
         <div className="flex-1 bg-gray-50 relative p-2 overflow-hidden flex items-center" ref={containerRef}>
            {track.type === 'MIDI' ? (
                <div className={`relative h-20 w-full rounded-xl flex items-center bg-blue-50 border border-blue-100`}>
                     <span className="w-full text-center text-xs text-blue-400 font-bold opacity-50">PATRÓN MIDI</span>
                     <div className="absolute inset-0 bg-blue-200/20" style={{backgroundImage: 'radial-gradient(#3b82f6 10%, transparent 10%)', backgroundSize: '10px 10px'}}></div>
                </div>
            ) : (
                <div className={`relative h-20 w-full rounded-xl flex items-center ${track.color.replace('bg-', 'bg-opacity-10 ')} border border-gray-200`}>
                    <div className={`absolute inset-0 ${track.color} opacity-10`}></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-80 z-10">
                        {waveformPath && <svg height="80" width="100%" preserveAspectRatio="none" className="w-full h-full"><path d={waveformPath} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" /></svg>}
                    </div>
                </div>
            )}
         </div>
      </div>
    );
  }

  // --- RENDER: PRO MODE ---
  // Ensure header is w-64 to match others
  return (
    <div 
        onClick={() => onSelect(track.id)}
        className={`flex w-full mb-1 bg-gray-800 rounded-sm border border-gray-900 overflow-hidden h-24 group hover:border-gray-600 transition-colors cursor-pointer ${isSelectedClass}`}
    >
      <div className="w-64 bg-gray-900 border-r border-black flex flex-col p-2 justify-between flex-shrink-0 relative text-gray-300">
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1.5 overflow-hidden">
                <span className={`w-2 h-2 rounded-full ${track.color}`}></span>
                <span className="font-bold text-gray-100 truncate text-xs font-sans tracking-tight w-24">{track.name}</span>
            </div>
            <div className="flex space-x-1">
                 <button onClick={(e) => {e.stopPropagation(); onToggleArm(track.id);}} className={`w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center ${track.isArmed ? 'bg-red-600 border-red-500' : 'bg-transparent'}`}><div className="w-1.5 h-1.5 rounded-full bg-white"></div></button>
                 <button onClick={(e) => {e.stopPropagation(); onDelete(track.id);}} className="text-gray-500 hover:text-red-500"><Trash2 size={12} /></button>
            </div>
        </div>
        <div className="grid grid-cols-4 gap-0.5 mb-1">
             <button onClick={(e) => {e.stopPropagation(); onToggleMute(track.id);}} className={`text-[9px] font-bold h-4 flex items-center justify-center rounded-sm ${track.isMuted ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>M</button>
             <button onClick={(e) => {e.stopPropagation(); onToggleSolo(track.id);}} className={`text-[9px] font-bold h-4 flex items-center justify-center rounded-sm ${track.isSolo ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>S</button>
             <button className="text-[9px] font-bold h-4 flex items-center justify-center rounded-sm bg-gray-700 text-gray-400">e</button>
             <button className="text-[9px] font-bold h-4 flex items-center justify-center rounded-sm bg-gray-700 text-gray-400">R</button>
        </div>
        <div className="flex items-center space-x-1">
            <div className="flex-1">
                 <div className="h-1 bg-gray-700 rounded-full overflow-hidden relative w-full mb-1">
                    <div className="h-full bg-green-500" style={{width: `${track.volume}%`}}></div>
                    <input type="range" min="0" max="100" value={track.volume} onChange={(e) => {e.stopPropagation(); onVolumeChange(track.id, parseInt(e.target.value));}} className="absolute inset-0 opacity-0 cursor-ew-resize"/>
                 </div>
                 <div className="flex justify-between text-[8px] text-gray-500 font-mono"><span>Vol: {track.volume}</span></div>
            </div>
        </div>
      </div>
      <div className="flex-1 bg-gray-800 relative overflow-hidden flex items-center border-l border-black" ref={containerRef}>
         <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'linear-gradient(to right, #202020 1px, transparent 1px)', backgroundSize: '50px 100%'}}></div>
         <div className={`relative h-full w-full border-y border-gray-700 flex items-center ${track.color.replace('bg-', 'bg-opacity-20 ')}`}>
            {track.type === 'MIDI' ? (
                 <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <span className="text-xs font-mono">MIDI DATA</span>
                 </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-90">
                    {waveformPath && <svg height="60" width="100%" preserveAspectRatio="none" className="w-full h-full"><path d={waveformPath} fill="none" stroke={track.color.includes('white') ? '#000' : '#a3a3a3'} strokeWidth="1" /></svg>}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};