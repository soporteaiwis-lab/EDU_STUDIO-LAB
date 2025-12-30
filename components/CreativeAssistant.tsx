import React, { useState } from 'react';
import { generateLyrics } from '../services/geminiService';
import { Sparkles, X } from 'lucide-react';
import { GeneratedLyrics } from '../types';

interface CreativeAssistantProps {
  onClose: () => void;
  onAcceptLyrics?: (lyrics: string) => void;
}

export const CreativeAssistant: React.FC<CreativeAssistantProps> = ({ onClose, onAcceptLyrics }) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedLyrics | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    // Simulate generation if API key is missing or fails for demo
    try {
        const lyrics = await generateLyrics(topic, 'kids');
        setResult(lyrics);
    } catch (e) {
        // Fallback demo content
        setResult({
            title: topic,
            content: `(Verso 1)\nEl ${topic} es muy genial\nBrilla mucho como un cristal\nTodos cantamos esta canción\nCon mucha fuerza y corazón\n\n(Coro)\nOh ${topic}, sí señor\nMe llenas de mucho amor.`
        });
    }
    setIsLoading(false);
  };

  const handleUseLyrics = () => {
      if (result && onAcceptLyrics) {
          onAcceptLyrics(`${result.title.toUpperCase()}\n\n${result.content}`);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border-8 border-yellow-400">
        
        {/* Header */}
        <div className="bg-yellow-400 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
               <Sparkles className="text-yellow-500 w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-900 font-fredoka">Asistente Mágico</h2>
          </div>
          <button onClick={onClose} className="bg-yellow-600 text-white p-2 rounded-xl hover:bg-yellow-700">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
            {!result ? (
                <div className="space-y-6">
                    <p className="text-lg text-gray-600 font-nunito">
                        ¡Hola! Soy tu amigo robot musical. 🤖🎶 <br/>
                        Dime de qué quieres cantar y te ayudaré a escribir la letra.
                    </p>
                    
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">¿Sobre qué es tu canción?</label>
                        <input 
                            type="text" 
                            className="w-full p-4 text-xl bg-gray-50 rounded-2xl border-4 border-gray-200 focus:border-yellow-400 focus:outline-none transition-colors"
                            placeholder="Ej: El cuidado del agua, Mi perro Toby..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                    </div>

                    <div className="flex justify-center pt-4">
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !topic}
                            className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1.5 transition-all ${
                                isLoading || !topic ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                        >
                            {isLoading ? (
                                <span>Pensando... 🧠</span>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    <span>¡Crear Magia!</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-purple-600 font-fredoka mb-2">{result.title}</h3>
                        <div className="bg-purple-50 p-6 rounded-2xl border-4 border-purple-100 max-h-[300px] overflow-y-auto text-left whitespace-pre-line text-lg text-gray-700 font-nunito leading-relaxed">
                            {result.content}
                        </div>
                    </div>
                    <div className="flex justify-center space-x-4">
                        <button 
                             onClick={() => setResult(null)}
                             className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
                        >
                            Intentar otro tema
                        </button>
                        <button 
                             onClick={handleUseLyrics}
                             className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-colors"
                        >
                            ¡Me gusta! Usar esta letra
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};