import React, { useState } from 'react';
import { UserMode, SongMetadata } from '../types';
import { BookOpen, X, Download, Music, Grid, AlignLeft, Printer, FileText, Settings, Play } from 'lucide-react';
import { audioService } from '../services/audioService';

interface SongbookPanelProps {
  mode: UserMode;
  metadata: SongMetadata;
  onUpdateLyrics: (text: string) => void;
  onClose: () => void;
}

export const SongbookPanel: React.FC<SongbookPanelProps> = ({ mode, metadata, onUpdateLyrics, onClose }) => {
  const [exportMode, setExportMode] = useState<'CLASSIC' | 'REPORT'>('CLASSIC');
  const [showExportOptions, setShowExportOptions] = useState(false);

  const isPro = mode === UserMode.PRO;
  const bgColor = isPro ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700';

  // --- HTML GENERATORS ---

  const generateClassicHTML = () => {
      // Replaces [C] with floating chords
      const processedLyrics = metadata.lyrics.replace(/\[(.*?)\]/g, '<span class="chord">$1</span>');
      
      return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${metadata.title} - Cancionero</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #333; }
                h1 { color: #e11d48; margin-bottom: 5px; }
                .meta { color: #666; font-size: 14px; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                .content { font-family: 'Courier New', monospace; font-size: 16px; line-height: 2.5; white-space: pre-wrap; }
                .chord { 
                    position: absolute; margin-top: -1.2em; font-weight: bold; color: #e11d48; 
                    background: rgba(255,255,255,0.8); padding: 0 2px;
                }
                .line-container { position: relative; display: inline-block; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>${metadata.title}</h1>
            <div class="meta">
                <strong>Autor:</strong> ${metadata.author || 'Estudiante AIWIS'} | 
                <strong>Tono:</strong> ${metadata.key} | 
                <strong>BPM:</strong> ${metadata.bpm}
            </div>
            <div class="content">${processedLyrics.split('\n').map(line => 
                `<div class="line-container">${line.replace(/\[(.*?)\]/g, '<span class="chord">$1</span>')}</div>`
            ).join('\n')}</div>
            <footer style="margin-top:50px; font-size:10px; text-align:center; color:#999;">
                Generado por AIWIS EduStudio Modular v1.3
            </footer>
        </body>
        </html>
      `;
  };

  const generateReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <title>Informe Técnico - ${metadata.title}</title>
          <style>
              body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f2937; }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              h2 { background: #f3f4f6; padding: 8px; border-left: 4px solid #f59e0b; margin-top: 30px; }
              .section { margin-bottom: 20px; }
              .lyrics { font-family: 'Courier New', monospace; white-space: pre-wrap; background: #fffbeb; padding: 15px; border: 1px solid #fcd34d; border-radius: 8px; }
              .score-box { background: #fff; border: 1px solid #e5e7eb; padding: 15px; font-family: 'Times New Roman', serif; font-size: 18px; font-style: italic; }
              .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9fafb; padding: 10px; border-radius: 8px; }
              .tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          </style>
      </head>
      <body>
          <h1>Informe de Proyecto Musical</h1>
          <div class="grid-info">
              <div><strong>Título:</strong> ${metadata.title}</div>
              <div><strong>Creador:</strong> ${metadata.author}</div>
              <div><strong>BPM:</strong> ${metadata.bpm}</div>
              <div><strong>Tonalidad:</strong> ${metadata.key}</div>
          </div>

          <div class="section">
              <h2>1. Letra y Estructura</h2>
              <div class="lyrics">${metadata.lyrics}</div>
          </div>

          ${metadata.melody ? `
          <div class="section">
              <h2>2. Melodía (Notación ABC)</h2>
              <div class="score-box">
                  <strong>Clave:</strong> ${metadata.melody.clef}<br/>
                  <code>${metadata.melody.abc}</code>
              </div>
          </div>
          ` : ''}

          ${metadata.rhythm ? `
          <div class="section">
              <h2>3. Patrón Rítmico</h2>
              <div class="score-box">
                  Estilo: <span class="tag">${metadata.rhythm.style}</span><br/>
                  Eventos: ${metadata.rhythm.events.length} golpes programados.
              </div>
          </div>
          ` : ''}

          ${metadata.chords ? `
          <div class="section">
              <h2>4. Progresión Armónica</h2>
              <div class="score-box">
                  ${metadata.chords.progression.map(c => `| ${c.name} `).join('')} |
              </div>
          </div>
          ` : ''}

          <footer style="margin-top:50px; text-align:center; font-size:12px; color:#6b7280;">
              Documento generado automáticamente por AIWIS Platform.
          </footer>
      </body>
      </html>
    `;
  };

  const handleExport = () => {
      const content = exportMode === 'CLASSIC' ? generateClassicHTML() : generateReportHTML();
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata.title.replace(/\s+/g, '_')}_${exportMode}.html`;
      a.click();
      setShowExportOptions(false);
  };

  const previewMelody = () => {
      if(metadata.melody) {
          audioService.scheduleMelody('sb_preview', metadata.melody.events);
          audioService.addTrack('sb_preview', '', 'INSTRUMENT').then(() => {
              audioService.play();
              setTimeout(() => audioService.stop(), 4000);
          });
      }
  };

  return (
    <div className={`w-96 flex-shrink-0 ${bgColor} border-l border-gray-600 flex flex-col h-full animate-slide-left z-30 shadow-2xl relative`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-600 flex justify-between items-center bg-black/10">
         <div className="flex items-center space-x-2">
            <BookOpen size={20} className="text-yellow-500" />
            <div>
                <h3 className="font-bold font-fredoka leading-none">Cancionero</h3>
                <span className="text-[10px] opacity-60">Gestión Documental</span>
            </div>
         </div>
         <button onClick={onClose} className="hover:text-red-500"><X size={18}/></button>
      </div>

      {/* Metadata Summary */}
      <div className="p-3 bg-yellow-500/10 border-b border-gray-600/50 flex space-x-2 overflow-x-auto no-scrollbar">
          {metadata.chords && <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-500 text-[10px] font-bold border border-blue-500/50 whitespace-nowrap flex items-center"><Grid size={10} className="mr-1"/> Armonía: {metadata.key}</span>}
          {metadata.melody && <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-[10px] font-bold border border-yellow-500/50 whitespace-nowrap flex items-center cursor-pointer hover:bg-yellow-500/30" onClick={previewMelody}><Music size={10} className="mr-1"/> Melodía (Play)</span>}
          {metadata.rhythm && <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-[10px] font-bold border border-red-500/50 whitespace-nowrap flex items-center"><AlignLeft size={10} className="mr-1"/> Ritmo: {metadata.rhythm.style}</span>}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea 
            className={`w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed ${isPro ? 'bg-gray-900 text-gray-300' : 'bg-[#fffdf5] text-gray-800'}`}
            value={metadata.lyrics}
            onChange={(e) => onUpdateLyrics(e.target.value)}
            placeholder="Escribe o genera tu letra aquí..."
        />
        {/* Helper overlay */}
        <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 opacity-50 pointer-events-none">
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded text-white font-mono backdrop-blur-sm">Acordes: [C] [Am]</span>
        </div>
      </div>

      {/* Footer / Export */}
      <div className="p-4 border-t border-gray-600 bg-black/5">
         {!showExportOptions ? (
             <button onClick={() => setShowExportOptions(true)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center">
                 <Printer size={16} className="mr-2"/> Exportar Cancionero
             </button>
         ) : (
             <div className="space-y-3 animate-slide-up">
                 <div className="text-xs font-bold uppercase text-gray-500 text-center">Selecciona Formato</div>
                 <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => {setExportMode('CLASSIC'); handleExport();}} className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 flex flex-col items-center group">
                         <FileText size={24} className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                         <span className="text-xs font-bold text-gray-600">Clásico</span>
                         <span className="text-[9px] text-gray-400">Letra + Acordes</span>
                     </button>
                     <button onClick={() => {setExportMode('REPORT'); handleExport();}} className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 flex flex-col items-center group">
                         <Settings size={24} className="text-gray-400 group-hover:text-purple-500 mb-2"/>
                         <span className="text-xs font-bold text-gray-600">Informe Técnico</span>
                         <span className="text-[9px] text-gray-400">Todo incluido</span>
                     </button>
                 </div>
                 <button onClick={() => setShowExportOptions(false)} className="w-full py-2 text-xs font-bold text-gray-500 hover:text-red-500">Cancelar</button>
             </div>
         )}
      </div>

      {/* MELODY VISUALIZER POPUP (Simple Tab/Score View when hovering melody metadata) */}
      {metadata.melody && (
          <div className="absolute bottom-24 left-4 right-4 bg-white shadow-xl rounded-xl p-3 border border-gray-200 transform transition-all scale-95 opacity-0 hover:opacity-100 hover:scale-100 origin-bottom z-50 pointer-events-none">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vista Rápida: Partitura</div>
              <div className="font-mono text-xs bg-gray-50 p-2 rounded text-gray-800 break-words">
                  {metadata.melody.abc}
              </div>
          </div>
      )}
    </div>
  );
};