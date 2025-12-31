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
import { Track, UserMode, SongMetadata, MidiNote, AudioDevice, LoopRegion } from '../types';
import { Play, Square, Sparkles, Home, SkipBack, Circle, PanelBottom, BookOpen, Pause, Grid, Save, SkipForward, FastForward, Rewind, Plus, Settings, Zap, Music, FileAudio, Keyboard as KeyboardIcon, ChevronLeft, ChevronRight, Mic, MoreVertical, Volume2, Magnet, ZoomIn, ZoomOut, Repeat } from 'lucide-react';

interface StudioProps {
  userMode: UserMode;
  onExit: () => void;
}

const INITIAL_TRACKS: Track[] = [
  { 
    id: '1', name: 'Batería Demo', type: 'DRUMS', instrument: 'DRUMS', color: 'bg-rose-500', 
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

const HEADER_WIDTH = 256; 

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
  const [loopRegion, setLoopRegion] = useState<LoopRegion>({ startBar: 0, endBar: 4, isActive: false });

  // Metronome Settings State
  const [showMetronomeSettings, setShowMetronomeSettings] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(-10);
  const [tapTempoTaps, setTapTempoTaps] = useState<number[]>([]);

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
    
    // Close metronome popover if clicked outside
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
        // Zoom affects Playhead Speed visually
        const pixelsPerSecond = 40 * zoom; 
        playheadRef.current.style.transform = `translateX(${HEADER_WIDTH + (time * pixelsPerSecond)}px)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if(animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [zoom]); // Re-bind on zoom change

  // --- TAP TEMPO LOGIC ---
  const handleTapTempo = () => {
      const now = Date.now();
      const newTaps = [...tapTempoTaps, now].filter(t => now - t < 3000); // Keep last 3 seconds
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

  // --- HANDLERS ---
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
      // Re-schedule for playback
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
        // Calc based on Zoom
        const pixelsPerSecond = 40 * zoom;
        let time = (x - HEADER_WIDTH) / pixelsPerSecond;
        
        // SNAP LOGIC
        if (snapEnabled) {
            const beatDuration = 60 / bpm;
            const barDuration = beatDuration * 4; // Assuming 4/4
            const snappedTime = Math.round(time / (barDuration / 4)) * (barDuration / 4); // Snap to beat
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
    if (!target) { alert("¡Primero arma una pista!"); return; }

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
          color: 'bg-gray-500', 
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
          color: 'bg-green-500', 
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
    // Draw 100 bars
    for(let i=0; i<100; i++) {
        lines.push(
            <div key={`bar-${i}`} className="absolute top-0 bottom-0 w-px border-l border-white/5 pointer-events-none" style={{left: `${HEADER_WIDTH + (i * pixelsPerBar)}px`}}></div>
        );
        // Draw beat lines if zoom is high enough
        if(zoom > 0.8) {
             for(let j=1; j<4; j++) {
                 lines.push(<div key={`beat-${i}-${j}`} className="absolute top-0 bottom-0 w-px border-l border-white/5 border-dotted pointer-events-none" style={{left: `${HEADER_WIDTH + (i * pixelsPerBar) + (j * (pixelsPerBar/4))}px`}}></div>);
             }
        }
    }
    return lines;
  }, [bpm, zoom]);

  return (
    <div className="flex flex-col h-screen bg-studio-dark font-nunito select-none overflow-hidden relative text-gray-200">
        
        {/* TOP BAR / TRANSPORT (Visual overhaul to "Armonia" style) */}
        <div className="h-16 flex-shrink-0 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center px-4 justify-between z-50">
             
             {/* Left Controls */}
             <div className="flex items-center space-x-3">
                 <button onClick={onExit} className="text-gray-400 hover:text-white mr-4"><Home size={18}/></button>
                 <button onClick={handleSettingsOpen} className="p-2 text-gray-400 hover:text-white" title="Configuración de Audio/MIDI"><Settings size={18}/></button>
                 
                 <div className="w-px h-6 bg-white/10 mx-2"></div>

                 {/* Transport Buttons */}
                 <button onClick={handleSeekStart} className="p-2 text-gray-400 hover:text-white transition"><SkipBack size={20}/></button>
                 <button onClick={handleStop} className="p-2 text-gray-400 hover:text-red-500 transition"><Square size={20}/></button>
                 <button onClick={handlePlayToggle} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 hover:scale-105 transition shadow-lg border border-white/5">
                    {isPlaying ? <Pause size={24} fill="white"/> : <Play size={24} fill="white"/>}
                 </button>
                 <button onClick={handleRecordToggle} className={`p-3 rounded-full transition shadow-lg border border-white/5 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20 hover:text-red-500'}`}>
                    <Circle size={24} fill={isRecording ? "white" : "currentColor"} className={isRecording ? "text-white" : "text-red-500"}/>
                 </button>
             </div>

             {/* Center Display */}
             <div className="relative mx-4 flex-1 max-w-lg" ref={metronomeRef}>
                 <div className="bg-black/50 rounded-xl border border-white/10 p-1 flex items-center justify-center space-x-2 shadow-inner h-12">
                     
                     {/* BPM Control */}
                     <div className="flex items-center px-3 py-1 cursor-pointer hover:bg-white/5 rounded transition" onClick={() => setShowMetronomeSettings(!showMetronomeSettings)}>
                         <div className="flex flex-col items-center">
                             <span className="text-[9px] font-bold text-gray-500 leading-none tracking-wider">BPM</span>
                             <span className="text-xl font-mono font-bold text-cyan-400 leading-none">{bpm}</span>
                         </div>
                     </div>

                     {/* Time Sig */}
                     <div className="flex flex-col items-center justify-center px-2 border-l border-white/10">
                         <span className="text-sm font-mono font-bold text-gray-300">{timeSignature}</span>
                     </div>

                     {/* Metronome Toggle */}
                     <button 
                        onClick={() => setMetronomeOn(!metronomeOn)} 
                        className={`p-2 rounded transition-all ${metronomeOn ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-400'}`}
                     >
                        <Settings size={18} className={metronomeOn ? "animate-spin-slow" : ""}/>
                     </button>
                 </div>

                  {/* METRONOME POPOVER (Keep existing code logic, styling fits dark mode) */}
                 {showMetronomeSettings && (
                     <div className="absolute top-14 left-0 right-0 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl p-4 z-[100] animate-slide-up flex flex-col space-y-4">
                         <div className="flex justify-between items-center">
                             <div className="text-sm font-bold text-white">Pulsa Tempo</div>
                             <button onClick={handleTapTempo} className="bg-[#2a2a2a] hover:bg-[#333] text-cyan-400 border border-gray-600 rounded-lg px-6 py-3 font-mono text-xl font-bold flex flex-col items-center min-w-[120px]">
                                 <span>{bpm}</span><span className="text-[9px] text-gray-500 uppercase">Tocar</span>
                             </button>
                         </div>
                         <hr className="border-gray-700"/>
                         <div>
                             <div className="flex justify-between text-xs font-bold text-gray-400 mb-2"><span>Volumen</span><span>{metronomeVolume} dB</span></div>
                             <input type="range" min="-40" max="0" value={metronomeVolume} onChange={(e) => setMetronomeVolume(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
                         </div>
                     </div>
                 )}
             </div>

             {/* Right Controls (Grid & Zoom) */}
             <div className="flex items-center space-x-3 border-l border-white/10 pl-4">
                 
                 {/* Snap Toggle */}
                 <button onClick={() => setSnapEnabled(!snapEnabled)} className={`p-1.5 rounded transition ${snapEnabled ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-500 hover:text-gray-300'}`} title="Ajustar a la cuadrícula (Snap)">
                    <Magnet size={18}/>
                 </button>

                 {/* Loop Toggle */}
                 <button 
                    onClick={() => setLoopRegion({...loopRegion, isActive: !loopRegion.isActive})} 
                    className={`p-1.5 rounded transition ${loopRegion.isActive ? 'text-green-400 bg-green-900/20' : 'text-gray-500 hover:text-gray-300'}`} 
                    title="Activar Bucle"
                 >
                    <Repeat size={18}/>
                 </button>

                 {/* Zoom Controls */}
                 <div className="flex items-center bg-white/5 rounded-lg p-1">
                     <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1 text-gray-400 hover:text-white"><ZoomOut size={14}/></button>
                     <span className="text-[10px] font-bold text-gray-500 w-8 text-center">{Math.round(zoom*100)}%</span>
                     <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-1 text-gray-400 hover:text-white"><ZoomIn size={14}/></button>
                 </div>

                 <button onClick={() => setShowCreative(true)} className="p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-md text-xs font-bold flex items-center hover:opacity-90 shadow-lg ml-2">
                    <Sparkles size={14} className="mr-1"/> AI
                 </button>
             </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-transparent relative">
            {!isExplorer && showInspector && selectedTrackId && <Inspector track={tracks.find(t => t.id === selectedTrackId)} mode={userMode} onUpdate={(id, up) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...up } : t))} onClose={() => setSelectedTrackId(null)} />}
            
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <div ref={timelineContainerRef} className="flex-1 overflow-auto relative scroll-smooth bg-transparent" onMouseDown={(e) => { if(e.target === timelineContainerRef.current) handleSeek(e); }}>
                     
                     {/* TIMELINE RULER */}
                     <div className="sticky top-0 z-30 w-fit">
                        <TimelineRuler 
                            mode={userMode} 
                            bpm={bpm} 
                            zoom={zoom} 
                            paddingLeft={HEADER_WIDTH} 
                            loopRegion={loopRegion}
                            onLoopChange={setLoopRegion}
                        />
                     </div>

                     <div className="relative min-w-max pb-32">
                         {/* Global Grid Lines */}
                         <div className="absolute top-0 left-0 min-w-full h-full pointer-events-none z-0">{gridLines}</div>
                         
                         {/* Playhead */}
                         <div ref={playheadRef} className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-40 pointer-events-none transition-transform duration-75 will-change-transform" style={{ left: '0px', transform: `translateX(${HEADER_WIDTH}px)` }}>
                             <div className="w-4 h-4 -ml-[7px] bg-cyan-400 transform rotate-45 -mt-2 shadow-md"></div>
                         </div>

                         {/* Tracks */}
                         <div className="relative z-10 pt-1">
                            {tracks.map(track => (
                                <TrackBlock 
                                    key={track.id} 
                                    track={{...track, isSelected: track.id === selectedTrackId}} 
                                    mode={userMode} 
                                    bpm={bpm}
                                    zoom={zoom}
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
                
                {/* MIXER */}
                {showMixer && !isExplorer && <div className="h-64 flex-shrink-0 z-50 relative animate-slide-up border-t border-black"><Mixer tracks={tracks} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}} onEQChange={(id, b, v) => {const t=tracks.find(x=>x.id===id); if(t){const n={...t.eq, [b]:v}; setTracks(prev=>prev.map(x=>x.id===id?{...x, eq:n}:x)); audioService.setEQ(id, n.low, n.mid, n.high);}}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onClose={() => setShowMixer(false)} /></div>}
                
                {/* PIANO PANEL */}
                {showPianoPanel && <PianoPanel currentInstrument={selectedTrack.midiInstrument} onClose={() => setSelectedTrackId(null)} />}

                {/* PIANO ROLL EDITOR */}
                {editingMidiTrackId && editingTrack && (
                    <PianoRollEditor 
                        trackId={editingTrack.id}
                        trackName={editingTrack.name}
                        notes={editingTrack.midiNotes || []}
                        instrument={editingTrack.midiInstrument || 'GRAND_PIANO'}
                        onUpdateNotes={handleUpdateMidiNotes}
                        onClose={() => setEditingMidiTrackId(null)}
                    />
                )}
            </div>

            {/* Right Side Panels */}
            {showBrowser && <Browser mode={userMode} onImport={(u,n,t)=>setPendingImport({url:u,name:n})} onLoadSession={(s)=>{handleStop();setSessionId(s.id);setSessionName(s.name);setBpm(s.bpm);setTracks(s.tracks);if(s.metadata)setMetadata(s.metadata);setShowBrowser(false);}} onClose={() => setShowBrowser(false)} />}
            {showSongbook && <SongbookPanel mode={userMode} metadata={metadata} onUpdateLyrics={(text) => setMetadata(prev=>({...prev, lyrics: text}))} onClose={() => setShowSongbook(false)} />}
        </div>
        
        {/* SETTINGS MODAL */}
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
                            )) : <div className="text-sm text-red-400">No se detectaron dispositivos. Revisa los permisos.</div>}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 font-bold text-sm text-white">Cerrar</button>
                    </div>
                </div>
            </div>
        )}

        {/* ... (Existing modals for import and creative kept same but styling updated implicitly by theme) ... */}
        {showCreative && <CreativeEditor onClose={() => setShowCreative(false)} onImportLyrics={(t)=>setMetadata(p=>({...p,lyrics:t}))} onImportChords={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Acordes ${d.key}`,type:'CHORD',instrument:'CHORD',color:'bg-blue-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,chordData:d.progression}]);audioService.addTrack(id,'','INSTRUMENT');}} onImportRhythm={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Batería ${d.style}`,type:'RHYTHM',instrument:'DRUMS',color:'bg-red-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,rhythmData:d.events}]);audioService.addTrack(id,'','DRUMS');}} onImportMelody={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Melodía ${d.key}`,type:'MELODY',instrument:'KEYS',color:'bg-yellow-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,melodyData:d.events}]);audioService.addTrack(id,'','INSTRUMENT');}} />}
        {pendingImport && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"><div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-96 animate-slide-up border border-white/10"><h3 className="text-xl font-bold mb-2 text-white">Importar Archivo</h3><p className="text-sm text-gray-400 mb-4 break-all">"{pendingImport.name}"</p><div className="space-y-3"><button onClick={() => confirmImport('AUDIO')} className="w-full p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl flex items-center font-bold text-blue-300 border border-blue-500/30"><div className="bg-blue-600 text-white p-2 rounded-full mr-3"><FileAudio size={18}/></div><div><div className="text-sm">Pista de Audio</div></div></button><button onClick={() => confirmImport('MIDI')} className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center font-bold text-gray-300 border border-gray-600"><div className="bg-gray-600 text-white p-2 rounded-full mr-3"><Music size={18}/></div><div><div className="text-sm">Pista MIDI</div></div></button></div><button onClick={() => setPendingImport(null)} className="mt-4 text-gray-500 text-xs hover:text-white font-bold block mx-auto uppercase">Cancelar</button></div></div>}
        {importModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"><div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-xl w-96 border border-white/10"><h3 className="text-xl font-bold mb-4 text-white">Crear Nueva Pista</h3><div className="space-y-3"><button onClick={() => addTrack('AUDIO')} className="w-full p-4 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl flex items-center font-bold text-blue-300 border border-blue-500/30"><div className="bg-blue-600 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>Audio / Voz (Mic)</button><button onClick={() => addTrack('MIDI')} className="w-full p-4 bg-orange-900/30 hover:bg-orange-900/50 rounded-xl flex items-center font-bold text-orange-300 border border-orange-500/30"><div className="bg-orange-600 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>Instrumento Virtual (MIDI)</button></div><button onClick={() => setImportModal(false)} className="mt-4 text-gray-500 text-sm hover:text-white font-bold block mx-auto">Cancelar</button></div></div>}
    </div>
  );
};