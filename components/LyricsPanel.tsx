import React from 'react';
import { UserMode } from '../types';
import { BookOpen, X, Edit, Type, Save } from 'lucide-react';

interface LyricsPanelProps {
  mode: UserMode;
  content: string;
  onUpdateContent: (text: string) => void;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ mode, content, onUpdateContent, onClose }) => {
  const isPro = mode === UserMode.PRO;

  return (
    <div className={`w-80 flex-shrink-0 ${isPro ? 'bg-gray-800 border-l border-black text-gray-300' : 'bg-white border-l border-gray-200 text-gray-700'} flex flex-col h-full animate-slide-left z-30 shadow-xl`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-opacity-50 bg-black">
         <div className="flex items-center space-x-2">
            <BookOpen size={16} className="text-yellow-500" />
            <h3 className="font-bold font-fredoka">Cancionero / Letra</h3>
         </div>
         <button onClick={onClose} className="text-xs hover:text-red-500"><X size={16}/></button>
      </div>

      {/* Editor Toolbar */}
      <div className={`p-2 border-b ${isPro ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center text-xs`}>
          <span className="text-gray-500 italic">Escribe o pega tu letra aquí</span>
          <div className="flex space-x-2">
             <button className="p-1 hover:bg-gray-700 rounded" title="Añadir Acorde"><Music size={14} /></button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-0 relative">
        <textarea 
            className={`w-full h-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed ${isPro ? 'bg-gray-900 text-gray-200' : 'bg-yellow-50 text-gray-800'}`}
            value={content}
            onChange={(e) => onUpdateContent(e.target.value)}
            placeholder={`Intro: [C] [G] [Am] [F]\n\n(Verso 1)\nEn el agua clara [C]\nVeo mi reflejo [G]\n...`}
        />
        {/* Visual Cue for American Chords */}
        <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded text-white">Usa [C] para acordes</span>
        </div>
      </div>
      
      <div className="p-2 border-t border-gray-700">
         <button className="w-full py-2 bg-green-600 text-white font-bold rounded flex items-center justify-center text-xs hover:bg-green-700">
             <Save size={14} className="mr-2"/> Guardar Cambios
         </button>
      </div>
    </div>
  );
};
import { Music } from 'lucide-react';