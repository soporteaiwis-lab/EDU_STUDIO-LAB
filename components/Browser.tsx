import React, { useRef, useState, useEffect } from 'react';
import { UserMode, Session } from '../types';
import { Search, Music, Mic2, Youtube, Upload, Sparkles, PlayCircle, FileAudio, Cloud, Trash2, Save } from 'lucide-react';
import { generateDrumPattern } from '../services/geminiService';
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
      // Generate Pattern Logic
      const pattern = await generateDrumPattern('Rock Basico');
      // In a real app, we would construct a MIDI track. 
      // For this demo, we will import a pre-rendered drum loop as audio to simulate the result
      // because constructing MIDI via Tone.Part in React state is complex for this snippet size.
      // However, we simulate the "AI Work":
      setTimeout(() => {
          onImport('https://tonejs.github.io/audio/drum-samples/loops/bongo.mp3', `IA: ${pattern.name}`, 'AUDIO');
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
    <div className={`w-72 flex-shrink-0 ${mode === UserMode.PRO ? 'bg-gray-800 border-l border-black text-gray-300' : 'bg-white border-l border-gray-200 text-gray-700'} flex flex-col h-full animate-slide-left z-30 shadow-xl`}>
       {/* Header */}
       <div className="flex border-b border-gray-600">
           <button onClick={() => setActiveTab('SAMPLES')} className={`flex-1 p-3 text-xs font-bold ${activeTab === 'SAMPLES' ? 'bg-black/10' : ''}`}>Librería</button>
           <button onClick={() => setActiveTab('CLOUD')} className={`flex-1 p-3 text-xs font-bold flex items-center justify-center ${activeTab === 'CLOUD' ? 'bg-black/10' : ''}`}><Cloud size={12} className="mr-1"/> Mi Nube</button>
       </div>

       {/* SAMPLES TAB */}
       {activeTab === 'SAMPLES' && (
        <>
            <div className="p-3">
                <div className={`flex items-center px-3 py-2 rounded-lg ${mode === UserMode.PRO ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <Search size={14} className="text-gray-500 mr-2"/>
                    <input type="text" placeholder="Buscar..." className="bg-transparent w-full text-xs focus:outline-none"/>
                </div>
            </div>
            <div className="px-3 mb-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-blue-600 text-white rounded text-xs font-bold flex items-center justify-center hover:bg-blue-700">
                    <Upload size={14} className="mr-2"/> Importar MP3/WAV
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-1">Samples</div>
                {SAMPLES.map((sample, i) => (
                    <div key={i} className={`p-2 rounded flex justify-between items-center ${mode === UserMode.PRO ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                        <div className="flex items-center space-x-2 truncate cursor-pointer" onClick={() => new Audio(sample.url).play()}>
                            <PlayCircle size={14} className="text-gray-500"/>
                            <span className="text-xs font-bold truncate">{sample.name}</span>
                        </div>
                        <button onClick={() => onImport(sample.url, sample.name, 'AUDIO')} className="text-blue-400 p-1 hover:bg-white/10 rounded"><Upload size={12}/></button>
                    </div>
                ))}
                
                <div className="mt-4 px-2">
                    <button 
                        onClick={handleGenerateDrums}
                        disabled={isGenerating}
                        className={`w-full p-3 rounded border-2 border-dashed border-yellow-500/50 flex items-center justify-center space-x-2 ${isGenerating ? 'opacity-50' : 'hover:bg-yellow-500/10'}`}
                    >
                        <Sparkles size={16} className="text-yellow-500 animate-pulse"/>
                        <span className="text-xs font-bold text-yellow-600">{isGenerating ? 'Generando MIDI...' : 'Generar Batería IA'}</span>
                    </button>
                </div>
            </div>
        </>
       )}

       {/* CLOUD TAB */}
       {activeTab === 'CLOUD' && (
           <div className="flex-1 overflow-y-auto p-3 space-y-2">
               {sessions.length === 0 ? (
                   <div className="text-center mt-10 opacity-50 text-xs">No hay proyectos guardados.</div>
               ) : (
                   sessions.map(s => (
                       <div key={s.id} onClick={() => onLoadSession && onLoadSession(s)} className={`p-3 rounded-lg border cursor-pointer group ${mode === UserMode.PRO ? 'bg-gray-700 border-gray-600 hover:border-gray-400' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
                           <div className="flex justify-between items-start">
                               <div>
                                   <div className="font-bold text-sm truncate w-40">{s.name}</div>
                                   <div className="text-[10px] opacity-60">BPM: {s.bpm} • {s.tracks.length} Pistas</div>
                                   <div className="text-[10px] opacity-40">{new Date(s.lastModified).toLocaleDateString()}</div>
                               </div>
                               <button onClick={(e) => handleDeleteSession(s.id, e)} className="text-gray-500 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                           </div>
                       </div>
                   ))
               )}
           </div>
       )}
    </div>
  );
};