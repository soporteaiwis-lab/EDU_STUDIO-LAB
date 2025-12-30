import React from 'react';
import { UserMode } from '../types';
import { BookOpen, X, Download } from 'lucide-react';

interface LyricsPanelProps {
  mode: UserMode;
  content: string;
  onUpdateContent: (text: string) => void;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ mode, content, onUpdateContent, onClose }) => {
  const isPro = mode === UserMode.PRO;

  const handleExportSongbook = () => {
      const date = new Date().toLocaleDateString();
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Cancionero - EduStudio</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6; }
                header { border-bottom: 4px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { margin: 0; color: #1e3a8a; font-size: 28px; }
                .meta { font-size: 14px; color: #666; margin-top: 5px; }
                .song-container { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 16px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .chord { color: #e11d48; font-weight: bold; background: #fff1f2; padding: 0 4px; border-radius: 4px; }
                footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                @media print { body { padding: 0; } .song-container { border: none; } }
            </style>
        </head>
        <body>
            <header>
                <h1>Mi Canción (EduStudio)</h1>
                <div class="meta">Creado el ${date} con EduStudio Modular</div>
            </header>
            
            <div class="song-container">
${content.replace(/\[(.*?)\]/g, '<span class="chord">$1</span>')}
            </div>

            <footer>Generado por EduStudio Modular v1.1 - AWiwis AI & TI Solutions</footer>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cancionero_${Date.now()}.html`;
      a.click();
  };

  return (
    <div className={`w-80 flex-shrink-0 ${isPro ? 'bg-gray-800 border-l border-black text-gray-300' : 'bg-white border-l border-gray-200 text-gray-700'} flex flex-col h-full animate-slide-left z-30 shadow-xl`}>
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-opacity-50 bg-black">
         <div className="flex items-center space-x-2">
            <BookOpen size={16} className="text-yellow-500" />
            <h3 className="font-bold font-fredoka">Cancionero</h3>
         </div>
         <button onClick={onClose} className="text-xs hover:text-red-500"><X size={16}/></button>
      </div>

      <div className={`p-2 border-b ${isPro ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center text-xs`}>
          <span className="text-gray-500 italic">Letra y Acordes</span>
          <button onClick={handleExportSongbook} className="flex items-center space-x-1 text-blue-500 hover:text-blue-400 bg-blue-50/10 px-2 py-1 rounded">
             <Download size={12} /> <span>Exportar Web</span>
          </button>
      </div>

      <div className="flex-1 p-0 relative">
        <textarea 
            className={`w-full h-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed ${isPro ? 'bg-gray-900 text-gray-200' : 'bg-yellow-50 text-gray-800'}`}
            value={content}
            onChange={(e) => onUpdateContent(e.target.value)}
            placeholder={`INTRO:\n[C] [G] [Am] [F]\n\nVERSO 1:\nEn el agua clara [C]\nVeo mi reflejo [G]\n...`}
        />
        <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded text-white font-mono">Usa [C] para acordes</span>
        </div>
      </div>
    </div>
  );
};