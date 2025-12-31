
import React, { useState } from 'react';
import { generateLyrics, generateProgression, generateRhythm, generateMelody, analyzeScriptForSFX } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { GeneratedLyrics, GeneratedChords, GeneratedRhythm, GeneratedMelody, GeneratedSFXList } from '../types';
import { Sparkles, X, AlignLeft, Grid, Drum, Music, Play, FileText, Zap } from 'lucide-react';

interface CreativeEditorProps {
  onClose: () => void;
  onImportLyrics: (text: string) => void;
  onImportChords: (data: GeneratedChords) => void;
  onImportRhythm: (data: GeneratedRhythm) => void;
  onImportMelody: (data: GeneratedMelody) => void;
}

export const CreativeEditor: React.FC<CreativeEditorProps> = ({ onClose, onImportLyrics, onImportChords, onImportRhythm, onImportMelody }) => {
  const [activeTab, setActiveTab] = useState<'LYRICS' | 'HARMONY' | 'MELODY' | 'RHYTHM' | 'SCRIPT'>('LYRICS');
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE LYRICS ---
  const [topic, setTopic] = useState('');
  const [lyricsRes, setLyricsRes] = useState<GeneratedLyrics | null>(null);

  // --- STATE HARMONY ---
  const [chordKey, setChordKey] = useState('C');
  const [chordMood, setChordMood] = useState('Pop Feliz');
  const [chordsRes, setChordsRes] = useState<GeneratedChords | null>(null);

  // --- STATE RHYTHM ---
  const [drumStyle, setDrumStyle] = useState('Rock');
  const [rhythmRes, setRhythmRes] = useState<GeneratedRhythm | null>(null);

  // --- STATE MELODY ---
  const [melodyKey, setMelodyKey] = useState('C');
  const [melodyClef, setMelodyClef] = useState<'TREBLE'|'BASS'>('TREBLE');
  const [melodyRes, setMelodyRes] = useState<GeneratedMelody | null>(null);

  // --- STATE SCRIPT ---
  const [scriptText, setScriptText] = useState('');
  const [sfxRes, setSfxRes] = useState<GeneratedSFXList | null>(null);

  // Actions
  const doGenerateLyrics = async () => { if(!topic)return; setIsLoading(true); const res = await generateLyrics(topic, 'kids'); setLyricsRes(res); setIsLoading(false); };
  const doGenerateChords = async () => { setIsLoading(true); const res = await generateProgression(chordKey, chordMood); setChordsRes(res); setIsLoading(false); };
  const doGenerateRhythm = async () => { setIsLoading(true); const res = await generateRhythm(drumStyle); setRhythmRes(res); setIsLoading(false); };
  const doGenerateMelody = async () => { setIsLoading(true); const res = await generateMelody(melodyKey, melodyClef); setMelodyRes(res); setIsLoading(false); };
  const doAnalyzeScript = async () => { if(!scriptText)return; setIsLoading(true); const res = await analyzeScriptForSFX(scriptText); setSfxRes(res); setIsLoading(false); };

  const previewMelody = () => {
      if(!melodyRes) return;
      audioService.scheduleMelody('preview_melody', melodyRes.events);
      audioService.addTrack('preview_melody', '', 'INSTRUMENT').then(() => {
          audioService.play(); setTimeout(() => audioService.stop(), 4000);
      });
  };

  const keys = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Am', 'Em', 'Dm'];

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 font-nunito">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white">
        
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
            
            {/* SIDEBAR */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4 space-y-2 shrink-0">
                <button onClick={() => setActiveTab('LYRICS')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'LYRICS' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}><AlignLeft size={20}/> <span>Letras</span></button>
                <button onClick={() => setActiveTab('HARMONY')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'HARMONY' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}><Grid size={20}/> <span>Armonía</span></button>
                <button onClick={() => setActiveTab('MELODY')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'MELODY' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}><Music size={20}/> <span>Melodía</span></button>
                <button onClick={() => setActiveTab('RHYTHM')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'RHYTHM' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}><Drum size={20}/> <span>Ritmo</span></button>
                <button onClick={() => setActiveTab('SCRIPT')} className={`p-4 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'SCRIPT' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}><FileText size={20}/> <span>Guión & FX</span></button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-8 overflow-y-auto bg-white relative">
                
                {/* --- LYRICS TAB --- */}
                {activeTab === 'LYRICS' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h3 className="text-3xl font-black text-purple-600 font-fredoka text-center">Taller de Letras</h3>
                        {!lyricsRes ? (
                            <div className="bg-purple-50 p-6 rounded-3xl space-y-6 border-2 border-purple-100">
                                <div>
                                    <label className="block text-sm font-bold text-purple-800 mb-2">¿De qué tratará tu canción?</label>
                                    <input 
                                        value={topic} 
                                        onChange={e => setTopic(e.target.value)} 
                                        className="w-full p-4 rounded-xl border-2 border-purple-200 focus:outline-none focus:border-purple-500 text-lg text-purple-900 placeholder-purple-300" 
                                        placeholder="Ej: El ciclo del agua, Mis vacaciones..."
                                    />
                                </div>
                                <button onClick={doGenerateLyrics} disabled={isLoading||!topic} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition transform hover:scale-[1.02]">{isLoading?'Escribiendo...':'Generar Letra'}</button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white border-2 border-purple-100 p-6 rounded-2xl whitespace-pre-wrap shadow-sm text-gray-800 font-mono text-sm leading-relaxed">{lyricsRes.content}</div>
                                <div className="flex gap-3">
                                    <button onClick={()=>setLyricsRes(null)} className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200">Volver</button>
                                    <button onClick={()=>{onImportLyrics(lyricsRes.content);onClose()}} className="flex-1 py-3 bg-green-500 font-bold text-white rounded-xl hover:bg-green-600 shadow-lg">Importar al Cancionero</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- HARMONY TAB --- */}
                {activeTab === 'HARMONY' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h3 className="text-3xl font-black text-blue-600 font-fredoka text-center">Generador de Armonía</h3>
                        {!chordsRes ? (
                            <div className="bg-blue-50 p-6 rounded-3xl space-y-6 border-2 border-blue-100">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-2">Tonalidad</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {keys.map(k => (
                                                <button key={k} onClick={() => setChordKey(k)} className={`p-2 rounded-lg font-bold border-2 transition ${chordKey === k ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>{k}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-2">Estilo / Emoción</label>
                                        <select value={chordMood} onChange={e => setChordMood(e.target.value)} className="w-full p-3 rounded-xl border-2 border-blue-200 font-bold text-blue-900 focus:outline-none focus:border-blue-500 bg-white">
                                            <option>Pop Feliz</option>
                                            <option>Balada Triste</option>
                                            <option>Rock Épico</option>
                                            <option>Reggaeton</option>
                                            <option>Lo-Fi Chill</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={doGenerateChords} disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition transform hover:scale-[1.02]">{isLoading ? 'Componiendo...' : 'Generar Progresión'}</button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white border-2 border-blue-100 p-6 rounded-3xl shadow-sm text-center">
                                    <h4 className="text-xl font-bold text-gray-800 mb-4">Progresión en {chordsRes.key}</h4>
                                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                                        {chordsRes.progression.map((c, i) => (
                                            <div key={i} className="bg-blue-50 border border-blue-200 p-3 rounded-xl min-w-[80px]">
                                                <div className="text-xs text-blue-500 font-bold uppercase">Compás {c.bar}</div>
                                                <div className="text-2xl font-black text-blue-900">{c.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setChordsRes(null)} className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200">Volver</button>
                                    <button onClick={() => { onImportChords(chordsRes); onClose(); }} className="flex-1 py-3 bg-green-500 font-bold text-white rounded-xl hover:bg-green-600 shadow-lg">Importar Pista</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- RHYTHM TAB --- */}
                {activeTab === 'RHYTHM' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h3 className="text-3xl font-black text-red-600 font-fredoka text-center">Generador de Ritmo</h3>
                        {!rhythmRes ? (
                            <div className="bg-red-50 p-6 rounded-3xl space-y-6 border-2 border-red-100">
                                <div>
                                    <label className="block text-sm font-bold text-red-800 mb-2">Estilo de Batería</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Rock', 'Pop', 'Hip Hop', 'Electronic', 'Reggaeton', 'Jazz'].map(s => (
                                            <button key={s} onClick={() => setDrumStyle(s)} className={`p-4 rounded-xl font-bold border-2 text-left transition ${drumStyle === s ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'}`}>
                                                <Drum size={20} className="mb-2 opacity-50"/>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={doGenerateRhythm} disabled={isLoading} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition transform hover:scale-[1.02]">{isLoading ? 'Programando...' : 'Generar Ritmo'}</button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white border-2 border-red-100 p-6 rounded-3xl shadow-sm text-center">
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Patrón: {rhythmRes.style}</h4>
                                    <p className="text-gray-500 text-sm">Patrón de 2 compases generado con IA</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setRhythmRes(null)} className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200">Volver</button>
                                    <button onClick={() => { onImportRhythm(rhythmRes); onClose(); }} className="flex-1 py-3 bg-green-500 font-bold text-white rounded-xl hover:bg-green-600 shadow-lg">Importar Pista</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- MELODY TAB --- */}
                {activeTab === 'MELODY' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h3 className="text-3xl font-black text-yellow-600 font-fredoka text-center">Generador de Melodía</h3>
                        {!melodyRes ? (
                            <div className="bg-yellow-50 p-6 rounded-3xl space-y-6 border-2 border-yellow-100">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-yellow-800 mb-2">Tonalidad</label>
                                        <select value={melodyKey} onChange={e => setMelodyKey(e.target.value)} className="w-full p-3 rounded-xl border-2 border-yellow-200 font-bold text-yellow-900 bg-white focus:outline-none">
                                            {keys.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-yellow-800 mb-2">Clave / Rango</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setMelodyClef('TREBLE')} className={`flex-1 p-2 rounded-lg font-bold border-2 ${melodyClef==='TREBLE'?'bg-yellow-500 text-white border-yellow-600':'bg-white text-gray-700'}`}>Agudo</button>
                                            <button onClick={() => setMelodyClef('BASS')} className={`flex-1 p-2 rounded-lg font-bold border-2 ${melodyClef==='BASS'?'bg-yellow-500 text-white border-yellow-600':'bg-white text-gray-700'}`}>Grave</button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={doGenerateMelody} disabled={isLoading} className="w-full py-4 bg-yellow-600 text-white font-bold rounded-xl shadow-lg hover:bg-yellow-700 transition transform hover:scale-[1.02]">{isLoading ? 'Componiendo...' : 'Generar Melodía'}</button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white border-2 border-yellow-100 p-6 rounded-3xl shadow-sm text-center">
                                    <div className="text-sm text-yellow-600 font-bold uppercase mb-2">Previsualización (ABC)</div>
                                    <div className="font-mono bg-gray-50 p-3 rounded text-sm text-gray-800 break-words mb-4">{melodyRes.abc}</div>
                                    <button onClick={previewMelody} className="flex items-center justify-center mx-auto space-x-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold hover:bg-yellow-200 transition">
                                        <Play size={16} fill="currentColor"/> <span>Escuchar Preview</span>
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setMelodyRes(null)} className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200">Volver</button>
                                    <button onClick={() => { onImportMelody(melodyRes); onClose(); }} className="flex-1 py-3 bg-green-500 font-bold text-white rounded-xl hover:bg-green-600 shadow-lg">Importar Pista</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- SCRIPT TAB --- */}
                {activeTab === 'SCRIPT' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                         <h3 className="text-3xl font-black text-orange-600 font-fredoka text-center">Analizador de Guiones SFX</h3>
                         {!sfxRes ? (
                             <div className="bg-orange-50 p-6 rounded-3xl space-y-4 border-2 border-orange-100">
                                 <p className="text-orange-800 font-bold">Pega tu cuento o guion aquí. La IA sugerirá dónde poner efectos de sonido.</p>
                                 <textarea 
                                    value={scriptText} 
                                    onChange={e => setScriptText(e.target.value)} 
                                    className="w-full h-40 p-4 rounded-xl border-2 border-orange-200 resize-none focus:outline-none focus:border-orange-500 text-gray-900 placeholder-orange-300" 
                                    placeholder="Había una vez un perro que ladraba fuerte..."
                                 ></textarea>
                                 <button onClick={doAnalyzeScript} disabled={isLoading||!scriptText} className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition transform hover:scale-[1.02]">{isLoading?'Analizando...':'Detectar Efectos'}</button>
                             </div>
                         ) : (
                             <div className="space-y-4 animate-fade-in">
                                 <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                                     {sfxRes.suggestions.map((sfx, i) => (
                                         <div key={i} className="bg-white border-l-4 border-orange-500 p-4 rounded shadow-sm flex justify-between items-center hover:bg-orange-50 transition">
                                             <div>
                                                 <div className="text-xs text-gray-400 font-bold uppercase">Contexto: "{sfx.textContext}"</div>
                                                 <div className="font-bold text-lg text-orange-900">{sfx.soundDescription}</div>
                                             </div>
                                             <button className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200"><Zap size={16}/></button>
                                         </div>
                                     ))}
                                 </div>
                                 <button onClick={()=>setSfxRes(null)} className="w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Volver</button>
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
