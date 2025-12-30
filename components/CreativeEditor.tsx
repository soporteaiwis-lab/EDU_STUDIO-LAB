import React, { useState } from 'react';
import { generateLyrics, generateProgression, generateRhythm, generateMelody } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { GeneratedLyrics, GeneratedChords, GeneratedRhythm, GeneratedMelody } from '../types';
import { 
    Sparkles, X, AlignLeft, Grid, Drum, Music, Play, Square, 
    ArrowRight, Save, CheckCircle, FileMusic
} from 'lucide-react';

interface CreativeEditorProps {
  onClose: () => void;
  onImportLyrics: (text: string) => void;
  onImportChords: (data: GeneratedChords) => void;
  onImportRhythm: (data: GeneratedRhythm) => void;
  onImportMelody: (data: GeneratedMelody) => void;
}

export const CreativeEditor: React.FC<CreativeEditorProps> = ({ onClose, onImportLyrics, onImportChords, onImportRhythm, onImportMelody }) => {
  const [activeTab, setActiveTab] = useState<'LYRICS' | 'HARMONY' | 'MELODY' | 'RHYTHM'>('LYRICS');
  const [isLoading, setIsLoading] = useState(false);

  // --- STATES ---
  const [topic, setTopic] = useState('');
  const [lyricsRes, setLyricsRes] = useState<GeneratedLyrics | null>(null);

  const [chordKey, setChordKey] = useState('C');
  const [chordMood, setChordMood] = useState('Pop');
  const [chordsRes, setChordsRes] = useState<GeneratedChords | null>(null);

  const [drumStyle, setDrumStyle] = useState('Rock');
  const [rhythmRes, setRhythmRes] = useState<GeneratedRhythm | null>(null);

  const [melodyKey, setMelodyKey] = useState('C');
  const [melodyClef, setMelodyClef] = useState<'TREBLE'|'BASS'>('TREBLE');
  const [melodyRes, setMelodyRes] = useState<GeneratedMelody | null>(null);

  // --- ACTIONS ---
  const doGenerateLyrics = async () => {
      if(!topic) return; setIsLoading(true);
      const res = await generateLyrics(topic, 'kids');
      setLyricsRes(res); setIsLoading(false);
  };
  const doGenerateChords = async () => {
      setIsLoading(true);
      const res = await generateProgression(chordKey, chordMood);
      setChordsRes(res); setIsLoading(false);
  };
  const doGenerateRhythm = async () => {
      setIsLoading(true);
      const res = await generateRhythm(drumStyle);
      setRhythmRes(res); setIsLoading(false);
  };
  const doGenerateMelody = async () => {
      setIsLoading(true);
      const res = await generateMelody(melodyKey, melodyClef);
      setMelodyRes(res); setIsLoading(false);
  };

  // --- PREVIEWS ---
  const previewMelody = () => {
      if(!melodyRes) return;
      audioService.scheduleMelody('preview_melody', melodyRes.events);
      audioService.addTrack('preview_melody', '', 'INSTRUMENT').then(() => {
          audioService.play();
          setTimeout(() => audioService.stop(), 4000); // Stop after 4s
      });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 font-nunito">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex justify-between items-center text-white shrink-0">
             <div className="flex items-center space-x-3">
                 <div className="p-2 bg-white/20 rounded-full"><Sparkles className="animate-pulse"/></div>
                 <div>
                     <h2 className="text-2xl font-black font-fredoka">Editor Creativo AIWIS</h2>
                     <p className="text-xs opacity-80">Suite de Generación Musical con IA (Gemini)</p>
                 </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition"><X/></button>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* SIDEBAR TABS */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4 space-y-2 shrink-0">
                <button onClick={() => setActiveTab('LYRICS')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'LYRICS' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <AlignLeft size={20}/> <span>Letras</span>
                </button>
                <button onClick={() => setActiveTab('HARMONY')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'HARMONY' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <Grid size={20}/> <span>Armonía</span>
                </button>
                <button onClick={() => setActiveTab('MELODY')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'MELODY' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <Music size={20}/> <span>Melodía</span>
                </button>
                <button onClick={() => setActiveTab('RHYTHM')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'RHYTHM' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <Drum size={20}/> <span>Ritmo</span>
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-8 overflow-y-auto bg-white relative">
                
                {/* 1. LYRICS TAB */}
                {activeTab === 'LYRICS' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-purple-600 font-fredoka">Taller de Letras</h3>
                            <p className="text-gray-500">Describe tu tema y la IA escribirá la poesía.</p>
                        </div>
                        {!lyricsRes ? (
                            <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-100 space-y-4">
                                <label className="font-bold text-gray-700 ml-1">¿De qué trata tu canción?</label>
                                <input 
                                    value={topic} onChange={e => setTopic(e.target.value)}
                                    className="w-full p-4 text-lg rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none" 
                                    placeholder="Ej: El cuidado del medio ambiente..."
                                />
                                <button onClick={doGenerateLyrics} disabled={isLoading || !topic} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-lg">
                                    {isLoading ? 'Escribiendo...' : 'Generar Letra'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white border-2 border-purple-100 p-6 rounded-2xl shadow-sm whitespace-pre-wrap font-serif text-lg text-gray-700 leading-relaxed">
                                    <h4 className="font-bold text-2xl mb-4 text-purple-800">{lyricsRes.title}</h4>
                                    {lyricsRes.content}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setLyricsRes(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Reintentar</button>
                                    <button onClick={() => {onImportLyrics(lyricsRes.content); onClose();}} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600">Importar al Cancionero</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. HARMONY TAB */}
                {activeTab === 'HARMONY' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-blue-600 font-fredoka">Generador de Acordes</h3>
                            <p className="text-gray-500">Crea la base armónica perfecta para tu canción.</p>
                        </div>
                        {!chordsRes ? (
                            <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="font-bold text-gray-700 block mb-2">Tonalidad</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['C','G','D','A','E','F','Bb','Am'].map(k => (
                                            <button key={k} onClick={() => setChordKey(k)} className={`p-2 rounded font-bold border-2 ${chordKey===k ? 'bg-blue-500 text-white border-blue-600':'bg-white text-gray-600 border-gray-200'}`}>{k}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-2">Estilo</label>
                                    <select value={chordMood} onChange={e=>setChordMood(e.target.value)} className="w-full p-3 rounded-lg border-2 border-blue-200 font-bold text-gray-700">
                                        <option>Pop</option><option>Rock</option><option>Balada</option><option>Jazz</option>
                                    </select>
                                    <button onClick={doGenerateChords} disabled={isLoading} className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">
                                        {isLoading ? '...' : 'Generar'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {chordsRes.progression.map((c, i) => (
                                        <div key={i} className="bg-white border-2 border-blue-200 w-20 h-24 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Bar {c.bar}</span>
                                            <span className="text-2xl font-black text-blue-800">{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setChordsRes(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Volver</button>
                                    <button onClick={() => {onImportChords(chordsRes); onClose();}} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600">Añadir Pista Acordes</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. MELODY TAB (NEW) */}
                {activeTab === 'MELODY' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-yellow-600 font-fredoka">Creador de Melodías</h3>
                            <p className="text-gray-500">Genera líneas melódicas y visualízalas en partitura simple.</p>
                        </div>
                        {!melodyRes ? (
                             <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-200 space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="font-bold text-gray-700 block mb-2">Clave</label>
                                        <div className="flex gap-2">
                                            <button onClick={()=>setMelodyClef('TREBLE')} className={`flex-1 p-2 rounded font-bold border-2 ${melodyClef==='TREBLE'?'bg-yellow-500 text-white border-yellow-600':'bg-white'}`}>Sol 𝄞</button>
                                            <button onClick={()=>setMelodyClef('BASS')} className={`flex-1 p-2 rounded font-bold border-2 ${melodyClef==='BASS'?'bg-yellow-500 text-white border-yellow-600':'bg-white'}`}>Fa 𝄢</button>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="font-bold text-gray-700 block mb-2">Escala</label>
                                        <input value={melodyKey} onChange={e=>setMelodyKey(e.target.value)} className="w-full p-2 rounded border-2 border-yellow-200 font-bold text-center" />
                                    </div>
                                </div>
                                <button onClick={doGenerateMelody} disabled={isLoading} className="w-full py-4 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 shadow-lg">
                                    {isLoading ? 'Componiendo...' : 'Generar Partitura'}
                                </button>
                             </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                {/* Visual Score Simulation (Simple SVG) */}
                                <div className="bg-white border-2 border-gray-200 p-4 rounded-xl h-48 relative flex items-center justify-center overflow-hidden">
                                     <div className="absolute w-full space-y-4 opacity-20">
                                         {[1,2,3,4,5].map(i => <div key={i} className="h-px bg-black w-full"></div>)}
                                     </div>
                                     <div className="relative z-10 font-mono text-xl tracking-widest text-gray-800 bg-white/80 p-4 rounded border border-gray-300">
                                         {melodyRes.abc}
                                     </div>
                                     <div className="absolute top-2 left-2 text-4xl text-gray-400">
                                         {melodyClef === 'TREBLE' ? '𝄞' : '𝄢'}
                                     </div>
                                </div>
                                
                                <div className="flex gap-4">
                                     <button onClick={previewMelody} className="p-3 bg-yellow-100 text-yellow-700 rounded-xl font-bold flex items-center justify-center hover:bg-yellow-200"><Play size={20} className="mr-2"/> Escuchar</button>
                                     <button onClick={() => {onImportMelody(melodyRes); onClose();}} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 flex items-center justify-center"><FileMusic className="mr-2"/> Añadir Pista MIDI</button>
                                     <button onClick={() => setMelodyRes(null)} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200">X</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. RHYTHM TAB */}
                {activeTab === 'RHYTHM' && (
                     <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-red-600 font-fredoka">Caja de Ritmos IA</h3>
                            <p className="text-gray-500">Genera patrones de batería que suenan reales.</p>
                        </div>
                        {!rhythmRes ? (
                            <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 space-y-4">
                                <label className="font-bold text-gray-700 block">Estilo de Batería</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Rock','Pop','Funk','Trap','Jazz','Reggaeton'].map(s => (
                                        <button key={s} onClick={()=>setDrumStyle(s)} className={`p-3 rounded-lg font-bold border-2 ${drumStyle===s ? 'bg-red-500 text-white border-red-600':'bg-white text-gray-600 border-red-100'}`}>{s}</button>
                                    ))}
                                </div>
                                <button onClick={doGenerateRhythm} disabled={isLoading} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg mt-4">
                                    {isLoading ? 'Creando Beat...' : 'Generar Patrón'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-gray-900 p-6 rounded-2xl flex items-center justify-center relative h-32 overflow-hidden border-4 border-gray-800">
                                     {/* Visualizer Mockup */}
                                     <div className="flex gap-1 items-end h-full w-full justify-center opacity-50">
                                         {rhythmRes.events.map((e,i) => (
                                             <div key={i} className={`w-4 rounded-t ${e.instrument==='KICK'?'h-16 bg-red-500':e.instrument==='SNARE'?'h-12 bg-blue-500':'h-8 bg-yellow-500'}`}></div>
                                         ))}
                                     </div>
                                     <div className="absolute text-white font-bold text-xl bg-black/50 px-4 py-1 rounded">
                                         {rhythmRes.style} • {rhythmRes.bpm} BPM
                                     </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setRhythmRes(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Volver</button>
                                    <button onClick={() => {onImportRhythm(rhythmRes); onClose();}} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600">Añadir Pista Batería</button>
                                </div>
                            </div>
                        )}
                     </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};