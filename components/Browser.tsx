
import React, { useRef, useState, useEffect } from 'react';
import { UserMode, Session } from '../types';
import { Search, Music, Cloud, Trash2, Upload, Sparkles, PlayCircle, FileAudio, Zap, ChevronRight, Speaker } from 'lucide-react';
import { generateRhythm } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface BrowserProps {
  mode: UserMode;
  onImport: (url: string, name: string, type: 'AUDIO' | 'MIDI') => void;
  onLoadSession?: (session: Session) => void;
  onClose: () => void;
}

export const Browser: React.FC<BrowserProps> = ({ mode, onImport, onLoadSession, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SAMPLES' | 'CLOUD'>('SAMPLES');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (activeTab === 'CLOUD') {
          setSessions(storageService.getSessions());
      }
  }, [activeTab]);

  if (mode === UserMode.EXPLORER) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImport(url, file.name.replace(/\.[^/.]+$/, ""), 'AUDIO');
    }
  };

  const handleGenerateDrums = async () => {
      setIsGenerating(true);
      const pattern = await generateRhythm('Rock Basico');
      setTimeout(() => {
          onImport('https://tonejs.github.io/audio/drum-samples/loops/bongo.mp3', `IA: ${pattern.style}`, 'AUDIO');
          setIsGenerating(false);
      }, 1000);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('¿Borrar proyecto?')) {
          storageService.deleteSession(id);
          setSessions(prev => prev.filter(s => s.id !== id));
      }
  };

  const SAMPLES = [
    { name: 'Kick 808', url: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3' },
    { name: 'Snare Hi', url: 'https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3' },
    { name: 'HiHat Open', url: 'https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3' },
    { name: 'Loop Techno', url: 'https://tonejs.github.io/audio/drum-samples/loops/techno.mp3' }
  ];

  return (
    <div className="w-72 flex-shrink-0 bg-[#121212] border-l border-white/10 text-gray-300 flex flex-col h-full animate-slide-in-right z-30 shadow-2xl font-nunito relative">
       
       {/* HEADER & TABS */}
       <div className="flex border-b border-black items-center bg-[#18181b]">
           <button 
                onClick={() => setActiveTab('SAMPLES')} 
                className={`flex-1 p-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'SAMPLES' ? 'bg-[#27272a] text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:bg-[#202023]'}`}
           >
                Librería
           </button>
           <button 
                onClick={() => setActiveTab('CLOUD')} 
                className={`flex-1 p-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center ${activeTab === 'CLOUD' ? 'bg-[#27272a] text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:bg-[#202023]'}`}
            >
                <Cloud size={12} className="mr-1"/> Mi Nube
           </button>
           {/* CLOSE BUTTON */}
           <button 
                onClick={onClose} 
                className="p-3 text-gray-500 hover:text-white hover:bg-red-500/20 border-l border-[#333] flex items-center justify-center transition-colors"
                title="Plegar panel"
           >
               <ChevronRight size={16}/>
           </button>
       </div>

       {/* SAMPLES TAB */}
       {activeTab === 'SAMPLES' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#121212]">
            {/* Search */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center px-3 py-2 rounded bg-black/40 border border-white/10 focus-within:border-cyan-500/50 transition">
                    <Search size={14} className="text-gray-500 mr-2"/>
                    <input type="text" placeholder="Buscar sonidos..." className="bg-transparent w-full text-xs text-white focus:outline-none placeholder-gray-600"/>
                </div>
            </div>
            
            {/* Import Button */}
            <div className="px-4 mb-4 mt-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                    <Upload size={14} className="mr-2"/> Importar MP3/WAV
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                <div className="text-[10px] font-bold text-gray-600 uppercase px-2 mb-2 tracking-wider">Packs Disponibles</div>
                {SAMPLES.map((sample, i) => (
                    <div key={i} className="p-2 rounded flex justify-between items-center hover:bg-[#1f1f22] group transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                        <div className="flex items-center space-x-3 truncate flex-1" onClick={() => new Audio(sample.url).play()}>
                            <div className="bg-[#27272a] p-1.5 rounded-full group-hover:bg-cyan-500 group-hover:text-black text-gray-500 transition-colors">
                                <PlayCircle size={14}/>
                            </div>
                            <span className="text-xs font-bold truncate text-gray-400 group-hover:text-white">{sample.name}</span>
                        </div>
                        <button onClick={() => onImport(sample.url, sample.name, 'AUDIO')} className="text-gray-600 hover:text-green-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={14}/></button>
                    </div>
                ))}
            </div>

            {/* AI Generator Footer */}
            <div className="p-4 bg-[#18181b] border-t border-black">
                <button 
                    onClick={handleGenerateDrums}
                    disabled={isGenerating}
                    className={`w-full p-3 rounded-lg border-2 border-dashed border-yellow-500/30 bg-yellow-500/5 flex items-center justify-center space-x-2 ${isGenerating ? 'opacity-50' : 'hover:bg-yellow-500/10 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]'} transition-all duration-300`}
                >
                    <Sparkles size={16} className="text-yellow-500 animate-pulse"/>
                    <span className="text-xs font-bold text-yellow-500 tracking-wide uppercase">{isGenerating ? 'Generando...' : 'Generar Batería IA'}</span>
                </button>
            </div>
        </div>
       )}

       {/* CLOUD TAB */}
       {activeTab === 'CLOUD' && (
           <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#121212]">
               {sessions.length === 0 ? (
                   <div className="text-center mt-10 opacity-30 text-xs">No hay proyectos guardados.</div>
               ) : (
                   sessions.map(s => (
                       <div key={s.id} onClick={() => onLoadSession && onLoadSession(s)} className="p-3 rounded-lg border border-white/5 bg-[#1f1f22] cursor-pointer hover:bg-[#27272a] hover:border-cyan-500/50 transition-all group">
                           <div className="flex justify-between items-start">
                               <div>
                                   <div className="font-bold text-sm truncate w-40 text-gray-200">{s.name}</div>
                                   <div className="text-[10px] text-gray-500 mt-1">BPM: {s.bpm} • {s.tracks.length} Pistas</div>
                                   <div className="text-[10px] text-gray-600">{new Date(s.lastModified).toLocaleDateString()}</div>
                               </div>
                               <button onClick={(e) => handleDeleteSession(s.id, e)} className="text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                           </div>
                       </div>
                   ))
               )}
           </div>
       )}
    </div>
  );
};
