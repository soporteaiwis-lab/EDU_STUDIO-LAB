import React, { useState } from 'react';
import { generateLyrics, generateProgression } from '../services/geminiService';
import { Sparkles, X, Music, AlignLeft, FileText, Grid } from 'lucide-react';
import { GeneratedLyrics, GeneratedChords } from '../types';

interface CreativeAssistantProps {
  onClose: () => void;
  onAcceptLyrics?: (lyrics: string) => void;
  onAcceptChords?: (chords: GeneratedChords) => void;
}

export const CreativeAssistant: React.FC<CreativeAssistantProps> = ({ onClose, onAcceptLyrics, onAcceptChords }) => {
  const [activeTab, setActiveTab] = useState<'LYRICS' | 'CHORDS'>('LYRICS');
  const [isLoading, setIsLoading] = useState(false);
  
  // Lyrics State
  const [topic, setTopic] = useState('');
  const [lyricsResult, setLyricsResult] = useState<GeneratedLyrics | null>(null);

  // Chords State
  const [musicKey, setMusicKey] = useState('C');
  const [mood, setMood] = useState('Pop Feliz');
  const [chordsResult, setChordsResult] = useState<GeneratedChords | null>(null);

  const handleGenerateLyrics = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    const res = await generateLyrics(topic, 'kids');
    setLyricsResult(res);
    setIsLoading(false);
  };

  const handleGenerateChords = async () => {
    setIsLoading(true);
    const res = await generateProgression(musicKey, mood);
    setChordsResult(res);
    setIsLoading(false);
  };

  const handleAcceptLyrics = () => {
      if (lyricsResult && onAcceptLyrics) {
          onAcceptLyrics(`${lyricsResult.title.toUpperCase()}\n\n${lyricsResult.content}`);
          onClose();
      }
  };

  const handleAcceptChords = () => {
      if (chordsResult && onAcceptChords) {
          onAcceptChords(chordsResult);
          onClose();
      }
  };

  const keys = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Am', 'Em', 'Dm'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border-8 border-yellow-400 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-yellow-400 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
               <Sparkles className="text-yellow-500 w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-900 font-fredoka">Asistente Mágico (Gemini)</h2>
          </div>
          <button onClick={onClose} className="bg-yellow-600 text-white p-2 rounded-xl hover:bg-yellow-700">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
            <button 
                onClick={() => setActiveTab('LYRICS')}
                className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 ${activeTab === 'LYRICS' ? 'bg-purple-50 text-purple-600 border-b-4 border-purple-500' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <AlignLeft size={18}/> <span>Letras</span>
            </button>
            <button 
                onClick={() => setActiveTab('CHORDS')}
                className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 ${activeTab === 'CHORDS' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-500' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Grid size={18}/> <span>Armonía & Acordes</span>
            </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto">
            {activeTab === 'LYRICS' && (
                !lyricsResult ? (
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 font-nunito text-center">
                            Dime de qué quieres cantar y crearé una letra rítmica para ti.
                        </p>
                        <input 
                            type="text" 
                            className="w-full p-4 text-xl bg-gray-50 rounded-2xl border-4 border-gray-200 focus:border-purple-400 focus:outline-none"
                            placeholder="Ej: El ciclo del agua, La amistad..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <button 
                            onClick={handleGenerateLyrics}
                            disabled={isLoading || !topic}
                            className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-purple-500 hover:bg-purple-600 shadow-md transition-all"
                        >
                            {isLoading ? 'Pensando...' : '¡Escribir Canción!'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-2xl font-bold text-purple-600 font-fredoka text-center">{lyricsResult.title}</h3>
                        <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-100 max-h-[300px] overflow-y-auto whitespace-pre-line text-gray-700">
                            {lyricsResult.content}
                        </div>
                        <div className="flex space-x-2">
                             <button onClick={() => setLyricsResult(null)} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold text-gray-700">Volver</button>
                             <button onClick={handleAcceptLyrics} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold">Usar Letra</button>
                        </div>
                    </div>
                )
            )}

            {activeTab === 'CHORDS' && (
                !chordsResult ? (
                    <div className="space-y-6">
                         <p className="text-lg text-gray-600 font-nunito text-center">
                            Selecciona una tonalidad y un estilo. Crearé una progresión y una idea melódica.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tonalidad</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {keys.map(k => (
                                        <button 
                                            key={k} 
                                            onClick={() => setMusicKey(k)}
                                            className={`p-2 rounded-lg font-bold text-sm border-2 ${musicKey === k ? 'bg-blue-500 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estilo / Mood</label>
                                <select 
                                    className="w-full p-2 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-gray-700"
                                    value={mood} onChange={(e) => setMood(e.target.value)}
                                >
                                    <option>Pop Feliz</option>
                                    <option>Balada Triste</option>
                                    <option>Rock Enérgico</option>
                                    <option>Reggaeton Escolar</option>
                                    <option>Folk Chileno</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateChords}
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-md transition-all"
                        >
                            {isLoading ? 'Componiendo...' : 'Generar Progresión'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-blue-600">Progresión en {chordsResult.key}</h3>
                            <div className="flex justify-center space-x-2 my-4">
                                {chordsResult.progression.map((chord, i) => (
                                    <div key={i} className="bg-white border-2 border-blue-200 rounded-lg p-3 w-16 text-center shadow-sm">
                                        <div className="text-xs text-gray-400 mb-1">Compás {chord.bar}</div>
                                        <div className="text-xl font-black text-blue-800">{chord.name}</div>
                                    </div>
                                ))}
                            </div>
                            {chordsResult.melodyHint && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-left">
                                    <div className="text-xs font-bold text-yellow-700 uppercase mb-1 flex items-center"><Music size={12} className="mr-1"/> Idea Melódica (ABC)</div>
                                    <code className="font-mono text-sm text-yellow-900">{chordsResult.melodyHint}</code>
                                </div>
                            )}
                        </div>
                         <div className="flex space-x-2">
                             <button onClick={() => setChordsResult(null)} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold text-gray-700">Volver</button>
                             <button onClick={handleAcceptChords} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold">Añadir Pista Acordes</button>
                        </div>
                    </div>
                )
            )}
        </div>
      </div>
    </div>
  );
};