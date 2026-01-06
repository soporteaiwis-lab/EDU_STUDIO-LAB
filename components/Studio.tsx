import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrackBlock } from './TrackBlock';
import { Mixer } from './Mixer';
import { Inspector } from './Inspector';
import { Browser } from './Browser';
import { SongbookPanel } from './SongbookPanel';
import { TimelineRuler } from './TimelineRuler';
import { CreativeEditor } from './CreativeEditor';
import { PianoPanel } from './PianoPanel';
import { PianoRollEditor } from './PianoRollEditor';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { getProducerAdvice, ProducerAdvice } from '../services/geminiService';
import { Track, UserMode, SongMetadata, MidiNote, AudioDevice, LoopRegion } from '../types';
import { Play, Square, Sparkles, Home, SkipBack, Circle, PanelBottom, BookOpen, Pause, Grid, Save, SkipForward, FastForward, Rewind, Plus, Settings, Zap, Music, FileAudio, Keyboard as KeyboardIcon, ChevronLeft, ChevronRight, Mic, MoreVertical, Volume2, Magnet, ZoomIn, ZoomOut, Repeat, ChevronDown, Library, Layers, Box, Maximize, Bot, Baby, Hammer, Zap as ZapIcon, Check } from 'lucide-react';

interface StudioProps {
  userMode: UserMode;
  onModeChange: (mode: UserMode) => void;
  onExit: () => void;
}

const INITIAL_TRACKS: Track[] = [
  { 
    id: '1', name: 'Batería Demo', type: 'DRUMS', instrument: 'DRUMS', color: 'bg-rose-600', 
    volume: 80, pan: 0, eq: { low: 0, mid: 0, high: 0 }, 
    effects: { reverb: 0, pitch: 0, distortion: 0 },
    isMuted: false, isSolo: false, isArmed: false 
  },
];

const INITIAL_METADATA: SongMetadata = {
    title: 'Nueva Canción',
    author: 'Usuario AIWIS',
    key: 'C',
    bpm: 120,
    timeSignature: [4, 4],
    lyrics: ''
};

const HEADER_WIDTH = 320; 

