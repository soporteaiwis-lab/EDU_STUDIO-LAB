import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrackBlock } from './TrackBlock';
import { Mixer } from './Mixer';
import { Inspector } from './Inspector';
import { Browser } from './Browser';
import { LyricsPanel } from './LyricsPanel';
import { TimelineRuler } from './TimelineRuler';
import { CreativeAssistant } from './CreativeAssistant';
import { audioService } from '../services/audioService';
import { Track, UserMode, MetronomeConfig } from '../types';
import { 
    Play, Square, Sparkles, Home, Download, 
    SkipBack, Circle, Sliders, Settings2,
    Grid, BookOpen, Pause, PanelBottom, User
} from 'lucide-react';

interface StudioProps {
  userMode: UserMode;
  onExit: () => void;
}

const INITIAL_TRACKS: Track[] = [
  { 
    id: '1', name: 'Batería Demo', type: 'AUDIO', instrument: 'DRUMS', color: 'bg-rose-500', 
    volume: 80, pan: 0, eq: { low: 0, mid: 0, high: 0 }, 
    effects: { reverb: 0, pitch: 0, distortion: 0 },
    isMuted: false, isSolo: false, isArmed: false, 
    audioUrl: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3' 
  },
];

// Constant for Track Header Width
const HEADER_WIDTH = 256; // 256px

