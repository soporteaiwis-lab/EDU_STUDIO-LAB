import React from 'react';
import { UserMode } from '../types';
import { BookOpen, X, Music, Save, Download } from 'lucide-react';

interface LyricsPanelProps {
  mode: UserMode;
  content: string;
  onUpdateContent: (text: string) => void;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ mode, content, onUpdateContent, onClose }) => {
  const isPro = mode === UserMode.PRO;

  const handleExportSongbook = () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cancionero - EduStudio</title>
            <style>
                body { font-family: sans-serif; padding: 40px; max-width: 800px; mx-auto; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                pre { background: #f4f4f4; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 16px; white-space: pre-wrap; }
                .chord { color: #e11d48; font-weight: bold; }
                footer { margin-top: 50px; font-size: 12px; color: #888; }
            </style>
        </head>
        <body>
            <h1>Mi Canción (EduStudio)</h1>
            <pre>${content.replace(/\[(.*?)\]/g, '<span class="chord">[$1]</span>')}</pre>
            <footer>Generado por EduStudio Modular v1.0 - AWiwis AI Solutions</footer>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cancionero.html';
      a.click();
  };

  return (
    <div className={`w-80 flex-shrink-0 ${isPro ? 'bg-gray-800 border-l border-black text-gray-300' : 'bg-white border-l border-gray-200 text-gray-700'} flex flex-col h-full animate-slide-left z-30 shadow-xl`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-opacity-50 bg-black">
         <div className="flex items-center space-x-2">
            <BookOpen size={16} className="text-yellow-500" />
            <h3 className="font-bold font-fredoka">Cancionero</h3>
         </div>
         <button onClick={onClose} className="text-xs hover:text-red-500"><X size={16}/></button>
      </div>

      {/* Toolbar */}
      <div className={`p-2 border-b ${isPro ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center text-xs`}>
          <span className="text-gray-500 italic">Letra y Acordes</span>
          <button onClick={handleExportSongbook} className="flex items-center space-x-1 text-blue-500 hover:text-blue-400">
             <Download size={12} /> <span>Exportar HTML</span>
          </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-0 relative">
        <textarea 
            className={`w-full h-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed ${isPro ? 'bg-gray-900 text-gray-200' : 'bg-yellow-50 text-gray-800'}`}
            value={content}
            onChange={(e) => onUpdateContent(e.target.value)}
            placeholder={`Intro: [C] [G] [Am] [F]\n\n(Verso 1)\nEn el agua clara [C]\nVeo mi reflejo [G]\n...`}
        />
        <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded text-white">Usa [C] para acordes</span>
        </div>
      </div>
      
      <div className="p-2 border-t border-gray-700">
         <button className="w-full py-2 bg-green-600 text-white font-bold rounded flex items-center justify-center text-xs hover:bg-green-700">
             <Save size={14} className="mr-2"/> Guardar en Drive (Simulado)
         </button>
      </div>
    </div>
  );
};