export const Studio: React.FC<StudioProps> = ({ userMode, onModeChange, onExit }) => {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [metadata, setMetadata] = useState<SongMetadata>(INITIAL_METADATA);
  
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('Mi Proyecto');
  const [sessionId, setSessionId] = useState(Date.now().toString());
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(false);
  
  // STUDIO SETTINGS STATE
  const [zoom, setZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [loopRegion, setLoopRegion] = useState<LoopRegion>({ startBar: 1, endBar: 5, isActive: true });
  const [totalBars, setTotalBars] = useState(32); // Default to 32 bars

  // Metronome Settings State
  const [showMetronomeSettings, setShowMetronomeSettings] = useState(false);
  const [showTimeSigSelector, setShowTimeSigSelector] = useState(false); 
  const [metronomeVolume, setMetronomeVolume] = useState(-10);
  const [countIn, setCountIn] = useState<'OFF' | '1BAR' | '2BAR'>('OFF');
  const [tapTempoTaps, setTapTempoTaps] = useState<number[]>([]);

  // AI PRODUCER STATE
  const [producerAdvice, setProducerAdvice] = useState<ProducerAdvice | null>(null);
  const [showProducer, setShowProducer] = useState(false);

  const recordingTrackIdRef = useRef<string | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null); // Unified Scroll Ref
  const animationRef = useRef<number>(0);
  const metronomeRef = useRef<HTMLDivElement>(null);

  const [showMixer, setShowMixer] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showBrowser, setShowBrowser] = useState(true); 
  const [showSongbook, setShowSongbook] = useState(false);
  const [showCreative, setShowCreative] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [editingMidiTrackId, setEditingMidiTrackId] = useState<string | null>(null);
  const [importModal, setImportModal] = useState(false); 
  const [pendingImport, setPendingImport] = useState<{url: string, name: string} | null>(null); 
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);

  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  
  const isPro = userMode === UserMode.PRO;
  const isExplorer = userMode === UserMode.EXPLORER;

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);
  const editingTrack = tracks.find(t => t.id === editingMidiTrackId);
  const showPianoPanel = (selectedTrack?.type === 'MIDI' || selectedTrack?.type === 'CHORD' || selectedTrack?.type === 'MELODY') && !editingMidiTrackId;

  const currentHeaderWidth = isExplorer ? 320 : 260;

  // --- AI PRODUCER CHECK ---
  useEffect(() => {
      if (tracks.length > 0) {
         const timeout = setTimeout(async () => {
             const advice = await getProducerAdvice(tracks, bpm);
             setProducerAdvice(advice);
             setShowProducer(true);
             setTimeout(() => setShowProducer(false), 8000); 
         }, 5000);
         return () => clearTimeout(timeout);
      }
  }, [tracks.length]);

  // --- AUDIO INIT ---
  useEffect(() => {
    tracks.forEach(t => { 
        if(t.type === 'AUDIO' && t.audioUrl) audioService.addTrack(t.id, t.audioUrl, 'AUDIO');
        if(t.type === 'SAMPLER' && t.samplerUrl) audioService.addTrack(t.id, t.samplerUrl, 'SAMPLER');
        if(t.type === 'CHORD' || t.type === 'MIDI' || t.type === 'MELODY') audioService.addTrack(t.id, '', 'INSTRUMENT');
        if(t.type === 'RHYTHM' || t.type === 'DRUMS') audioService.addTrack(t.id, '', 'DRUMS');
    });

    audioService.onMidiNoteRecorded = (trackId, note) => {
        setTracks(prev => prev.map(t => {
            if (t.id === trackId) {
                const existingNotes = t.midiNotes || [];
                return { ...t, midiNotes: [...existingNotes, note] };
            }
            return t;
        }));
    };
    
    const handleClickOutside = (event: MouseEvent) => {
        if (metronomeRef.current && !metronomeRef.current.contains(event.target as Node)) {
            setShowMetronomeSettings(false);
            setShowTimeSigSelector(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => { 
        audioService.stop(); 
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  useEffect(() => { audioService.setBpm(bpm); setMetadata(prev => ({...prev, bpm})); }, [bpm]);
  useEffect(() => { audioService.toggleMetronome(metronomeOn); }, [metronomeOn]);
  useEffect(() => { audioService.setMetronomeVolume(metronomeVolume); }, [metronomeVolume]);
  
  useEffect(() => {
      const [num, den] = timeSignature.split('/').map(Number);
      audioService.setTimeSignature(num, den);
      setMetadata(prev => ({...prev, timeSignature: [num, den]}));
  }, [timeSignature]);

  useEffect(() => {
      const armed = tracks.find(t => t.isArmed && t.type === 'MIDI');
      if (armed) audioService.setActiveMidiTrack(armed.id);
      else if (selectedTrack && selectedTrack.type === 'MIDI') audioService.setActiveMidiTrack(selectedTrack.id);
      else audioService.setActiveMidiTrack(null);
  }, [tracks, selectedTrackId]);

  useEffect(() => {
    const animate = () => {
      if (playheadRef.current) {
        const time = audioService.getCurrentTime();
        const pixelsPerSecond = 40 * zoom; 
        playheadRef.current.style.transform = `translateX(${time * pixelsPerSecond}px)`;
        
        // Auto-scroll if playing and out of view could be implemented here
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if(animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [zoom]); 

  const handleTapTempo = () => {
      const now = Date.now();
      const newTaps = [...tapTempoTaps, now].filter(t => now - t < 3000); 
      if (newTaps.length > 1) {
          const intervals = [];
          for(let i = 1; i < newTaps.length; i++) {
              intervals.push(newTaps[i] - newTaps[i-1]);
          }
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const newBpm = Math.round(60000 / avgInterval);
          if (newBpm >= 40 && newBpm <= 240) {
              setBpm(newBpm);
          }
      }
      setTapTempoTaps(newTaps);
  };

  const handleFitToScreen = () => {
      if (!timelineScrollRef.current) return;
      const availableWidth = timelineScrollRef.current.clientWidth - currentHeaderWidth;
      const secondsPerBar = (60 / bpm) * 4;
      const totalSeconds = totalBars * secondsPerBar;
      const newZoom = availableWidth / (totalSeconds * 40);
      setZoom(Math.max(0.1, Math.min(3, newZoom)));
  };

  const handleSettingsOpen = async () => {
      const devices = await audioService.getAudioInputDevices();
      setAudioDevices(devices);
      setShowSettings(true);
  };

  const handleDeviceSelect = (deviceId: string) => {
      audioService.setAudioInputDevice(deviceId);
      setShowSettings(false);
  };

  const handleUpdateMidiNotes = (trackId: string, notes: MidiNote[]) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, midiNotes: notes } : t));
      audioService.scheduleMidi(trackId, notes);
  };

  const handlePlayToggle = async () => {
    await audioService.initialize();
    if (isPlaying) { 
        audioService.pause(); 
    } else { 
        tracks.forEach(t => {
            if (t.type === 'MIDI' || t.type === 'CHORD' || t.type === 'MELODY') {
                if (t.midiNotes) audioService.scheduleMidi(t.id, t.midiNotes);
            }
            if ((t.type === 'RHYTHM' || t.type === 'DRUMS') && t.rhythmData) {
                audioService.scheduleDrums(t.id, t.rhythmData);
            }
        });
        audioService.play(); 
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => { audioService.stop(); setIsPlaying(false); setIsRecording(false); audioService.setMidiRecordingState(false); };
  const handleSeekStart = () => audioService.seekToStart();
  const handleRewind = () => audioService.rewind(10);
  const handleForward = () => { const t = audioService.getCurrentTime(); audioService.setTime(t + 10); };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    // Seek logic now applies inside the scroll container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pixelsPerSecond = 40 * zoom;
    let time = x / pixelsPerSecond;
    if (snapEnabled) {
        const beatDuration = 60 / bpm;
        const snap = beatDuration; // Snap to beat
        time = Math.round(time / snap) * snap;
    }
    audioService.setTime(Math.max(0, time));
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      if (recordingTrackIdRef.current) {
         const t = tracks.find(tr => tr.id === recordingTrackIdRef.current);
         if (t && t.type === 'AUDIO') {
             const audioUrl = await audioService.stopRecording();
             if (audioUrl) {
                await audioService.addTrack(t.id, audioUrl, 'AUDIO');
                setTracks(prev => prev.map(tr => tr.id === t.id ? { ...tr, audioUrl: audioUrl, isArmed: false } : tr));
             }
         }
      }
      setIsRecording(false);
      audioService.setMidiRecordingState(false);
      handleStop(); 
      return;
    }
    const target = tracks.find(t => t.isArmed);
    if (!target) { alert("¡Primero arma una pista! (Presiona el botón 'Armar' o 'R' en la pista)"); return; }

    try { 
        if (target.type === 'AUDIO') {
            if (!(await audioService.checkPermissions())) { alert("Permiso de micrófono denegado."); return; }
            await audioService.startRecording(); 
        } else if (target.type === 'MIDI' || target.type === 'CHORD' || target.type === 'MELODY') {
            audioService.setMidiRecordingState(true);
            audioService.setActiveMidiTrack(target.id);
        }
        recordingTrackIdRef.current = target.id; 
        setIsRecording(true); 
        if(!isPlaying) audioService.play(); 
    } catch(e) { console.error(e); }
  };

  const addTrack = (type: 'AUDIO'|'MIDI'|'SAMPLER') => {
      const id = Date.now().toString();
      const newT: Track = { 
          id, 
          name: type==='AUDIO'?'Audio Nuevo': type==='SAMPLER'?'Sampler FX':'Inst. Nuevo', 
          type: type, 
          instrument: type==='AUDIO'?'VOCAL': type==='SAMPLER'?'SAMPLER':'KEYS', 
          midiInstrument: 'GRAND_PIANO',
          color: 'bg-rose-600', 
          volume: 80, pan: 0, eq:{low:0,mid:0,high:0}, effects:{reverb:0,pitch:0,distortion:0}, 
          isMuted:false, isSolo:false, isArmed:false 
      };
      setTracks(prev => [...prev, newT]);
      setSelectedTrackId(id);
      
      if(type==='MIDI') audioService.addTrack(id, '', 'INSTRUMENT');
      else if (type==='SAMPLER') audioService.addTrack(id, '', 'SAMPLER');
      else audioService.addTrack(id, '', 'AUDIO');
      setImportModal(false);
  };
  
  const confirmImport = (trackType: 'AUDIO' | 'SAMPLER' | 'MIDI') => {
      if (!pendingImport) return;
      const id = Date.now().toString();
      const { url, name } = pendingImport;
      const newT: Track = { 
          id, name, type: trackType === 'MIDI' ? 'MIDI' : trackType, 
          instrument: trackType==='SAMPLER'?'SAMPLER': trackType === 'MIDI' ? 'KEYS' : 'VOCAL', 
          color: 'bg-emerald-600', 
          volume: 80, pan: 0, eq:{low:0,mid:0,high:0}, effects:{reverb:0,pitch:0,distortion:0}, 
          isMuted:false, isSolo:false, isArmed:false, 
          audioUrl: trackType==='AUDIO'?url:undefined, samplerUrl: trackType==='SAMPLER'?url:undefined
      };
      setTracks(prev => [...prev, newT]);
      setSelectedTrackId(id);

      const engineType = trackType === 'MIDI' ? 'INSTRUMENT' : trackType;
      audioService.addTrack(id, url, engineType as any);
      setPendingImport(null);
  }

  const gridLines = useMemo(() => {
    const lines = [];
    const pixelsPerBar = (60 / bpm) * 4 * (40 * zoom);
    // Grid line color depending on mode for better contrast
    const lineColor = isExplorer ? 'border-gray-800/10' : 'border-white/5';

    for(let i=0; i<totalBars; i++) {
        lines.push(
            <div key={`bar-${i}`} className={`absolute top-0 bottom-0 w-px border-l ${lineColor} pointer-events-none`} style={{left: `${i * pixelsPerBar}px`}}></div>
        );
        if(zoom > 0.8) {
             for(let j=1; j<4; j++) {
                 lines.push(<div key={`beat-${i}-${j}`} className={`absolute top-0 bottom-0 w-px border-l ${lineColor} border-dotted pointer-events-none`} style={{left: `${i * pixelsPerBar + (j * (pixelsPerBar/4))}px`}}></div>);
             }
        }
    }
    // END MARKER
    lines.push(
        <div key="end-marker" className="absolute top-0 bottom-0 w-1 bg-red-500/50 z-20 pointer-events-none flex items-end pb-2 pl-1" style={{left: `${totalBars * pixelsPerBar}px`}}>
            <span className="text-[10px] text-red-400 font-bold -rotate-90 origin-bottom-left whitespace-nowrap">FIN CANCIÓN</span>
        </div>
    );
    return lines;
  }, [bpm, zoom, totalBars, isExplorer]);

  // Track Width based on total bars
  const trackContentWidth = totalBars * (60 / bpm) * 4 * (40 * zoom);

  const applyProducerAdvice = () => {
      if(!producerAdvice?.actionType) return;
      if(producerAdvice.actionType === 'ADD_DRUMS') setShowCreative(true); 
      setShowProducer(false);
  }

  // --- MODE SWITCHER COMPONENT ---
  const ModeSwitcher = () => (
      <div className="flex items-center space-x-1 bg-black/40 rounded-lg p-1 border border-white/10 mx-4">
          <button 
            onClick={() => onModeChange(UserMode.EXPLORER)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${userMode === UserMode.EXPLORER ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="Modo Explorador (Básico)"
          >
             <Baby size={14}/>
             <span className="text-xs font-bold hidden xl:inline">Explorador</span>
          </button>
          <button 
            onClick={() => onModeChange(UserMode.MAKER)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${userMode === UserMode.MAKER ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="Modo Creador (Intermedio)"
          >
             <Hammer size={14}/>
             <span className="text-xs font-bold hidden xl:inline">Creador</span>
          </button>
          <button 
            onClick={() => onModeChange(UserMode.PRO)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${userMode === UserMode.PRO ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="Modo Pro (Avanzado)"
          >
             <ZapIcon size={14}/>
             <span className="text-xs font-bold hidden xl:inline">Pro</span>
          </button>
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] font-nunito select-none overflow-hidden text-gray-200 relative">
        
        {/* TOP BAR / TRANSPORT */}
        <div className="h-16 flex-shrink-0 bg-[#0f0f13] border-b border-white/5 flex items-center px-4 justify-between z-50 shadow-md">
             
             {/* Left: LOGO & EXIT & MODE SWITCHER */}
             <div className="flex items-center">
                 <button onClick={onExit} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors mr-2"><Home size={20}/></button>
                 
                 <div className="flex items-center gap-3 select-none mr-4">
                     <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <Box size={18} className="text-white"/>
                     </div>
                     <div className="flex flex-col leading-none hidden md:flex">
                         <span className="font-brand font-black text-lg tracking-tight text-white">EDU<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">STUDIO</span></span>
                         <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase">Creative Lab</span>
                     </div>
                 </div>

                 <div className="w-px h-8 bg-white/5 mx-2 hidden md:block"></div>
                 
                 <ModeSwitcher />

                 <div className="w-px h-8 bg-white/5 mx-2 hidden md:block"></div>

                 {/* TRANSPORT CONTROLS */}
                 <div className="flex items-center bg-black/40 rounded-full p-1.5 border border-white/5 shadow-inner ml-2">
                     <button onClick={handleSeekStart} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Ir al Inicio"><SkipBack size={16}/></button>
                     <button onClick={handleRewind} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Retroceder 10s"><Rewind size={16}/></button>
                     <button onClick={handleStop} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/10 rounded-full transition" title="Detener"><Square size={16}/></button>
                     
                     <button onClick={handlePlayToggle} className="mx-2 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-white hover:scale-105 transition shadow-lg shadow-cyan-900/30 active:scale-95">
                        {isPlaying ? <Pause size={20} fill="white"/> : <Play size={20} fill="white"/>}
                     </button>
                     
                     <button onClick={handleRecordToggle} className={`mr-2 p-3 rounded-full transition shadow-lg border ${isRecording ? 'bg-red-600 border-red-500 animate-pulse shadow-red-900/50' : 'bg-black/20 border-white/5 hover:bg-white/10 text-red-500'}`} title="Grabar">
                        <Circle size={20} fill={isRecording ? "white" : "currentColor"} className={isRecording ? "text-white" : "text-red-500"}/>
                     </button>
                     
                     <button onClick={handleForward} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Avanzar 10s"><FastForward size={16}/></button>
                     <button onClick={() => { const t = audioService.getCurrentTime(); audioService.setTime(t + 30); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Adelantar"><SkipForward size={16}/></button>
                 </div>
             </div>

             {/* Center Display (LCD) */}
             <div className="relative mx-4 flex-1 max-w-[400px] hidden lg:block" ref={metronomeRef}>
                 <div className="bg-[#050505] rounded-xl border border-white/10 p-1 flex items-center justify-between shadow-inner h-14 px-6 relative">
                     
                     {/* BPM CONTROL */}
                     <div className="flex flex-col items-center border-r border-white/5 pr-6 cursor-pointer hover:bg-white/5 h-full justify-center transition rounded-l-lg" onClick={() => setShowMetronomeSettings(!showMetronomeSettings)}>
                         <span className="text-[9px] font-bold text-gray-500 tracking-wider">BPM</span>
                         <span className="text-xl font-mono font-bold text-cyan-400 leading-none">{bpm}</span>
                     </div>
                     
                     {/* TIME SIGNATURE CONTROL (NEW) */}
                     <div className="flex flex-col items-center border-r border-white/5 px-6 h-full justify-center cursor-pointer hover:bg-white/5 transition" onClick={() => setShowTimeSigSelector(!showTimeSigSelector)}>
                          <span className="text-[9px] font-bold text-gray-500">COMPÁS</span>
                          <span className="text-lg font-mono font-bold text-gray-300 leading-none flex items-center">{timeSignature} <ChevronDown size={10} className="ml-1 opacity-50"/></span>
                     </div>

                     <div className="flex flex-col items-center px-6 h-full justify-center">
                          <span className="text-[9px] font-bold text-gray-500">TIEMPO</span>
                          <span className="text-lg font-mono font-bold text-gray-300 leading-none">
                              {Math.floor(audioService.getCurrentTime()).toString().padStart(2, '0')}:
                              {(Math.floor(audioService.getCurrentTime() * 100) % 100).toString().padStart(2, '0')}
                          </span>
                     </div>
                     <button onClick={() => setMetronomeOn(!metronomeOn)} className={`absolute right-2 p-1.5 rounded-lg transition-all ${metronomeOn ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-600 hover:text-gray-400'}`}>
                        <Settings size={16} className={metronomeOn ? "animate-spin-slow" : ""}/>
                     </button>
                 </div>
                 
                 {/* METRONOME DROPDOWN */}
                 {showMetronomeSettings && (
                     <div className="absolute top-16 left-0 right-0 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-4 z-[100] animate-slide-up flex flex-col space-y-3 glass-panel">
                         <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                             <div><div className="text-xs font-bold text-gray-400">Tempo</div><div className="text-[9px] text-gray-600">TAP PARA AJUSTAR</div></div>
                             <button onClick={handleTapTempo} className="bg-[#222] text-cyan-400 border border-gray-600 rounded w-12 h-8 font-mono font-bold">{bpm}</button>
                         </div>
                         <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold text-gray-500"><span>Volumen Click</span><span>{metronomeVolume} dB</span></div>
                             <input type="range" min="-40" max="0" value={metronomeVolume} onChange={(e) => setMetronomeVolume(parseInt(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyan-500"/>
                         </div>
                         <div className="pt-2 border-t border-white/5">
                             <div className="text-[10px] font-bold text-gray-500 mb-1">Compases Totales</div>
                             <input type="number" min="8" max="200" value={totalBars} onChange={(e) => setTotalBars(parseInt(e.target.value))} className="w-full bg-black/40 text-white p-2 text-xs rounded border border-white/10"/>
                         </div>
                     </div>
                 )}

                 {/* TIME SIGNATURE DROPDOWN */}
                 {showTimeSigSelector && (
                     <div className="absolute top-16 left-24 w-32 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-2 z-[100] animate-slide-up glass-panel">
                        <div className="text-[9px] font-bold text-gray-500 uppercase mb-2 px-2">Métrica</div>
                        {['4/4', '3/4', '2/4', '6/8', '12/8', '5/4'].map(sig => (
                            <button 
                                key={sig}
                                onClick={() => { setTimeSignature(sig); setShowTimeSigSelector(false); }}
                                className={`w-full text-left p-2 rounded text-xs font-bold flex justify-between items-center ${timeSignature === sig ? 'bg-cyan-900/30 text-cyan-400' : 'text-gray-300 hover:bg-white/5'}`}
                            >
                                {sig}
                                {timeSignature === sig && <Check size={12}/>}
                            </button>
                        ))}
                     </div>
                 )}
             </div>

             {/* Right Controls */}
             <div className="flex items-center space-x-2 border-l border-white/5 pl-4">
                 
                 <button onClick={() => setSnapEnabled(!snapEnabled)} className={`p-2 rounded-lg transition-colors ${snapEnabled ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-500 hover:text-gray-300'}`} title="Snap Grid"><Magnet size={18}/></button>
                 <button onClick={() => setLoopRegion({...loopRegion, isActive: !loopRegion.isActive})} className={`p-2 rounded-lg transition-colors ${loopRegion.isActive ? 'text-green-400 bg-green-900/20' : 'text-gray-500 hover:text-gray-300'}`} title="Bucle"><Repeat size={18}/></button>

                 {/* ZOOM CONTROLS WITH FIT BUTTON */}
                 <div className="flex items-center bg-white/5 rounded-lg p-1 mx-2">
                     <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1.5 text-gray-400 hover:text-white rounded"><ZoomOut size={14}/></button>
                     <button onClick={handleFitToScreen} className="px-2 py-1 text-cyan-400 hover:text-white font-bold text-[10px] text-center rounded hover:bg-white/10 transition-colors" title="Ajustar a Pantalla">FIT</button>
                     <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-1.5 text-gray-400 hover:text-white rounded"><ZoomIn size={14}/></button>
                 </div>

                 <button onClick={() => setShowBrowser(!showBrowser)} className={`p-2 rounded-lg flex items-center space-x-2 transition-all ${showBrowser ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                     <Library size={16}/>
                     <span className="text-xs font-bold hidden md:inline">Librería</span>
                 </button>

                 <button onClick={() => setShowCreative(true)} className="p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-xs font-bold flex items-center hover:brightness-110 shadow-lg shadow-fuchsia-900/40 transition-all">
                    <Sparkles size={16} className="mr-1"/> AI
                 </button>
             </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex overflow-hidden bg-transparent relative w-full">
            {!isExplorer && showInspector && selectedTrackId && (
                <Inspector track={tracks.find(t => t.id === selectedTrackId)} mode={userMode} onUpdate={(id, up) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...up } : t))} onClose={() => setSelectedTrackId(null)} />
            )}
            
            <div className={`flex-1 flex flex-col min-w-0 relative h-full ${isExplorer ? 'bg-gray-200' : 'bg-[#080808]'}`}>
                {/* UNIFIED SCROLL CONTAINER FOR RULER AND TRACKS */}
                <div ref={timelineScrollRef} className={`flex-1 overflow-auto relative scroll-smooth custom-scrollbar ${isExplorer ? '' : "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"}`}>
                     
                     {/* Sticky Header Layout Wrapper */}
                     <div className="min-w-fit flex flex-col">
                         {/* Ruler is sticky to top of this container */}
                         <div className={`sticky top-0 z-30 ${isExplorer ? 'bg-gray-200' : 'bg-[#080808]'}`} style={{ paddingLeft: `${currentHeaderWidth}px` }}>
                            <TimelineRuler mode={userMode} bpm={bpm} zoom={zoom} loopRegion={loopRegion} onLoopChange={setLoopRegion} totalBars={totalBars} />
                         </div>

                         {/* Tracks Container */}
                         <div className="relative pb-32">
                             
                             {/* Container inner for alignment */}
                             <div className="relative" style={{ width: `${currentHeaderWidth + trackContentWidth}px`, minWidth: '100%' }}>
                                 {/* Grid Lines */}
                                 <div className="absolute top-0 bottom-0 pointer-events-none z-0" style={{ left: `${currentHeaderWidth}px`, right: 0 }}>
                                     {gridLines}
                                 </div>
                                 
                                 {/* Playhead */}
                                 <div ref={playheadRef} className="absolute top-0 bottom-0 w-[1px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-40 pointer-events-none transition-transform duration-75 will-change-transform" style={{ left: `${currentHeaderWidth}px` }}>
                                     <div className="w-5 h-5 -ml-[9px] bg-cyan-400 transform rotate-45 -mt-2.5 shadow-md flex items-center justify-center border border-white">
                                         <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                     </div>
                                 </div>

                                 {/* Loop Region Overlay */}
                                 {loopRegion.isActive && (
                                     <div className="absolute top-0 bottom-0 bg-green-500/5 pointer-events-none border-x border-green-500/30 z-0" style={{ left: currentHeaderWidth + (loopRegion.startBar * (60/bpm) * 4 * 40 * zoom), width: (loopRegion.endBar - loopRegion.startBar) * (60/bpm) * 4 * 40 * zoom }}></div>
                                 )}

                                 {/* Tracks List */}
                                 <div className="relative z-10 pt-4 px-4 space-y-3">
                                    {tracks.map(track => (
                                        <TrackBlock key={track.id} track={{...track, isSelected: track.id === selectedTrackId}} mode={userMode} bpm={bpm} zoom={zoom} totalWidth={trackContentWidth}
                                            onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} 
                                            onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}} 
                                            onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} 
                                            onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} 
                                            onToggleArm={(id) => setTracks(prev => prev.map(t => ({...t, isArmed: t.id === id ? !t.isArmed : false})))} 
                                            onDelete={(id) => { audioService.removeTrack(id); setTracks(prev => prev.filter(t => t.id !== id)); }} 
                                            onSelect={(id) => { setSelectedTrackId(id); setShowInspector(true); }} 
                                            onEditMidi={(id) => setEditingMidiTrackId(id)}
                                        />
                                    ))}
                                 </div>

                                 {/* Add Track Area */}
                                 <div className="mt-8 p-4 flex justify-center w-fit" style={{ marginLeft: currentHeaderWidth }}>
                                     <button onClick={() => setImportModal(true)} className="bg-white/5 text-gray-400 px-8 py-3 rounded-full text-sm font-bold flex items-center hover:bg-white/10 hover:text-white border border-dashed border-white/10 hover:border-white/30 transition-all"><Plus size={16} className="mr-2"/> Nueva Pista</button>
                                </div>
                                
                                {/* Clickable Seek Area Overlay (transparent) */}
                                <div 
                                    className="absolute inset-0 z-0 cursor-crosshair" 
                                    style={{ left: `${currentHeaderWidth}px` }}
                                    onClick={handleSeek}
                                ></div>
                             </div>
                         </div>
                     </div>
                </div>
                
                {showMixer && !isExplorer && <div className="h-64 flex-shrink-0 z-50 relative animate-slide-up border-t border-black bg-[#121212]"><Mixer tracks={tracks} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}} onEQChange={(id, b, v) => {const t=tracks.find(x=>x.id===id); if(t){const n={...t.eq, [b]:v}; setTracks(prev=>prev.map(x=>x.id===id?{...x, eq:n}:x)); audioService.setEQ(id, n.low, n.mid, n.high);}}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onClose={() => setShowMixer(false)} /></div>}
                
                {showPianoPanel && <PianoPanel currentInstrument={selectedTrack.midiInstrument} onClose={() => setSelectedTrackId(null)} />}

                {editingMidiTrackId && editingTrack && (
                    <PianoRollEditor trackId={editingTrack.id} trackName={editingTrack.name} notes={editingTrack.midiNotes || []} instrument={editingTrack.midiInstrument || 'GRAND_PIANO'} onUpdateNotes={handleUpdateMidiNotes} onClose={() => setEditingMidiTrackId(null)} />
                )}
            </div>
            {showBrowser && <Browser mode={userMode} onImport={(u,n,t)=>setPendingImport({url:u,name:n})} onLoadSession={(s)=>{handleStop();setSessionId(s.id);setSessionName(s.name);setBpm(s.bpm);setTracks(s.tracks);if(s.metadata)setMetadata(s.metadata);setShowBrowser(false);}} onClose={() => setShowBrowser(false)} />}
            {showSongbook && <SongbookPanel mode={userMode} metadata={metadata} onUpdateLyrics={(text) => setMetadata(prev=>({...prev, lyrics: text}))} onClose={() => setShowSongbook(false)} />}
        </div>
        
        {/* AI PRODUCER BUBBLE (FUN & INTERACTIVE) */}
        {showProducer && producerAdvice && (
            <div className="fixed bottom-24 right-8 z-[100] animate-bounce-in max-w-sm">
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-[1px] rounded-2xl shadow-2xl">
                    <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 relative border border-white/10">
                         {/* Close X */}
                         <button onClick={() => setShowProducer(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><Bot size={14}/></button>
                         <div className="flex items-start space-x-3">
                             <div className="bg-violet-500/20 p-2 rounded-full border border-violet-500/30">
                                 <Bot size={24} className="text-violet-300"/>
                             </div>
                             <div>
                                 <h4 className="font-bold text-violet-300 text-sm mb-1">AI Producer dice:</h4>
                                 <p className="text-gray-300 text-sm leading-tight">{producerAdvice.message}</p>
                                 {producerAdvice.actionType !== 'NONE' && (
                                     <button onClick={applyProducerAdvice} className="mt-3 text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold py-1.5 px-3 rounded-full transition-colors flex items-center shadow-lg shadow-violet-900/50">
                                         <Sparkles size={10} className="mr-1"/> {producerAdvice.actionLabel || 'Hacer magia'}
                                     </button>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
                {/* Speech Bubble Tail */}
                <div className="w-4 h-4 bg-black border-r border-b border-violet-600/50 rotate-45 transform translate-x-8 -translate-y-2.5 z-0"></div>
            </div>
        )}

        {/* MODALS */}
        {showSettings && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                <div className="bg-[#121212] border border-white/10 p-6 rounded-2xl w-96 text-gray-200 shadow-2xl animate-slide-up">
                    <h3 className="text-xl font-bold mb-4 flex items-center text-white"><Settings className="mr-2 text-cyan-500"/> Configuración de Audio</h3>
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Entrada de Audio (Mic)</label>
                        <div className="space-y-2">
                            {audioDevices.length > 0 ? audioDevices.map(d => (
                                <button key={d.deviceId} onClick={() => handleDeviceSelect(d.deviceId)} className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg flex items-center transition-colors border border-transparent hover:border-white/10">
                                    <Mic size={14} className="mr-2 text-green-500"/> <span className="text-sm truncate">{d.label}</span>
                                </button>
                            )) : <div className="text-sm text-red-400 p-2 bg-red-900/20 rounded border border-red-900/50">No se detectaron dispositivos.</div>}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setShowSettings(false)} className="px-5 py-2 bg-white/10 rounded-full hover:bg-white/20 font-bold text-sm text-white transition-colors">Cerrar</button>
                    </div>
                </div>
            </div>
        )}
        {showCreative && <CreativeEditor onClose={() => setShowCreative(false)} onImportLyrics={(t)=>setMetadata(p=>({...p,lyrics:t}))} 
            onImportChords={(d)=>{
                const id=Date.now().toString();
                // CONVERT AI CHORDS TO MIDI NOTES
                const notes = audioService.convertChordsToMidi(d.progression);
                setTracks(p=>[...p,{id,name:`Acordes ${d.key}`,type:'CHORD',instrument:'CHORD',color:'bg-blue-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,chordData:d.progression, midiNotes: notes}]);
                audioService.addTrack(id,'','INSTRUMENT');
            }} 
            onImportRhythm={(d)=>{
                const id=Date.now().toString();
                setTracks(p=>[...p,{id,name:`Batería ${d.style}`,type:'RHYTHM',instrument:'DRUMS',color:'bg-red-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,rhythmData:d.events}]);
                audioService.addTrack(id,'','DRUMS');
            }} 
            onImportMelody={(d)=>{
                const id=Date.now().toString();
                // CONVERT AI MELODY TO MIDI NOTES
                const notes = audioService.convertMelodyToMidi(d.events);
                setTracks(p=>[...p,{id,name:`Melodía ${d.key}`,type:'MELODY',instrument:'KEYS',color:'bg-yellow-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,melodyData:d.events, midiNotes: notes}]);
                audioService.addTrack(id,'','INSTRUMENT');
            }} 
        />}
        {pendingImport && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"><div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-96 animate-slide-up border border-white/10"><h3 className="text-xl font-bold mb-2 text-white">Importar Archivo</h3><p className="text-sm text-gray-400 mb-4 break-all">"{pendingImport.name}"</p><div className="space-y-3"><button onClick={() => confirmImport('AUDIO')} className="w-full p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl flex items-center font-bold text-blue-300 border border-blue-500/30"><div className="bg-blue-600 text-white p-2 rounded-full mr-3"><FileAudio size={18}/></div><div><div className="text-sm">Pista de Audio</div></div></button><button onClick={() => confirmImport('MIDI')} className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center font-bold text-gray-300 border border-gray-600"><div className="bg-gray-600 text-white p-2 rounded-full mr-3"><Music size={18}/></div><div><div className="text-sm">Pista MIDI</div></div></button></div><button onClick={() => setPendingImport(null)} className="mt-4 text-gray-500 text-xs hover:text-white font-bold block mx-auto uppercase">Cancelar</button></div></div>}
        {importModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"><div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-xl w-96 border border-white/10"><h3 className="text-xl font-bold mb-4 text-white">Crear Nueva Pista</h3><div className="space-y-3"><button onClick={() => addTrack('AUDIO')} className="w-full p-4 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl flex items-center font-bold text-blue-300 border border-blue-500/30"><div className="bg-blue-600 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>Audio / Voz (Mic)</button><button onClick={() => addTrack('MIDI')} className="w-full p-4 bg-orange-900/30 hover:bg-orange-900/50 rounded-xl flex items-center font-bold text-orange-300 border border-orange-500/30"><div className="bg-orange-600 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>Instrumento Virtual (MIDI)</button></div><button onClick={() => setImportModal(false)} className="mt-4 text-gray-500 text-sm hover:text-white font-bold block mx-auto">Cancelar</button></div></div>}
    </div>
  );
};