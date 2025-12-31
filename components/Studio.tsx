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
import { Play, Square, Sparkles, Home, SkipBack, Circle, PanelBottom, BookOpen, Pause, Grid, Save, SkipForward, FastForward, Rewind, Plus, Settings, Zap, Music, FileAudio, Keyboard as KeyboardIcon, ChevronLeft, ChevronRight, Mic, MoreVertical, Volume2, Magnet, ZoomIn, ZoomOut, Repeat, ChevronDown, Library, Layers, Box, Maximize, Bot } from 'lucide-react';

interface StudioProps {
  userMode: UserMode;
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

const HEADER_WIDTH = 260; 

export const Studio: React.FC<StudioProps> = ({ userMode, onExit }) => {
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
  
  // Dynamic Project Length
  const [totalBars, setTotalBars] = useState(32); // Start with 32 bars min

  // Metronome Settings State
  const [showMetronomeSettings, setShowMetronomeSettings] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(-10);
  const [countIn, setCountIn] = useState<'OFF' | '1BAR' | '2BAR'>('OFF');
  const [tapTempoTaps, setTapTempoTaps] = useState<number[]>([]);

  // AI PRODUCER STATE
  const [producerAdvice, setProducerAdvice] = useState<ProducerAdvice | null>(null);
  const [showProducer, setShowProducer] = useState(false);

  const recordingTrackIdRef = useRef<string | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
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

  // --- DYNAMIC TIMELINE CALCULATION ---
  useEffect(() => {
    // Calculate the last bar based on MIDI notes or default audio length
    let maxTime = 0;
    tracks.forEach(t => {
        if (t.midiNotes && t.midiNotes.length > 0) {
            const lastNote = t.midiNotes[t.midiNotes.length - 1];
            if (lastNote.startTime + lastNote.duration > maxTime) {
                maxTime = lastNote.startTime + lastNote.duration;
            }
        }
        // Approximate audio tracks as 30s if loaded, or use loop region
        if (t.type === 'AUDIO' && maxTime < 30) maxTime = 30; 
    });

    const secondsPerBar = (60 / bpm) * 4;
    const calculatedBars = Math.ceil(maxTime / secondsPerBar) + 8; // Add 8 bars padding
    setTotalBars(Math.max(32, calculatedBars)); // Minimum 32 bars
  }, [tracks, bpm]);

  // --- AI PRODUCER CHECK ---
  useEffect(() => {
      // Analyze project every time tracks change significantly (debounce could be added)
      if (tracks.length > 0) {
         const timeout = setTimeout(async () => {
             const advice = await getProducerAdvice(tracks, bpm);
             setProducerAdvice(advice);
             setShowProducer(true);
             setTimeout(() => setShowProducer(false), 8000); // Auto hide after 8s
         }, 5000);
         return () => clearTimeout(timeout);
      }
  }, [tracks.length]); // Analyze when track count changes

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
        playheadRef.current.style.transform = `translateX(${HEADER_WIDTH + (time * pixelsPerSecond)}px)`;
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
      if (!timelineContainerRef.current) return;
      const availableWidth = timelineContainerRef.current.clientWidth - HEADER_WIDTH;
      const secondsPerBar = (60 / bpm) * 4;
      const totalSeconds = totalBars * secondsPerBar;
      // Calculate zoom to fit totalBars into availableWidth
      // width = totalSeconds * 40 * zoom
      // zoom = width / (totalSeconds * 40)
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
            if (t.type === 'CHORD' && t.chordData) audioService.scheduleChords(t.id, t.chordData);
            if ((t.type === 'RHYTHM' || t.type === 'DRUMS') && t.rhythmData) audioService.scheduleDrums(t.id, t.rhythmData);
            if (t.type === 'MELODY' && t.melodyData) audioService.scheduleMelody(t.id, t.melodyData);
            if (t.type === 'MIDI' && t.midiNotes) audioService.scheduleMidi(t.id, t.midiNotes);
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
    const rect = timelineContainerRef.current?.getBoundingClientRect();
    if (rect) {
        let x = e.clientX - rect.left + (timelineContainerRef.current?.scrollLeft || 0);
        if (x < HEADER_WIDTH) x = HEADER_WIDTH;
        const pixelsPerSecond = 40 * zoom;
        let time = (x - HEADER_WIDTH) / pixelsPerSecond;
        if (snapEnabled) {
            const beatDuration = 60 / bpm;
            const barDuration = beatDuration * 4; 
            const snappedTime = Math.round(time / (barDuration / 4)) * (barDuration / 4); 
            time = snappedTime;
        }
        audioService.setTime(Math.max(0, time));
    }
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
        } else if (target.type === 'MIDI') {
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
          color: 'bg-gray-600', 
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
    // Use totalBars state instead of hardcoded 100
    for(let i=0; i<totalBars; i++) {
        lines.push(
            <div key={`bar-${i}`} className="absolute top-0 bottom-0 w-px border-l border-white/5 pointer-events-none" style={{left: `${HEADER_WIDTH + (i * pixelsPerBar)}px`}}></div>
        );
        if(zoom > 0.8) {
             for(let j=1; j<4; j++) {
                 lines.push(<div key={`beat-${i}-${j}`} className="absolute top-0 bottom-0 w-px border-l border-white/5 border-dotted pointer-events-none" style={{left: `${HEADER_WIDTH + (i * pixelsPerBar) + (j * (pixelsPerBar/4))}px`}}></div>);
             }
        }
    }
    // END MARKER
    lines.push(
        <div key="end-marker" className="absolute top-0 bottom-0 w-1 bg-red-500/50 z-20 pointer-events-none flex items-end pb-2 pl-1" style={{left: `${HEADER_WIDTH + (totalBars * pixelsPerBar)}px`}}>
            <span className="text-[10px] text-red-400 font-bold -rotate-90 origin-bottom-left whitespace-nowrap">FIN CANCIÓN</span>
        </div>
    );
    return lines;
  }, [bpm, zoom, totalBars]);

  const totalTrackWidth = HEADER_WIDTH + (totalBars * (60 / bpm) * 4 * (40 * zoom)) + 100; // Extra padding

  // Execute AI Suggestion
  const applyProducerAdvice = () => {
      if(!producerAdvice?.actionType) return;
      if(producerAdvice.actionType === 'ADD_DRUMS') setShowCreative(true); // Open AI Creative
      // Other actions could be implemented here
      setShowProducer(false);
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-studio-dark font-nunito select-none overflow-hidden text-gray-200 relative">
        
        {/* TOP BAR / TRANSPORT */}
        <div className="h-16 flex-shrink-0 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center px-4 justify-between z-50">
             
             {/* Left: LOGO & EXIT */}
             <div className="flex items-center space-x-4">
                 <button onClick={onExit} className="text-gray-400 hover:text-white"><Home size={20}/></button>
                 
                 <div className="flex items-center space-x-2 select-none group">
                     <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center shadow-lg group-hover:animate-glow transition-all">
                        <Box size={20} className="text-white"/>
                     </div>
                     <div className="flex flex-col leading-none">
                         <span className="font-logo font-black text-lg tracking-wider text-white">EDU<span className="text-cyan-400">STUDIO</span></span>
                         <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase">Lab Edition</span>
                     </div>
                 </div>

                 <div className="w-px h-6 bg-white/10 mx-2"></div>

                 {/* TRANSPORT CONTROLS */}
                 <div className="flex items-center bg-[#18181b] rounded-full p-1 border border-white/5 ml-2 shadow-inner">
                     <button onClick={handleSeekStart} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Ir al Inicio"><SkipBack size={16}/></button>
                     <button onClick={handleRewind} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Retroceder 10s"><Rewind size={16}/></button>
                     <button onClick={handleStop} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/10 rounded-full transition" title="Detener"><Square size={16}/></button>
                     
                     <button onClick={handlePlayToggle} className="mx-2 p-3 bg-cyan-600 rounded-full text-white hover:bg-cyan-500 hover:scale-105 transition shadow-lg border border-cyan-400">
                        {isPlaying ? <Pause size={20} fill="white"/> : <Play size={20} fill="white"/>}
                     </button>
                     
                     <button onClick={handleRecordToggle} className={`mr-2 p-3 rounded-full transition shadow-lg border ${isRecording ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-[#2a2a2a] border-gray-700 hover:bg-[#333] hover:text-red-500'}`} title="Grabar">
                        <Circle size={20} fill={isRecording ? "white" : "currentColor"} className={isRecording ? "text-white" : "text-red-500"}/>
                     </button>
                     
                     <button onClick={handleForward} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Avanzar 10s"><FastForward size={16}/></button>
                     <button onClick={() => { const t = audioService.getCurrentTime(); audioService.setTime(t + 30); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Adelantar"><SkipForward size={16}/></button>
                 </div>
             </div>

             {/* Center Display (LCD) */}
             <div className="relative mx-4 flex-1 max-w-[400px]" ref={metronomeRef}>
                 <div className="bg-[#0f0f0f] rounded border border-[#222] p-0.5 flex items-center justify-between shadow-inner h-12 px-4 relative">
                     <div className="flex flex-col items-center border-r border-[#222] pr-4 cursor-pointer hover:bg-white/5 h-full justify-center transition" onClick={() => setShowMetronomeSettings(!showMetronomeSettings)}>
                         <span className="text-[8px] font-bold text-gray-500 tracking-wider">BPM</span>
                         <span className="text-xl font-mono font-bold text-cyan-400 leading-none">{bpm}</span>
                     </div>
                     <div className="flex flex-col items-center border-r border-[#222] px-4 h-full justify-center">
                          <span className="text-[8px] font-bold text-gray-500">COMPÁS</span>
                          <span className="text-lg font-mono font-bold text-gray-300 leading-none">{timeSignature}</span>
                     </div>
                     <div className="flex flex-col items-center px-4 h-full justify-center">
                          <span className="text-[8px] font-bold text-gray-500">TIEMPO</span>
                          <span className="text-lg font-mono font-bold text-gray-300 leading-none">
                              {Math.floor(audioService.getCurrentTime()).toString().padStart(2, '0')}:
                              {(Math.floor(audioService.getCurrentTime() * 100) % 100).toString().padStart(2, '0')}
                          </span>
                     </div>
                     <button onClick={() => setMetronomeOn(!metronomeOn)} className={`ml-2 p-1.5 rounded transition-all ${metronomeOn ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-600 hover:text-gray-400'}`}>
                        <Settings size={16} className={metronomeOn ? "animate-spin-slow" : ""}/>
                     </button>
                 </div>
                 {showMetronomeSettings && (
                     <div className="absolute top-14 left-0 right-0 bg-[#151515] border border-gray-700 rounded-lg shadow-2xl p-4 z-[100] animate-slide-up flex flex-col space-y-3">
                         <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                             <div><div className="text-xs font-bold text-gray-400">Tempo</div><div className="text-[9px] text-gray-600">TAP PARA AJUSTAR</div></div>
                             <button onClick={handleTapTempo} className="bg-[#222] text-cyan-400 border border-gray-600 rounded w-12 h-8 font-mono font-bold">{bpm}</button>
                         </div>
                         <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold text-gray-500"><span>Volumen Click</span><span>{metronomeVolume} dB</span></div>
                             <input type="range" min="-40" max="0" value={metronomeVolume} onChange={(e) => setMetronomeVolume(parseInt(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyan-500"/>
                         </div>
                     </div>
                 )}
             </div>

             {/* Right Controls */}
             <div className="flex items-center space-x-2 border-l border-white/10 pl-4">
                 
                 <button onClick={() => setSnapEnabled(!snapEnabled)} className={`p-2 rounded ${snapEnabled ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-500 hover:text-gray-300'}`} title="Snap Grid"><Magnet size={18}/></button>
                 <button onClick={() => setLoopRegion({...loopRegion, isActive: !loopRegion.isActive})} className={`p-2 rounded ${loopRegion.isActive ? 'text-green-400 bg-green-900/20' : 'text-gray-500 hover:text-gray-300'}`} title="Bucle"><Repeat size={18}/></button>

                 {/* ZOOM CONTROLS WITH FIT BUTTON */}
                 <div className="flex items-center bg-white/5 rounded p-1 mx-2">
                     <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1 text-gray-400 hover:text-white"><ZoomOut size={14}/></button>
                     <button onClick={handleFitToScreen} className="p-1 text-cyan-400 hover:text-white font-bold text-[10px] w-12 text-center" title="Ajustar a Pantalla">FIT</button>
                     <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-1 text-gray-400 hover:text-white"><ZoomIn size={14}/></button>
                 </div>

                 <button onClick={() => setShowBrowser(!showBrowser)} className={`p-2 rounded flex items-center space-x-1 transition-colors ${showBrowser ? 'bg-cyan-600 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                     <Library size={16}/>
                     <span className="text-xs font-bold hidden md:inline">Librería</span>
                 </button>

                 <button onClick={() => setShowCreative(true)} className="p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded text-xs font-bold flex items-center hover:opacity-90 shadow-lg">
                    <Sparkles size={16} className="mr-1"/> AI
                 </button>
             </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex overflow-hidden bg-transparent relative w-full">
            {!isExplorer && showInspector && selectedTrackId && (
                <Inspector track={tracks.find(t => t.id === selectedTrackId)} mode={userMode} onUpdate={(id, up) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...up } : t))} onClose={() => setSelectedTrackId(null)} />
            )}
            
            <div className="flex-1 flex flex-col min-w-0 relative h-full bg-[#121212]">
                <div ref={timelineContainerRef} className="flex-1 overflow-auto relative scroll-smooth bg-transparent custom-scrollbar">
                     <div className="sticky top-0 z-30 w-fit bg-[#121212]">
                        <TimelineRuler mode={userMode} bpm={bpm} zoom={zoom} paddingLeft={HEADER_WIDTH} loopRegion={loopRegion} onLoopChange={setLoopRegion} totalBars={totalBars} />
                     </div>

                     {/* Tracks Container with Dynamic Width */}
                     <div className="relative pb-32" style={{ width: `${totalTrackWidth}px`, minWidth: '100%' }}>
                         <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-0">{gridLines}</div>
                         <div ref={playheadRef} className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-40 pointer-events-none transition-transform duration-75 will-change-transform" style={{ left: '0px', transform: `translateX(${HEADER_WIDTH}px)` }}>
                             <div className="w-4 h-4 -ml-[7px] bg-cyan-400 transform rotate-45 -mt-2 shadow-md flex items-center justify-center">
                                 <div className="w-1 h-1 bg-white rounded-full"></div>
                             </div>
                         </div>
                         {loopRegion.isActive && (
                             <div className="absolute top-0 bottom-0 bg-green-500/5 pointer-events-none border-x border-green-500/30 z-0" style={{ left: HEADER_WIDTH + (loopRegion.startBar * (60/bpm) * 4 * 40 * zoom), width: (loopRegion.endBar - loopRegion.startBar) * (60/bpm) * 4 * 40 * zoom }}></div>
                         )}

                         <div className="relative z-10 pt-1">
                            {tracks.map(track => (
                                <TrackBlock key={track.id} track={{...track, isSelected: track.id === selectedTrackId}} mode={userMode} bpm={bpm} zoom={zoom}
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

                         <div className="mt-8 p-4 flex justify-center w-fit" style={{ marginLeft: HEADER_WIDTH }}>
                             <button onClick={() => setImportModal(true)} className="bg-white/5 text-gray-400 px-8 py-3 rounded-full text-sm font-bold flex items-center hover:bg-white/10 hover:text-white border border-white/5 transition-all"><Plus size={16} className="mr-2"/> Nueva Pista</button>
                        </div>
                     </div>
                </div>
                
                {showMixer && !isExplorer && <div className="h-64 flex-shrink-0 z-50 relative animate-slide-up border-t border-black"><Mixer tracks={tracks} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}} onEQChange={(id, b, v) => {const t=tracks.find(x=>x.id===id); if(t){const n={...t.eq, [b]:v}; setTracks(prev=>prev.map(x=>x.id===id?{...x, eq:n}:x)); audioService.setEQ(id, n.low, n.mid, n.high);}}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onClose={() => setShowMixer(false)} /></div>}
                
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
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1 rounded-2xl shadow-2xl">
                    <div className="bg-[#1e1e1e] rounded-xl p-4 relative">
                         {/* Close X */}
                         <button onClick={() => setShowProducer(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><Bot size={14}/></button>
                         <div className="flex items-start space-x-3">
                             <div className="bg-violet-500/20 p-2 rounded-full">
                                 <Bot size={24} className="text-violet-300"/>
                             </div>
                             <div>
                                 <h4 className="font-bold text-violet-300 text-sm mb-1">AI Producer dice:</h4>
                                 <p className="text-gray-300 text-sm leading-tight">{producerAdvice.message}</p>
                                 {producerAdvice.actionType !== 'NONE' && (
                                     <button onClick={applyProducerAdvice} className="mt-3 text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold py-1 px-3 rounded-full transition-colors flex items-center">
                                         <Sparkles size={10} className="mr-1"/> {producerAdvice.actionLabel || 'Hacer magia'}
                                     </button>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
                {/* Speech Bubble Tail */}
                <div className="w-4 h-4 bg-gradient-to-br from-fuchsia-600 to-transparent rotate-45 transform translate-x-8 -translate-y-2"></div>
            </div>
        )}

        {/* MODALS */}
        {showSettings && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm">
                <div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-2xl w-96 text-gray-200 shadow-2xl">
                    <h3 className="text-xl font-bold mb-4 flex items-center"><Settings className="mr-2"/> Configuración de Audio</h3>
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Entrada de Audio (Mic)</label>
                        <div className="space-y-2">
                            {audioDevices.length > 0 ? audioDevices.map(d => (
                                <button key={d.deviceId} onClick={() => handleDeviceSelect(d.deviceId)} className="w-full text-left p-2 bg-black/20 hover:bg-black/40 rounded flex items-center transition-colors">
                                    <Mic size={14} className="mr-2 text-green-500"/> <span className="text-sm truncate">{d.label}</span>
                                </button>
                            )) : <div className="text-sm text-red-400">No se detectaron dispositivos.</div>}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 font-bold text-sm text-white">Cerrar</button>
                    </div>
                </div>
            </div>
        )}
        {showCreative && <CreativeEditor onClose={() => setShowCreative(false)} onImportLyrics={(t)=>setMetadata(p=>({...p,lyrics:t}))} onImportChords={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Acordes ${d.key}`,type:'CHORD',instrument:'CHORD',color:'bg-blue-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,chordData:d.progression}]);audioService.addTrack(id,'','INSTRUMENT');}} onImportRhythm={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Batería ${d.style}`,type:'RHYTHM',instrument:'DRUMS',color:'bg-red-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,rhythmData:d.events}]);audioService.addTrack(id,'','DRUMS');}} onImportMelody={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Melodía ${d.key}`,type:'MELODY',instrument:'KEYS',color:'bg-yellow-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,melodyData:d.events}]);audioService.addTrack(id,'','INSTRUMENT');}} />}
        {pendingImport && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"><div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-96 animate-slide-up border border-white/10"><h3 className="text-xl font-bold mb-2 text-white">Importar Archivo</h3><p className="text-sm text-gray-400 mb-4 break-all">"{pendingImport.name}"</p><div className="space-y-3"><button onClick={() => confirmImport('AUDIO')} className="w-full p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl flex items-center font-bold text-blue-300 border border-blue-500/30"><div className="bg-blue-600 text-white p-2 rounded-full mr-3"><FileAudio size={18}/></div><div><div className="text-sm">Pista de Audio</div></div></button><button onClick={() => confirmImport('MIDI')} className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center font-bold text-gray-300 border border-gray-600"><div className="bg-gray-600 text-white p-2 rounded-full mr-3"><Music size={18}/></div><div><div className="text-sm">Pista MIDI</div></div></button></div><button onClick={() => setPendingImport(null)} className="mt-4 text-gray-500 text-xs hover:text-white font-bold block mx-auto uppercase">Cancelar</button></div></div>}
        {importModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"><div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-xl w-96 border border-white/10"><h3 className="text-xl font-bold mb-4 text-white">Crear Nueva Pista</h3><div className="space-y-3"><button onClick={() => addTrack('AUDIO')} className="w-full p-4 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl flex items-center font-bold text-blue-300 border border-blue-500/30"><div className="bg-blue-600 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>Audio / Voz (Mic)</button><button onClick={() => addTrack('MIDI')} className="w-full p-4 bg-orange-900/30 hover:bg-orange-900/50 rounded-xl flex items-center font-bold text-orange-300 border border-orange-500/30"><div className="bg-orange-600 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>Instrumento Virtual (MIDI)</button></div><button onClick={() => setImportModal(false)} className="mt-4 text-gray-500 text-sm hover:text-white font-bold block mx-auto">Cancelar</button></div></div>}
    </div>
  );
};