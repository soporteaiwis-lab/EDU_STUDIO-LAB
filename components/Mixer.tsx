import React from 'react';
import { Track, UserMode } from '../types';
import { X, Sliders, ChevronsDown, Download } from 'lucide-react';
import { audioService } from '../services/audioService';

interface MixerProps {
  tracks: Track[];
  mode: UserMode;
  onVolumeChange: (id: string, val: number) => void;
  onPanChange: (id: string, val: number) => void;
  onEQChange: (id: string, band: 'low'|'mid'|'high', val: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onClose: () => void;
}

export const Mixer: React.FC<MixerProps> = ({ tracks, mode, onVolumeChange, onPanChange, onEQChange, onToggleMute, onToggleSolo, onClose }) => {
  const isPro = mode === UserMode.PRO;
  
  const handleDownloadStem = async (track: Track) => {
      // In a real implementation, we would solo this track and render offline.
      // For this demo, we simulate the action.
      alert(`Descargando STEM (WAV): ${track.name}\nEsta función renderizará la pista procesada.`);
  };
  
  return (
    <div className={`w-full h-64 flex-shrink-0 ${isPro ? 'bg-gray-800 border-t-2 border-black' : 'bg-gray-100 border-t-2 border-gray-300'} flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className={`flex justify-between items-center px-4 py-1 ${isPro ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'} border-b ${isPro ? 'border-black' : 'border-gray-300'}`}>
         <div className="flex items-center space-x-2">
            <Sliders size={14}/>
            <span className="text-xs font-bold">MEZCLADOR & STEMS</span>
         </div>
         <button onClick={onClose} className="hover:text-red-500"><ChevronsDown size={16} /></button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-x-auto p-2 flex space-x-1 items-end justify-start">
         {tracks.map(track => (
            <div key={track.id} className={`w-20 ${isPro ? 'bg-gray-700 border-black' : 'bg-white border-gray-300'} border rounded-sm p-1 flex flex-col items-center flex-shrink-0 h-full justify-between group`}>
                
                {/* EQ */}
                <div className="flex space-x-0.5 w-full justify-center mb-1">
                    {['high', 'mid', 'low'].map((band) => (
                        <div key={band} className="flex flex-col items-center flex-1 h-12 justify-end bg-black/10 rounded-sm">
                             <div 
                                className={`w-full bg-${band === 'high' ? 'blue' : band === 'mid' ? 'green' : 'red'}-400 rounded-b-sm`} 
                                style={{height: `${(track.eq[band as keyof typeof track.eq] + 10) * 5}%`}}
                             />
                        </div>
                    ))}
                </div>

                {/* Mute / Solo */}
                <div className="flex space-x-1 w-full mb-1">
                    <button onClick={() => onToggleMute(track.id)} className={`flex-1 text-[8px] font-bold py-1 rounded-sm ${track.isMuted ? 'bg-yellow-500 text-black' : 'bg-gray-500 text-white'}`}>M</button>
                    <button onClick={() => onToggleSolo(track.id)} className={`flex-1 text-[8px] font-bold py-1 rounded-sm ${track.isSolo ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>S</button>
                </div>
                
                {/* Stem Download (Hover) */}
                <button onClick={() => handleDownloadStem(track)} className="w-full bg-gray-200 hover:bg-green-500 hover:text-white text-[8px] py-0.5 rounded mb-1 hidden group-hover:block" title="Descargar Audio">
                    WAV
                </button>

                {/* Fader */}
                <div className="flex-1 w-full flex justify-center py-1 bg-black/20 rounded-sm relative">
                     <input 
                        type="range" min="0" max="100"
                        value={track.volume}
                        onChange={(e) => onVolumeChange(track.id, parseInt(e.target.value))}
                        className="h-full w-4 appearance-none bg-transparent z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gray-200 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:border-gray-400"
                        style={{ writingMode: 'vertical-lr', WebkitAppearance: 'slider-vertical' } as any}
                     />
                </div>
                
                <div className={`w-full text-center text-[9px] font-bold mt-1 truncate px-1 ${track.isSelected ? 'bg-blue-500 text-white' : 'text-gray-500'}`}>
                    {track.name}
                </div>
            </div>
         ))}
      </div>
    </div>
  );
};