export const Studio: React.FC<StudioProps> = ({ userMode, onExit }) => {
  // --- STATE ---
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // To track which track is currently being recorded to (especially for Explorer mode auto-create)
  const recordingTrackIdRef = useRef<string | null>(null);

  // Layout Visibility
  const [showMixer, setShowMixer] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Data
  const [lyricsContent, setLyricsContent] = useState('');
  const [bpm, setBpm] = useState(120);
  const [metronome, setMetronome] = useState<MetronomeConfig>({ enabled: false, bpm: 120, timeSignature: [4,4], countIn: false, clickSound: 'BEEP', volume: 80 });

  // Refs
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Themes
  const isPro = userMode === UserMode.PRO;
  const isExplorer = userMode === UserMode.EXPLORER;
  const bgMain = isPro ? 'bg-gray-900 text-gray-200' : isExplorer ? 'bg-lego text-gray-800' : 'bg-gray-50 text-gray-700';

  // --- AUDIO SYNC & EFFECTS ---
  useEffect(() => {
    tracks.forEach(t => { if(t.audioUrl) audioService.addTrack(t.id, t.audioUrl); });
    return () => { audioService.stop(); }
  }, []);

  useEffect(() => {
    audioService.setBpm(bpm);
  }, [bpm]);

  // --- PLAYHEAD ANIMATION ---
  useEffect(() => {
    const animate = () => {
      if (playheadRef.current) {
        const time = audioService.getCurrentTime();
        const pixelsPerSecond = 40; 
        const position = HEADER_WIDTH + (time * pixelsPerSecond);
        playheadRef.current.style.transform = `translateX(${position}px)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if(animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []);

  // --- HANDLERS ---
  const handlePlayToggle = async () => {
    await audioService.initialize();
    if (isPlaying) { 
        audioService.pause(); 
    } else { 
        audioService.play(); 
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
      audioService.stop();
      setIsPlaying(false);
      setIsRecording(false);
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(${HEADER_WIDTH}px)`;
  };

  const handleRewind = () => {
      audioService.setTime(0);
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(${HEADER_WIDTH}px)`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineContainerRef.current?.getBoundingClientRect();
    if (rect) {
        let x = e.clientX - rect.left + (timelineContainerRef.current?.scrollLeft || 0);
        if (x < HEADER_WIDTH) x = HEADER_WIDTH;
        
        const pixelsPerSecond = 40;
        const timelineX = x - HEADER_WIDTH;
        const newTime = Math.max(0, timelineX / pixelsPerSecond);
        
        audioService.setTime(newTime);
    }
  };

  // --- RECORDING LOGIC ---
  const handleRecordToggle = async () => {
    
    // STOP RECORDING
    if (isRecording) {
      const audioUrl = await audioService.stopRecording();
      setIsRecording(false);
      handleStop(); 
      
      const targetId = recordingTrackIdRef.current; 
      
      if (audioUrl && targetId) {
         await audioService.addTrack(targetId, audioUrl);
         setTracks(prev => prev.map(t => t.id === targetId ? { ...t, audioUrl: audioUrl, isArmed: false } : t));
         recordingTrackIdRef.current = null;
      }
      return;
    }

    // START RECORDING
    let targetTrackId: string | null = null;
    const existingArmed = tracks.find(t => t.isArmed);

    if (isExplorer) {
        const newId = Date.now().toString();
        const newTrack: Track = {
            id: newId, 
            name: `Grabación ${tracks.length + 1}`, 
            type: 'AUDIO', 
            instrument: 'VOCAL', 
            color: 'bg-rose-500', 
            volume: 80, pan: 0, eq: {low:0, mid:0, high:0},
            effects: { reverb: 0, pitch: 0, distortion: 0 },
            isMuted: false, isSolo: false, 
            isArmed: true, 
            audioUrl: undefined
        };
        
        setTracks(prev => [...prev, newTrack]);
        targetTrackId = newId;

    } else {
        if (!existingArmed) {
            alert("¡Arma una pista (Botón Rojo) para grabar en ella!");
            return;
        }
        targetTrackId = existingArmed.id;
    }

    try {
        await audioService.startRecording();
        recordingTrackIdRef.current = targetTrackId;
        setIsRecording(true);
        if (!isPlaying) { 
            audioService.play(); 
            setIsPlaying(true); 
        }
    } catch (e) {
        alert("Error al iniciar grabación. Verifica permisos de micrófono.");
        if (isExplorer && targetTrackId) {
            setTracks(prev => prev.filter(t => t.id !== targetTrackId));
        }
    }
  };

  const handleImport = async (url: string, name: string, type: 'AUDIO'|'MIDI') => {
      const newId = Date.now().toString();
      const newTrack: Track = {
          id: newId, name: name, type: type, instrument: type === 'MIDI' ? 'KEYS' : 'UNKNOWN',
          color: 'bg-emerald-500', volume: 80, pan: 0, eq: {low:0, mid:0, high:0},
          effects: { reverb: 0, pitch: 0, distortion: 0 },
          isMuted: false, isSolo: false, isArmed: false, audioUrl: type === 'AUDIO' ? url : undefined
      };
      if (type === 'AUDIO') await audioService.addTrack(newId, url);
      setTracks([...tracks, newTrack]);
  };

  const handleExport = async () => {
      setIsExporting(true);
      try {
          const blob = await audioService.exportMixdown(10);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `EduStudio_${Date.now()}.wav`; a.click();
      } catch (e) { console.error(e); }
      setIsExporting(false);
  };

  const addTrack = (type: 'AUDIO'|'MIDI', name?: string) => {
      const newT: Track = {
          id: Date.now().toString(), name: name || (type === 'AUDIO' ? 'Audio Nuevo' : 'Inst. Nuevo'),
          type: type, instrument: type === 'AUDIO' ? 'VOCAL' : 'KEYS', color: 'bg-gray-500',
          volume: 80, pan: 0, eq: {low:0, mid:0, high:0},
          effects: { reverb: 0, pitch: 0, distortion: 0 },
          isMuted: false, isSolo: false, isArmed: false
      };
      setTracks([...tracks, newT]);
  };

  const gridLines = useMemo(() => {
    const lines = [];
    const pixelsPerSecond = 40;
    const secondsPerBar = (60 / bpm) * 4;
    const pixelsPerBar = pixelsPerSecond * secondsPerBar;
    
    for(let i=0; i<50; i++) {
        lines.push(
            <div key={`bar-${i}`} className={`absolute top-0 bottom-0 w-px border-l ${isPro ? 'border-gray-600' : 'border-gray-400'} pointer-events-none opacity-50`} style={{left: `${HEADER_WIDTH + (i * pixelsPerBar)}px`}}></div>
        );
        for(let j=1; j<4; j++) {
             lines.push(
                <div key={`beat-${i}-${j}`} className={`absolute top-0 bottom-0 w-px border-l ${isPro ? 'border-gray-700' : 'border-gray-300'} pointer-events-none opacity-30 border-dashed`} style={{left: `${HEADER_WIDTH + (i * pixelsPerBar) + (j * (pixelsPerBar/4))}px`}}></div>
            );
        }
    }
    return lines;
  }, [bpm, isPro]);

  // --- MAIN RENDER ---
  return (
    <div className={`flex flex-col h-screen ${bgMain} font-nunito select-none overflow-hidden relative`}>
        
        {/* 1. HEADER */}
        <div className={`h-10 flex-shrink-0 flex justify-between items-center px-4 z-50 shadow-sm ${isPro ? 'bg-[#1a1a1a] border-b border-black text-gray-400' : 'bg-white border-b border-gray-200'}`}>
            <div className="flex items-center space-x-3">
                <button onClick={onExit} className="hover:text-white flex items-center"><Home size={16} className="mr-1"/> <span className="text-xs font-bold">Salir</span></button>
            </div>
            <div className="text-xs font-bold opacity-50">EDUSTUDIO {userMode}</div>
            <div className="flex items-center space-x-2">
                 <button onClick={() => setShowAI(true)} className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full font-bold text-[10px] hover:brightness-110"><Sparkles size={12}/><span>IA MAGIC</span></button>
            </div>
        </div>

        {/* 2. TRANSPORT */}
        <div className={`h-12 flex-shrink-0 flex items-center px-4 space-x-6 z-40 border-b ${isPro ? 'bg-[#252526] border-black text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
             <div className="flex items-center space-x-2">
                 <button onClick={handleRewind} className="p-1.5 rounded hover:bg-black/20"><SkipBack size={18} fill="currentColor"/></button>
                 <button onClick={handleStop} className="p-1.5 rounded hover:bg-black/20"><Square size={18} fill="currentColor"/></button>
                 <button onClick={handlePlayToggle} className={`p-1.5 rounded-full ${isPlaying ? 'bg-amber-500 text-white' : 'hover:bg-black/20 text-green-500'}`}>
                     {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
                 </button>
                 <button onClick={handleRecordToggle} className={`p-1.5 rounded-full ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'hover:bg-black/20 text-red-500'}`}>
                     <Circle size={20} fill="currentColor"/>
                 </button>
             </div>
             <div className="w-px h-6 bg-gray-500/30"></div>
             <div className="flex items-center space-x-4 font-mono">
                 <div className="flex flex-col items-center leading-none group cursor-ns-resize">
                     <span className="text-xl font-bold text-blue-400">{bpm}</span>
                     <span className="text-[9px] text-gray-500">BPM</span>
                     <input type="range" min="60" max="240" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="absolute w-10 opacity-0"/>
                 </div>
                 <div className="flex flex-col items-center leading-none">
                     <span className="text-xl font-bold text-gray-400">4/4</span>
                     <span className="text-[9px] text-gray-500">SIG</span>
                 </div>
             </div>
             <div className="flex-1"></div>
             
             {/* Toggle Dock Buttons */}
             <div className="flex items-center space-x-2 border-l border-gray-500/30 pl-4">
                 <button onClick={() => setShowMixer(!showMixer)} className={`p-1.5 rounded ${showMixer ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`} title="Mezclador"><PanelBottom size={18}/></button>
                 <button onClick={() => {setShowBrowser(false); setShowLyrics(!showLyrics);}} className={`p-1.5 rounded ${showLyrics ? 'bg-gray-600 text-white' : 'text-gray-500'}`} title="Cancionero"><BookOpen size={18}/></button>
                 <button onClick={() => {setShowLyrics(false); setShowBrowser(!showBrowser);}} className={`p-1.5 rounded ${showBrowser ? 'bg-gray-600 text-white' : 'text-gray-500'}`} title="Biblioteca"><Grid size={18}/></button>
                 <button onClick={handleExport} className="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center"><Download size={12} className="mr-1"/> Export</button>
             </div>
        </div>

        {/* 3. CENTER LAYOUT (HORIZONTAL) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
            
            {/* LEFT: INSPECTOR */}
            {!isExplorer && showInspector && selectedTrackId && (
                <Inspector 
                    track={tracks.find(t => t.id === selectedTrackId)} 
                    mode={userMode}
                    onUpdate={(id, up) => {
                        setTracks(prev => prev.map(t => t.id === id ? { ...t, ...up } : t));
                        // Propagate generic updates immediately, specialized FX are handled in component but this is good safety
                        if(up.effects) {
                            if(up.effects.reverb !== undefined) audioService.setReverb(id, up.effects.reverb);
                            if(up.effects.pitch !== undefined) audioService.setPitch(id, up.effects.pitch);
                        }
                    }}
                    onClose={() => setSelectedTrackId(null)}
                />
            )}

            {/* MIDDLE: TIMELINE + MIXER (VERTICAL STACK) */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                
                {/* A: SCROLLABLE TIMELINE */}
                <div 
                    ref={timelineContainerRef}
                    className="flex-1 overflow-auto relative scroll-smooth bg-opacity-10 cursor-crosshair bg-black/20"
                    onMouseDown={(e) => {
                         const target = e.target as HTMLElement;
                         if(target === timelineContainerRef.current) handleSeek(e);
                    }}
                >
                     <div className="sticky top-0 z-30 w-fit" onMouseDown={handleSeek}>
                        <TimelineRuler mode={userMode} bpm={bpm} zoom={1} paddingLeft={HEADER_WIDTH} />
                     </div>

                     <div className="relative min-w-max pb-32">
                         <div className="absolute top-0 left-0 min-w-full h-full pointer-events-none z-0">{gridLines}</div>
                         <div 
                            ref={playheadRef}
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none will-change-transform"
                            style={{ left: '0px', transform: `translateX(${HEADER_WIDTH}px)` }} 
                         >
                            <div className="w-3 h-3 -ml-1.5 bg-red-500 transform rotate-45 -mt-1.5 shadow-sm border border-white/50"></div>
                            <div className="h-full w-full shadow-[0_0_8px_rgba(255,0,0,0.6)]"></div>
                         </div>
                         <div className="relative z-10 pt-2">
                            {tracks.map(track => (
                                <TrackBlock 
                                    key={track.id} 
                                    track={{...track, isSelected: track.id === selectedTrackId}} 
                                    mode={userMode}
                                    onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}}
                                    onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}}
                                    onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}}
                                    onToggleArm={(id) => setTracks(prev => prev.map(t => ({...t, isArmed: t.id === id ? !t.isArmed : false})))}
                                    onDelete={(id) => setTracks(prev => prev.filter(t => t.id !== id))}
                                    onSelect={(id) => { setSelectedTrackId(id); setShowInspector(true); }}
                                />
                            ))}
                         </div>
                         <div className="mt-4 p-4 border-2 border-dashed border-gray-600/30 rounded-xl flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity w-fit" style={{ marginLeft: HEADER_WIDTH }}>
                             <button onClick={() => addTrack('AUDIO')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold mr-4">+ Audio Track</button>
                             <button onClick={() => addTrack('MIDI')} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Instrument Track</button>
                        </div>
                     </div>
                </div>

                {/* B: DOCKED MIXER (FIXED HEIGHT) */}
                {showMixer && !isExplorer && (
                    <div className="h-64 flex-shrink-0 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] border-t border-gray-700 animate-slide-up relative">
                        <Mixer 
                            tracks={tracks} mode={userMode}
                            onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}}
                            onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}}
                            onEQChange={(id, b, v) => {const t=tracks.find(x=>x.id===id); if(t){const n={...t.eq, [b]:v}; setTracks(prev=>prev.map(x=>x.id===id?{...x, eq:n}:x)); audioService.setEQ(id, n.low, n.mid, n.high);}}}
                            onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}}
                            onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}}
                            onClose={() => setShowMixer(false)}
                        />
                    </div>
                )}
            </div>

            {/* RIGHT: PANELS */}
            {showBrowser && (
                <Browser 
                    mode={userMode}
                    onImport={handleImport}
                    onClose={() => setShowBrowser(false)}
                />
            )}
            {showLyrics && (
                <LyricsPanel 
                    mode={userMode}
                    content={lyricsContent}
                    onUpdateContent={setLyricsContent}
                    onClose={() => setShowLyrics(false)}
                />
            )}

        </div>

        {showAI && <CreativeAssistant onClose={() => setShowAI(false)} onAcceptLyrics={(text) => {setLyricsContent(text); setShowLyrics(true);}} />}
    </div>
  );
};