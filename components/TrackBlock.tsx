import React, { useEffect, useState, useRef } from 'react';
import { Track, UserMode, InstrumentType } from '../types';
import { Volume2, Mic, Music, Disc, Trash2, CircleDot, Drum, Guitar, Keyboard, Wind, Zap } from 'lucide-react';
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
        default: return track.type === 'MIDI' ? <Disc {...props} /> : <Music {...props} />;
    }
  };

  const isSelectedClass = track.isSelected && mode !== UserMode.EXPLORER ? 'ring-2 ring-blue-500 z-10' : '';

  // --- RENDER: BASIC MODE (EXPLORER) ---
  if (mode === UserMode.EXPLORER) {
    return (
      <div className={`flex w-full mb-4 ${track.color} rounded-[2rem] shadow-[0_8px_0_rgba(0,0,0,0.1)] overflow-hidden h-36 transition-transform hover:scale-[1.01] border-4 border-white/20`}>
          <div className="w-24 flex flex-col items-center justify-center border-r-4 border-white/20 bg-black/10 relative">
             <div className="bg-white/20 p-3 rounded-full mb-2 shadow-inner">{getIcon()}</div>
             <button onClick={() => onDelete(track.id)} className="absolute top-2 left-2 text-white/50 hover:text-white"><Trash2 size={20} /></button>
          </div>
          <div className="flex-1 relative flex items-center px-4" ref={containerRef}>
              <div className="absolute top-2 left-0 right-0 flex space-x-3 px-4 opacity-30">
                 {[...Array(15)].map((_,i) => <div key={i} className="w-3 h-3 rounded-full bg-black/20"></div>)}
              </div>
              <h3 className="absolute top-4 left-4 font-fredoka text-2xl font-bold text-white shadow-sm">{track.name}</h3>
              <div className="w-full h-16 mt-6 opacity-60">
                 {waveformPath && <svg height="100%" width="100%" preserveAspectRatio="none"><path d={waveformPath} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" /></svg>}
              </div>
          </div>
          <div className="w-24 bg-black/10 flex flex-col items-center justify-center p-2 relative">
              <Volume2 className="text-white mb-2" size={32} />
              <div className="h-20 w-4 bg-white/30 rounded-full relative overflow-hidden">
                 <div className="absolute bottom-0 left-0 right-0 bg-white" style={{height: `${track.volume}%`}}></div>
                 <input type="range" min="0" max="100" value={track.volume} onChange={(e) => onVolumeChange(track.id, parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ writingMode: 'vertical-lr', WebkitAppearance: 'slider-vertical' } as any}/>
              </div>
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
         <div className={`w-64 bg-gray-50 border-r border-gray-100 flex flex-col p-3 justify-between relative`}>
             <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: track.color.replace('bg-', 'rgb(').replace(')', ')') }}>
                 <div className={`h-full w-full ${track.color}`}></div>
             </div>
             <div className="pl-3">
                 <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-200 p-1 rounded-full">{getIcon()}</div>
                        <span className="font-bold text-gray-700 font-fredoka text-lg truncate">{track.name}</span>
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
            <div className={`relative h-20 w-full rounded-xl flex items-center ${track.color.replace('bg-', 'bg-opacity-10 ')} border border-gray-200`}>
                 <div className={`absolute inset-0 ${track.color} opacity-10`}></div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-80 z-10">
                    {waveformPath && <svg height="80" width="100%" preserveAspectRatio="none" className="w-full h-full"><path d={waveformPath} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" /></svg>}
                </div>
            </div>
         </div>
      </div>
    );
  }

  // --- RENDER: PRO MODE ---
  return (
    <div 
        onClick={() => onSelect(track.id)}
        className={`flex w-full mb-1 bg-gray-800 rounded-sm border border-gray-900 overflow-hidden h-24 group hover:border-gray-600 transition-colors cursor-pointer ${isSelectedClass}`}
    >
      <div className="w-56 bg-gray-900 border-r border-black flex flex-col p-2 justify-between flex-shrink-0 relative text-gray-300">
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1.5 overflow-hidden">
                <span className={`w-2 h-2 rounded-full ${track.color}`}></span>
                <span className="font-bold text-gray-100 truncate text-xs font-sans tracking-tight">{track.name}</span>
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
            <div className="absolute inset-0 flex items-center justify-center opacity-90">
                {waveformPath && <svg height="60" width="100%" preserveAspectRatio="none" className="w-full h-full"><path d={waveformPath} fill="none" stroke={track.color.includes('white') ? '#000' : '#a3a3a3'} strokeWidth="1" /></svg>}
            </div>
         </div>
      </div>
    </div>
  );
};