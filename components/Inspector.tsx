import React from 'react';
import { Track, InstrumentType, UserMode } from '../types';
import { 
  Guitar, Mic, Drum, Music, Keyboard, Wind, 
  WholeWord, Palette, Edit3, X, Zap, Bot, Mic2 
} from 'lucide-react';
import { audioService } from '../services/audioService';

interface InspectorProps {
  track: Track | undefined;
  mode: UserMode;
  onUpdate: (id: string, updates: Partial<Track>) => void;
  onClose: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({ track, mode, onUpdate, onClose }) => {
  if (!track || mode === UserMode.EXPLORER) return null;

  const instruments: {type: InstrumentType, icon: any, label: string}[] = [
    { type: 'DRUMS', icon: Drum, label: 'Batería' },
    { type: 'GUITAR', icon: Guitar, label: 'Guitarra' },
    { type: 'BASS', icon: Guitar, label: 'Bajo' },
    { type: 'KEYS', icon: Keyboard, label: 'Teclas' },
    { type: 'VOCAL', icon: Mic, label: 'Voz' },
    { type: 'WIND', icon: Wind, label: 'Viento' },
  ];

  const colors = [
    'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'
  ];

  const handleFxChange = (type: 'reverb' | 'pitch', value: number) => {
      if(!track) return;
      
      const newEffects = { ...track.effects, [type]: value };
      
      // Update State
      onUpdate(track.id, { effects: newEffects });
      
      // Update Engine
      if(type === 'reverb') audioService.setReverb(track.id, value);
      if(type === 'pitch') audioService.setPitch(track.id, value);
  };

  return (
    <div className={`w-72 flex-shrink-0 ${mode === UserMode.PRO ? 'bg-gray-800 border-r border-black' : 'bg-white border-r border-gray-200'} flex flex-col h-full overflow-y-auto animate-slide-right`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className={`font-bold font-fredoka ${mode === UserMode.PRO ? 'text-gray-300' : 'text-gray-700'}`}>INSPECTOR</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={18}/></button>
      </div>

      {/* Track Name */}
      <div className="p-4">
        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre de Pista</label>
        <div className="flex items-center space-x-2">
            <Edit3 size={16} className="text-gray-500"/>
            <input 
                type="text" 
                value={track.name}
                onChange={(e) => onUpdate(track.id, { name: e.target.value })}
                className={`w-full bg-transparent border-b ${mode === UserMode.PRO ? 'border-gray-600 text-white focus:border-blue-500' : 'border-gray-300 text-gray-800 focus:border-blue-500'} focus:outline-none py-1 font-bold`}
            />
        </div>
      </div>

      {/* Instrument Icon Selector */}
      <div className="p-4 border-t border-gray-700/50">
        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Instrumento</label>
        <div className="grid grid-cols-3 gap-2">
            {instruments.map(inst => (
                <button 
                    key={inst.type}
                    onClick={() => onUpdate(track.id, { instrument: inst.type })}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${track.instrument === inst.type ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600'}`}
                >
                    <inst.icon size={20} />
                    <span className="text-[10px] mt-1">{inst.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Color Selector */}
      <div className="p-4 border-t border-gray-700/50">
        <label className="text-xs font-bold text-gray-500 uppercase block mb-2 flex items-center"><Palette size={12} className="mr-1"/> Color de Pista</label>
        <div className="flex flex-wrap gap-2">
            {colors.map(c => (
                <button 
                    key={c}
                    onClick={() => onUpdate(track.id, { color: c })}
                    className={`w-6 h-6 rounded-full ${c} ${track.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : 'hover:scale-110'} transition-all`}
                />
            ))}
        </div>
      </div>

      {/* REAL FX SECTION */}
      <div className="p-4 border-t border-gray-700/50 flex-1">
        <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Insertos / FX</label>
        </div>
        <div className="space-y-2">
            
            {/* Reverb Toggle */}
            <button 
                onClick={() => handleFxChange('reverb', track.effects?.reverb > 0 ? 0 : 0.5)}
                className={`w-full p-2 rounded flex items-center justify-between transition-colors ${track.effects?.reverb > 0 ? 'bg-purple-600 text-white shadow-lg' : (mode === UserMode.PRO ? 'bg-gray-900 text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-500')}`}
            >
                <div className="flex items-center space-x-2">
                    <WholeWord size={14} className={track.effects?.reverb > 0 ? "text-white" : "text-purple-500"}/>
                    <span className="text-xs font-bold">Reverb (Estadio)</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${track.effects?.reverb > 0 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
            </button>

            {/* Pitch Shift Toggle (Robot Voice) */}
            <button 
                onClick={() => handleFxChange('pitch', track.effects?.pitch !== 0 ? 0 : -12)}
                className={`w-full p-2 rounded flex items-center justify-between transition-colors ${track.effects?.pitch !== 0 ? 'bg-orange-600 text-white shadow-lg' : (mode === UserMode.PRO ? 'bg-gray-900 text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-500')}`}
            >
                <div className="flex items-center space-x-2">
                    <Bot size={14} className={track.effects?.pitch !== 0 ? "text-white" : "text-orange-500"}/>
                    <span className="text-xs font-bold">Voz Robot (-12st)</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${track.effects?.pitch !== 0 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
            </button>
            
             <div className={`p-2 rounded flex items-center justify-between opacity-50 border border-dashed ${mode === UserMode.PRO ? 'border-gray-700' : 'border-gray-300'}`}>
                <span className="text-xs text-gray-500 flex items-center"><Zap size={12} className="mr-1"/> + Agregar Efecto</span>
            </div>
        </div>
      </div>
    </div>
  );
};