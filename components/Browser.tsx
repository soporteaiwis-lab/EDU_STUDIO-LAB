import React, { useRef } from 'react';
import { UserMode } from '../types';
import { Search, Music, Mic2, Youtube, Upload, Sparkles, PlayCircle, FileAudio } from 'lucide-react';
import { audioService } from '../services/audioService';

interface BrowserProps {
  mode: UserMode;
  onImport: (url: string, name: string, type: 'AUDIO' | 'MIDI') => void;
  onClose: () => void;
}

export const Browser: React.FC<BrowserProps> = ({ mode, onImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (mode === UserMode.EXPLORER) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const isMidi = file.name.endsWith('.mid') || file.name.endsWith('.midi');
      onImport(url, file.name.replace(/\.[^/.]+$/, ""), isMidi ? 'MIDI' : 'AUDIO');
    }
  };

  const SAMPLES = [
    { name: 'Kick 808', url: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3', bpm: 120 },
    { name: 'Snare Hi', url: 'https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3', bpm: 120 },
    { name: 'HiHat Open', url: 'https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3', bpm: 120 },
    { name: 'Tom Analog', url: 'https://tonejs.github.io/audio/drum-samples/CR78/tom1.mp3', bpm: 120 },
    { name: 'Bongo Click', url: 'https://tonejs.github.io/audio/drum-samples/CR78/bongo1.mp3', bpm: 120 },
  ];

  const preview = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play();
  };

  return (
    <div className={`w-64 flex-shrink-0 ${mode === UserMode.PRO ? 'bg-gray-800 border-l border-black text-gray-300' : 'bg-white border-l border-gray-200 text-gray-700'} flex flex-col h-full animate-slide-left z-30 shadow-xl`}>
       {/* Header */}
       <div className="p-3 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-bold font-fredoka">Biblioteca</h3>
          <button onClick={onClose} className="text-xs hover:text-red-500">Cerrar</button>
       </div>

       {/* Search */}
       <div className="p-3">
          <div className={`flex items-center px-3 py-2 rounded-lg ${mode === UserMode.PRO ? 'bg-gray-900' : 'bg-gray-100'}`}>
             <Search size={14} className="text-gray-500 mr-2"/>
             <input type="text" placeholder="Buscar sonidos..." className="bg-transparent w-full text-xs focus:outline-none"/>
          </div>
       </div>

       {/* Import Button */}
       <div className="px-3 mb-2">
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="audio/*,.mid,.midi"
              onChange={handleFileUpload}
            />
           <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-blue-600 text-white rounded text-xs font-bold flex items-center justify-center hover:bg-blue-700 transition-colors"
           >
              <Upload size={14} className="mr-2"/> Importar Archivo
           </button>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-1">Samples Gratis (Tone.js)</div>
          
          {SAMPLES.map((sample, i) => (
             <div key={i} className={`p-2 rounded group flex items-center justify-between ${mode === UserMode.PRO ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <div className="flex items-center space-x-2 truncate">
                    <button onClick={() => preview(sample.url)} className="text-gray-500 hover:text-green-400">
                         <PlayCircle size={16}/>
                    </button>
                    <div className="flex flex-col truncate">
                        <span className="text-xs font-bold truncate">{sample.name}</span>
                        <span className="text-[9px] text-gray-500">Audio • WAV</span>
                    </div>
                </div>
                <button 
                    onClick={() => onImport(sample.url, sample.name, 'AUDIO')} 
                    className="opacity-0 group-hover:opacity-100 text-blue-400 p-1 hover:bg-white/10 rounded"
                    title="Añadir a pista"
                >
                    <Upload size={14} className="rotate-90"/>
                </button>
             </div>
          ))}

          <div className="h-px bg-gray-700 my-4"></div>

          <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-1">IA Generativa</div>
          
          <button className={`w-full text-left p-2 rounded flex items-center space-x-2 ${mode === UserMode.PRO ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Sparkles size={16} className="text-yellow-500"/>
              <span className="text-xs font-bold">Generar Batería (Beta)</span>
          </button>
       </div>
    </div>
  );
};