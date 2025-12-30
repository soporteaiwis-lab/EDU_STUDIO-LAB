import React, { useState, useEffect, useRef } from 'react';
import { TrackBlock } from './TrackBlock';
import { Mixer } from './Mixer';
import { Inspector } from './Inspector';
import { Browser } from './Browser';
import { TimelineRuler } from './TimelineRuler';
import { CreativeAssistant } from './CreativeAssistant';
import { audioService } from '../services/audioService';
import { Track, UserMode, MetronomeConfig } from '../types';
import { 
    Mic, Play, Square, Plus, Sparkles, Home, Save, Download, 
    SkipBack, SkipForward, Repeat, Circle, Sliders, Settings2,
    ChevronDown, Music, Undo2, Redo2, Clock, Grid, MoreVertical,
    GripHorizontal, Pause
} from 'lucide-react';

interface StudioProps {
  userMode: UserMode;
  onExit: () => void;
}

const INITIAL_TRACKS: Track[] = [
  { 
    id: '1', name: 'Batería Demo', type: 'AUDIO', instrument: 'DRUMS', color: 'bg-rose-500', 
    volume: 80, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, isArmed: false, 
    audioUrl: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3' 
  },
];

export const Studio: React.FC<StudioProps> = ({ userMode, onExit }) => {
  // State
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Layout State
  const [showMixer, setShowMixer] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Settings
  const [bpm, setBpm] = useState(120);
  const [metronome, setMetronome] = useState<MetronomeConfig>({ enabled: false, bpm: 120, timeSignature: [4,4], countIn: false, clickSound: 'BEEP', volume: 80 });

  // Refs for performance
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Themes
  const isPro = userMode === UserMode.PRO;
  const isExplorer = userMode === UserMode.EXPLORER;

  // --- Effects ---
  useEffect(() => {
    tracks.forEach(t => { if(t.audioUrl) audioService.addTrack(t.id, t.audioUrl); });
    return () => { audioService.stop(); }
  }, []);

  // Optimized Playhead Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (playheadRef.current) {
        const time = audioService.getCurrentTime();
        const pixelsPerSecond = 40; // Must match TimelineRuler
        playheadRef.current.style.transform = `translateX(${time * pixelsPerSecond}px)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying || isRecording) {
        animate();
    } else {
        cancelAnimationFrame(animationFrameId);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isRecording]);

  useEffect(() => {
    audioService.setBpm(bpm);
  }, [bpm]);

  // --- Handlers ---
  const handlePlayToggle = async () => {
    await audioService.initialize();
    if (isPlaying) { audioService.pause(); } else { audioService.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
      audioService.stop();
      setIsPlaying(false);
      setIsRecording(false);
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(0px)`;
  };

  const handleRewind = () => {
      audioService.setTime(0);
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(0px)`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExplorer) return;
    const rect = timelineContainerRef.current?.getBoundingClientRect();
    if (rect) {
        const x = e.clientX - rect.left;
        const pixelsPerSecond = 40;
        const newTime = Math.max(0, x / pixelsPerSecond);
        audioService.setTime(newTime);
        if (playheadRef.current) playheadRef.current.style.transform = `translateX(${x}px)`;
    }
  };

  const handleRecordToggle = async () => {
    const armedTrack = tracks.find(t => t.isArmed);
    
    // Auto-create track in Explorer mode if needed
    if (isExplorer && !armedTrack) {
        addTrack('AUDIO', 'Mi Voz');
        setTimeout(() => handleRecordToggle(), 100);
        return;
    }

    if (!armedTrack && !isRecording && !isExplorer) {
        alert("¡Arma una pista (Botón Rojo) para grabar en ella!");
        return;
    }

    if (isRecording) {
      const audioUrl = await audioService.stopRecording();
      setIsRecording(false);
      handleStop(); 
      
      if (audioUrl) {
         const targetId = armedTrack ? armedTrack.id : tracks[tracks.length-1].id;
         await audioService.addTrack(targetId, audioUrl);
         setTracks(prev => prev.map(t => t.id === targetId ? { ...t, audioUrl: audioUrl } : t));
      }
    } else {
        await audioService.startRecording();
        setIsRecording(true);
        if (!isPlaying) { audioService.play(); setIsPlaying(true); }
    }
  };

  const handleImport = async (url: string, name: string) => {
      const newId = Date.now().toString();
      const newTrack: Track = {
          id: newId,
          name: name,
          type: 'AUDIO',
          instrument: 'UNKNOWN',
          color: 'bg-emerald-500',
          volume: 80, pan: 0, eq: {low:0, mid:0, high:0},
          isMuted: false, isSolo: false, isArmed: false,
          audioUrl: url
      };
      await audioService.addTrack(newId, url);
      setTracks([...tracks, newTrack]);
  };

  // Track Logic Handlers
  const updateTrack = (id: string, updates: Partial<Track>) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const handleVolume = (id: string, val: number) => { updateTrack(id, { volume: val }); audioService.setVolume(id, val); };
  const handlePan = (id: string, val: number) => { updateTrack(id, { pan: val }); audioService.setPan(id, val); };
  const handleEQ = (id: string, band: 'low'|'mid'|'high', val: number) => { 
      const track = tracks.find(t => t.id === id);
      if(track) {
          const newEQ = { ...track.eq, [band]: val };
          updateTrack(id, { eq: newEQ });
          audioService.setEQ(id, newEQ.low, newEQ.mid, newEQ.high);
      }
  };
  const handleMute = (id: string) => { const t = tracks.find(tr => tr.id === id); if(t) { updateTrack(id, { isMuted: !t.isMuted }); audioService.toggleMute(id, !t.isMuted); } };
  const handleSolo = (id: string) => { const t = tracks.find(tr => tr.id === id); if(t) { updateTrack(id, { isSolo: !t.isSolo }); audioService.toggleSolo(id, !t.isSolo); } };
  const handleArm = (id: string) => { setTracks(tracks.map(t => ({ ...t, isArmed: t.id === id ? !t.isArmed : false }))); };
  
  const addTrack = (type: 'AUDIO'|'MIDI', name?: string) => {
      const newT: Track = {
          id: Date.now().toString(),
          name: name || (type === 'AUDIO' ? 'Audio Nuevo' : 'Inst. Nuevo'),
          type: type,
          instrument: type === 'AUDIO' ? 'VOCAL' : 'KEYS',
          color: 'bg-gray-500',
          volume: 80, pan: 0, eq: {low:0, mid:0, high:0},
          isMuted: false, isSolo: false, isArmed: false
      };
      setTracks([...tracks, newT]);
  };

  // --- RENDER ---
  const bgMain = isPro ? 'bg-gray-900 text-gray-200' : isExplorer ? 'bg-lego text-gray-800' : 'bg-gray-50 text-gray-700';
  
  // Render Grid Lines logic
  const renderGrid = () => {
    if (isExplorer) return null;
    const lines = [];
    const pixelsPerSecond = 40;
    const secondsPerBar = (60 / bpm) * 4;
    const gap = pixelsPerSecond * secondsPerBar;
    
    for(let i=0; i<50; i++) {
        lines.push(
            <div key={i} className="absolute top-0 bottom-0 w-px border-l border-gray-400/20 pointer-events-none" style={{left: `${i * gap}px`}}></div>
        );
    }
    return <div className="absolute inset-0 z-0">{lines}</div>;
  };

  return (
    <div className={`flex flex-col h-screen ${bgMain} font-nunito select-none overflow-hidden relative`}>
        
        {/* 1. TOP BAR */}
        <div className={`h-14 flex-shrink-0 flex justify-between items-center px-4 z-40 shadow-md ${isPro ? 'bg-gray-800 border-b border-black' : 'bg-white border-b border-gray-200'}`}>
            <div className="flex items-center space-x-3">
                <button onClick={onExit} className={`p-2 rounded hover:bg-black/10`}><Home size={20}/></button>
                <div className="h-6 w-px bg-gray-400/30 mx-1"></div>
                {!isExplorer && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => {}} className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-700"><Save size={14}/> <span className="hidden sm:inline">Guardar</span></button>
                    </div>
                )}
            </div>

            {/* Metronome Center */}
            {!isExplorer && (
                <div className={`flex items-center space-x-4 px-4 py-1 rounded-full ${isPro ? 'bg-black/40 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                    <div className="flex flex-col items-center cursor-pointer hover:text-blue-500 relative w-12 group">
                        <span className="text-lg font-mono font-bold leading-none">{bpm}</span>
                        <span className="text-[8px] font-bold text-gray-500">BPM</span>
                        <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="absolute inset-0 opacity-0 cursor-ns-resize"/>
                    </div>
                    <button 
                        onClick={() => {
                            const newState = !metronome.enabled;
                            setMetronome(m => ({...m, enabled: newState}));
                            audioService.toggleMetronome(newState);
                        }}
                        className={`p-1.5 rounded-full transition-colors ${metronome.enabled ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Clock size={16} />
                    </button>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <button onClick={() => setShowBrowser(!showBrowser)} className={`p-2 rounded-lg transition-colors ${showBrowser ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`} title="Abrir Librería">
                    <Grid size={20}/>
                </button>
                <button onClick={() => setShowAI(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-xs shadow-md hover:scale-105 transition-transform"><Sparkles size={14}/><span>IA</span></button>
            </div>
        </div>

        {/* 2. MAIN WORKSPACE */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Inspector (Visible for Pro AND Maker if selected) */}
            {!isExplorer && showInspector && selectedTrackId && (
                <Inspector 
                    track={tracks.find(t => t.id === selectedTrackId)} 
                    mode={userMode}
                    onUpdate={updateTrack}
                    onClose={() => setSelectedTrackId(null)}
                />
            )}

            {/* Middle: Timeline & Tracks */}
            <div className="flex-1 flex flex-col relative min-w-0 bg-opacity-50">
                
                {/* Timeline Header - Clickable for seeking */}
                <div onMouseDown={handleSeek} className="cursor-pointer">
                    <TimelineRuler mode={userMode} bpm={bpm} zoom={1} />
                </div>

                {/* Scrollable Tracks Area */}
                <div 
                    ref={timelineContainerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-2 relative pb-32 scroll-smooth cursor-crosshair"
                    onMouseDown={(e) => {
                         // Only seek if clicking on background, not on a track block
                         if(e.target === timelineContainerRef.current || e.target === e.currentTarget) handleSeek(e);
                    }}
                >
                     {renderGrid()}

                     {/* PLAYHEAD CURSOR */}
                     {!isExplorer && (
                        <div 
                            ref={playheadRef}
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none will-change-transform shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                            style={{ left: '0px' }} 
                        >
                            <div className="w-4 h-4 -ml-2 bg-red-500 transform rotate-45 -mt-2 shadow-sm border border-white"></div>
                        </div>
                     )}

                     <div className="space-y-1 z-10 relative">
                        {tracks.map(track => (
                            <TrackBlock 
                                key={track.id} 
                                track={{...track, isSelected: track.id === selectedTrackId}} 
                                mode={userMode}
                                onVolumeChange={handleVolume}
                                onToggleMute={handleMute}
                                onToggleSolo={handleSolo}
                                onToggleArm={handleArm}
                                onDelete={(id) => setTracks(tracks.filter(t => t.id !== id))}
                                onSelect={(id) => { setSelectedTrackId(id); setShowInspector(true); }}
                            />
                        ))}
                        
                        {/* Add Track Area */}
                        <div className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity z-20 relative">
                            <span className="text-sm font-bold text-gray-400 mb-2">Agregar Nueva Pista</span>
                            <div className="flex space-x-4">
                                <button onClick={() => addTrack('AUDIO')} className="bg-gray-200 hover:bg-blue-100 text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors">🎤 Audio / Voz</button>
                                <button onClick={() => addTrack('MIDI')} className="bg-gray-200 hover:bg-yellow-100 text-gray-600 hover:text-yellow-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors">🎹 Instrumento</button>
                            </div>
                        </div>
                     </div>
                </div>

                {/* Bottom Mixer Overlay */}
                {showMixer && !isExplorer && (
                    <div className="absolute bottom-0 left-0 right-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                        <Mixer 
                            tracks={tracks}
                            mode={userMode}
                            onVolumeChange={handleVolume}
                            onPanChange={handlePan}
                            onEQChange={handleEQ}
                            onToggleMute={handleMute}
                            onToggleSolo={handleSolo}
                            onClose={() => setShowMixer(false)}
                        />
                    </div>
                )}
            </div>

            {/* Browser (Right Dock) */}
            {showBrowser && !isExplorer && (
                <Browser 
                    mode={userMode}
                    onImport={handleImport}
                    onClose={() => setShowBrowser(false)}
                />
            )}
        </div>

        {/* 3. FLOATING TRANSPORT "ISLAND" */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-full px-4">
             <div className={`flex items-center space-x-4 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border ${isPro ? 'bg-gray-800/95 border-gray-600 text-gray-200' : 'bg-white/95 border-white text-gray-700'} transition-all hover:scale-[1.02]`}>
                 
                 {/* Left Tools */}
                 <div className="hidden sm:flex items-center space-x-2 border-r border-gray-500/30 pr-4">
                    <button onClick={() => setShowMixer(!showMixer)} className={`p-2 rounded-full ${showMixer ? 'bg-blue-500 text-white' : 'hover:bg-black/10'}`}>
                        <Sliders size={18} />
                    </button>
                 </div>

                 {/* Main Controls */}
                 <div className="flex items-center space-x-2 sm:space-x-4">
                     <button onClick={handleRewind} className="p-2 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-900 transition-colors" title="Ir al inicio">
                        <SkipBack size={20} fill="currentColor"/>
                     </button>

                     <button onClick={handleStop} className="p-3 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors">
                        <Square size={20} fill="currentColor"/>
                     </button>
                     
                     <button 
                        onClick={handlePlayToggle} 
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg ${isPlaying ? 'bg-amber-500' : 'bg-green-500'} hover:brightness-110 active:scale-95 transition-all`}
                     >
                        {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1"/>}
                     </button>

                     <button 
                        onClick={handleRecordToggle} 
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 ${isRecording ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-red-500 border-transparent hover:brightness-110'} active:scale-95 transition-all`}
                     >
                        <Circle fill="currentColor" size={20}/>
                     </button>

                     <button className="p-2 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-900 transition-colors">
                        <SkipForward size={20} fill="currentColor"/>
                     </button>
                 </div>

                 {/* Drag Handle */}
                 <div className="hidden sm:flex items-center pl-4 border-l border-gray-500/30 text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripHorizontal size={20} />
                 </div>
             </div>
        </div>

        {showAI && <CreativeAssistant onClose={() => setShowAI(false)} />}
    </div>
  );
};