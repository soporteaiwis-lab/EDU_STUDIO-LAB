import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrackBlock } from './TrackBlock';
import { Mixer } from './Mixer';
import { Inspector } from './Inspector';
import { Browser } from './Browser';
import { SongbookPanel } from './SongbookPanel';
import { TimelineRuler } from './TimelineRuler';
import { CreativeEditor } from './CreativeEditor';
import { VirtualKeyboard } from './VirtualKeyboard';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { Track, UserMode, SongMetadata, MidiNote } from '../types';
import { Play, Square, Sparkles, Home, SkipBack, Circle, PanelBottom, BookOpen, Pause, Grid, Save, SkipForward, FastForward, Rewind, Plus, Settings, Zap, Music, FileAudio, Keyboard as KeyboardIcon, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  const recordingTrackIdRef = useRef<string | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const [showMixer, setShowMixer] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showBrowser, setShowBrowser] = useState(true);
  const [showSongbook, setShowSongbook] = useState(false);
  const [showCreative, setShowCreative] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  const [importModal, setImportModal] = useState(false); 
  const [pendingImport, setPendingImport] = useState<{url: string, name: string} | null>(null); 

  const [bpm, setBpm] = useState(120);
  
  const isPro = userMode === UserMode.PRO;
  const isExplorer = userMode === UserMode.EXPLORER;

  // --- AUDIO INIT ---
  useEffect(() => {
    tracks.forEach(t => { 
        if(t.type === 'AUDIO' && t.audioUrl) audioService.addTrack(t.id, t.audioUrl, 'AUDIO');
        if(t.type === 'SAMPLER' && t.samplerUrl) audioService.addTrack(t.id, t.samplerUrl, 'SAMPLER');
        if(t.type === 'CHORD' || t.type === 'MIDI' || t.type === 'MELODY') audioService.addTrack(t.id, '', 'INSTRUMENT');
        if(t.type === 'RHYTHM' || t.type === 'DRUMS') audioService.addTrack(t.id, '', 'DRUMS');
    });

    // MIDI Recording Callback
    audioService.onMidiNoteRecorded = (trackId, note) => {
        setTracks(prev => prev.map(t => {
            if (t.id === trackId) {
                const existingNotes = t.midiNotes || [];
                return { ...t, midiNotes: [...existingNotes, note] };
            }
            return t;
        }));
    };

    return () => { audioService.stop(); }
  }, []);

  useEffect(() => { audioService.setBpm(bpm); setMetadata(prev => ({...prev, bpm})); }, [bpm]);
  useEffect(() => { audioService.toggleMetronome(metronomeOn); }, [metronomeOn]);
  
  // Track armed/selection change -> Tell AudioService which track gets MIDI
  useEffect(() => {
      const armed = tracks.find(t => t.isArmed && t.type === 'MIDI');
      if (armed) {
          audioService.setActiveMidiTrack(armed.id);
      } else {
          audioService.setActiveMidiTrack(null);
      }
  }, [tracks]);

  useEffect(() => {
    const animate = () => {
      if (playheadRef.current) {
        const time = audioService.getCurrentTime();
        playheadRef.current.style.transform = `translateX(${HEADER_WIDTH + (time * 40)}px)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if(animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []);

  // --- TRANSPORT ---
  const handlePlayToggle = async () => {
    await audioService.initialize();
    if (isPlaying) { 
        audioService.pause(); 
    } else { 
        tracks.forEach(t => {
            if (t.type === 'CHORD' && t.chordData) audioService.scheduleChords(t.id, t.chordData);
            if ((t.type === 'RHYTHM' || t.type === 'DRUMS') && t.rhythmData) audioService.scheduleDrums(t.id, t.rhythmData);
            if (t.type === 'MELODY' && t.melodyData) audioService.scheduleMelody(t.id, t.melodyData);
            // Schedule Recorded MIDI
            if (t.type === 'MIDI' && t.midiNotes) audioService.scheduleMidi(t.id, t.midiNotes);
        });
        audioService.play(); 
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => { audioService.stop(); setIsPlaying(false); setIsRecording(false); audioService.setMidiRecordingState(false); };
  const handleSeekStart = () => audioService.seekToStart();
  const handleSeekEnd = () => audioService.setTime(30 * 4 * (60/bpm)); 
  const handleRewind = () => audioService.rewind(10);
  const handleForward = () => { const t = audioService.getCurrentTime(); audioService.setTime(t + 10); };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineContainerRef.current?.getBoundingClientRect();
    if (rect) {
        let x = e.clientX - rect.left + (timelineContainerRef.current?.scrollLeft || 0);
        if (x < HEADER_WIDTH) x = HEADER_WIDTH;
        audioService.setTime(Math.max(0, (x - HEADER_WIDTH) / 40));
    }
  };

  const handleRecordToggle = async () => {
    // STOP
    if (isRecording) {
      if (recordingTrackIdRef.current) {
         // If it was audio, stop microphone
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

    // START
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
      if(type==='MIDI') audioService.addTrack(id, '', 'INSTRUMENT');
      else if (type==='SAMPLER') audioService.addTrack(id, '', 'SAMPLER');
      else audioService.addTrack(id, '', 'AUDIO');
      setImportModal(false);
  };

  const handleImportRequest = (url: string, name: string) => { setPendingImport({ url, name }); };
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
      const engineType = trackType === 'MIDI' ? 'INSTRUMENT' : trackType;
      audioService.addTrack(id, url, engineType as any);
      setPendingImport(null);
  }

  const gridLines = useMemo(() => {
    const lines = [];
    for(let i=0; i<50; i++) lines.push(<div key={`bar-${i}`} className="absolute top-0 bottom-0 w-px border-l border-gray-700 pointer-events-none opacity-30" style={{left: `${HEADER_WIDTH + (i * 160)}px`}}></div>);
    return lines;
  }, [bpm]);

  return (
    <div className="flex flex-col h-screen bg-[#121212] font-nunito select-none overflow-hidden relative text-gray-300">
        
        {/* TOP BAR / TRANSPORT */}
        <div className="h-16 flex-shrink-0 bg-[#1a1a1a] border-b border-black flex items-center px-4 justify-between z-50">
             
             {/* Left: Transport Buttons */}
             <div className="flex items-center space-x-3">
                 <button onClick={onExit} className="text-gray-500 hover:text-white mr-4"><Home size={18}/></button>
                 <button onClick={handleSeekStart} className="p-2 text-gray-400 hover:text-white active:scale-95 transition"><SkipBack size={20}/></button>
                 <button onClick={handleRewind} className="p-2 text-gray-400 hover:text-white active:scale-95 transition"><Rewind size={20}/></button>
                 <button onClick={handleStop} className="p-2 text-gray-400 hover:text-red-500 active:scale-95 transition"><Square size={20}/></button>
                 <button onClick={handlePlayToggle} className="p-3 bg-[#2a2a2a] rounded-full text-green-500 border border-gray-700 hover:border-green-500 hover:text-green-400 active:scale-95 transition shadow-lg">
                    {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
                 </button>
                 <button onClick={handleRecordToggle} className={`p-3 rounded-full border border-gray-700 active:scale-95 transition shadow-lg ${isRecording ? 'bg-red-900 text-red-500 border-red-500 animate-pulse' : 'bg-[#2a2a2a] text-red-600 hover:text-red-500'}`}>
                    <Circle size={24} fill="currentColor"/>
                 </button>
                 <button onClick={handleForward} className="p-2 text-gray-400 hover:text-white active:scale-95 transition"><FastForward size={20}/></button>
             </div>

             {/* Center: LCD Panel */}
             <div className="mx-4 flex-1 max-w-lg bg-[#0a0a0a] rounded-lg border border-gray-800 p-2 flex items-center justify-center space-x-6 shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-cyan-900/5 pointer-events-none"></div>
                 
                 {/* BPM */}
                 <div className="flex flex-col items-center group relative z-10">
                     <span className="text-[10px] font-bold text-gray-500 mb-0.5">BPM</span>
                     <div className="text-2xl font-mono font-bold text-cyan-400 leading-none">{bpm}</div>
                     <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="absolute w-full h-full opacity-0 cursor-ns-resize"/>
                 </div>
                 
                 {/* Signature */}
                 <div className="flex flex-col items-center z-10">
                     <span className="text-[10px] font-bold text-gray-500 mb-0.5">SIG</span>
                     <div className="text-2xl font-mono font-bold text-cyan-400 leading-none">4/4</div>
                 </div>

                 {/* Metronome Toggle */}
                 <div className="flex flex-col items-center z-10">
                     <span className="text-[10px] font-bold text-gray-500 mb-0.5">CLICK</span>
                     <button onClick={() => setMetronomeOn(!metronomeOn)} className={`w-8 h-6 rounded border ${metronomeOn ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-600'}`}>
                        <div className={`w-2 h-2 rounded-full mx-auto ${metronomeOn ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`}></div>
                     </button>
                 </div>
             </div>

             {/* Right: Tools & Views */}
             <div className="flex items-center space-x-3 border-l border-gray-700 pl-4">
                 <div className="flex flex-col items-end mr-2">
                     <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="bg-transparent text-right text-sm font-bold text-gray-300 focus:outline-none focus:text-cyan-400 w-32"/>
                     <span className="text-[9px] text-gray-500">v{useMemo(() => '2.1.0', [])}</span>
                 </div>
                 
                 <button onClick={() => setShowCreative(true)} className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md text-xs font-bold flex items-center hover:opacity-90 shadow-lg">
                    <Sparkles size={14} className="mr-1"/> AI
                 </button>
                 
                 <div className="flex bg-[#2a2a2a] rounded p-1">
                     <button onClick={() => setShowMixer(!showMixer)} className={`p-1.5 rounded ${showMixer ? 'bg-gray-600 text-white' : 'text-gray-500'}`} title="Mixer"><PanelBottom size={16}/></button>
                     <button onClick={() => {setShowBrowser(false); setShowSongbook(!showSongbook);}} className={`p-1.5 rounded ${showSongbook ? 'bg-gray-600 text-white' : 'text-gray-500'}`} title="Lyrics"><BookOpen size={16}/></button>
                     <button onClick={() => {setShowSongbook(false); setShowBrowser(!showBrowser);}} className={`p-1.5 rounded ${showBrowser ? 'bg-gray-600 text-white' : 'text-gray-500'}`} title="Library"><Grid size={16}/></button>
                 </div>
                 <button onClick={() => storageService.saveSession({ id: sessionId, name: sessionName, lastModified: Date.now(), bpm, tracks, metadata })} className="text-gray-500 hover:text-cyan-400"><Save size={18}/></button>
             </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-[#121212]">
            {!isExplorer && showInspector && selectedTrackId && <Inspector track={tracks.find(t => t.id === selectedTrackId)} mode={userMode} onUpdate={(id, up) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...up } : t))} onClose={() => setSelectedTrackId(null)} />}
            
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <div ref={timelineContainerRef} className="flex-1 overflow-auto relative scroll-smooth bg-[#181818]" onMouseDown={(e) => { if(e.target === timelineContainerRef.current) handleSeek(e); }}>
                     <div className="sticky top-0 z-30 w-fit"><TimelineRuler mode={userMode} bpm={bpm} zoom={1} paddingLeft={HEADER_WIDTH} /></div>
                     <div className="relative min-w-max pb-32">
                         <div className="absolute top-0 left-0 min-w-full h-full pointer-events-none z-0">{gridLines}</div>
                         {/* Playhead */}
                         <div ref={playheadRef} className="absolute top-0 bottom-0 w-px bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] z-40 pointer-events-none" style={{ left: '0px', transform: `translateX(${HEADER_WIDTH}px)` }}>
                             <div className="w-3 h-3 -ml-1.5 bg-cyan-400 transform rotate-45 -mt-1.5"></div>
                         </div>
                         
                         <div className="relative z-10 pt-1">
                            {tracks.map(track => (<TrackBlock key={track.id} track={{...track, isSelected: track.id === selectedTrackId}} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onToggleArm={(id) => setTracks(prev => prev.map(t => ({...t, isArmed: t.id === id ? !t.isArmed : false})))} 
                            onDelete={(id) => {
                                audioService.removeTrack(id); 
                                setTracks(prev => prev.filter(t => t.id !== id));
                            }} 
                            onSelect={(id) => { setSelectedTrackId(id); setShowInspector(true); }} />))}
                         </div>
                         
                         <div className="mt-4 p-4 flex justify-center w-fit" style={{ marginLeft: HEADER_WIDTH }}>
                             <button onClick={() => setImportModal(true)} className="bg-[#2a2a2a] text-gray-400 px-6 py-2 rounded-full text-sm font-bold flex items-center hover:bg-[#333] hover:text-white border border-gray-700 transition-all"><Plus size={16} className="mr-2"/> Añadir Pista</button>
                        </div>
                     </div>
                </div>
                
                {/* Bottom Panels */}
                {showMixer && !isExplorer && <div className="h-64 flex-shrink-0 z-50 relative animate-slide-up border-t border-black"><Mixer tracks={tracks} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}} onEQChange={(id, b, v) => {const t=tracks.find(x=>x.id===id); if(t){const n={...t.eq, [b]:v}; setTracks(prev=>prev.map(x=>x.id===id?{...x, eq:n}:x)); audioService.setEQ(id, n.low, n.mid, n.high);}}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onClose={() => setShowMixer(false)} /></div>}
                
                {showKeyboard && <VirtualKeyboard />}
            </div>

            {/* Right Side Panels */}
            {showBrowser && <Browser mode={userMode} onImport={handleImportRequest} onLoadSession={(s)=>{handleStop();setSessionId(s.id);setSessionName(s.name);setBpm(s.bpm);setTracks(s.tracks);if(s.metadata)setMetadata(s.metadata);setShowBrowser(false);}} onClose={() => setShowBrowser(false)} />}
            {showSongbook && <SongbookPanel mode={userMode} metadata={metadata} onUpdateLyrics={(text) => setMetadata(prev=>({...prev, lyrics: text}))} onClose={() => setShowSongbook(false)} />}
        </div>

        {/* Floating Keyboard Toggle */}
        <button 
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`fixed bottom-4 right-80 z-40 p-3 rounded-full shadow-lg border transition-all ${showKeyboard ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
            title="Teclado Virtual"
        >
            <KeyboardIcon size={20}/>
        </button>
        
        {/* Modals */}
        {showCreative && <CreativeEditor onClose={() => setShowCreative(false)} onImportLyrics={(t)=>setMetadata(p=>({...p,lyrics:t}))} onImportChords={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Acordes ${d.key}`,type:'CHORD',instrument:'CHORD',color:'bg-blue-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,chordData:d.progression}]);audioService.addTrack(id,'','INSTRUMENT');}} onImportRhythm={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Batería ${d.style}`,type:'RHYTHM',instrument:'DRUMS',color:'bg-red-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,rhythmData:d.events}]);audioService.addTrack(id,'','DRUMS');}} onImportMelody={(d)=>{const id=Date.now().toString();setTracks(p=>[...p,{id,name:`Melodía ${d.key}`,type:'MELODY',instrument:'KEYS',color:'bg-yellow-400',volume:80,pan:0,eq:{low:0,mid:0,high:0},effects:{reverb:0,pitch:0,distortion:0},isMuted:false,isSolo:false,isArmed:false,melodyData:d.events}]);audioService.addTrack(id,'','INSTRUMENT');}} />}
        
        {/* Track Type Selection Modal (On File Import) */}
        {pendingImport && (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 animate-slide-up border-2 border-blue-500">
                    <h3 className="text-xl font-bold mb-2">Importar Archivo</h3>
                    <p className="text-sm text-gray-500 mb-4 break-all">"{pendingImport.name}"</p>
                    <p className="text-sm font-bold text-gray-700 mb-4">¿Cómo quieres usar este audio?</p>
                    
                    <div className="space-y-3">
                        <button onClick={() => confirmImport('AUDIO')} className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center font-bold text-blue-700 border border-blue-200">
                             <div className="bg-blue-500 text-white p-2 rounded-full mr-3"><FileAudio size={18}/></div>
                             <div>
                                 <div className="text-sm">Pista de Audio</div>
                                 <div className="text-[10px] opacity-70 font-normal">Para voz, canciones o loops largos</div>
                             </div>
                        </button>
                        <button onClick={() => confirmImport('SAMPLER')} className="w-full p-3 bg-orange-50 hover:bg-orange-100 rounded-xl flex items-center font-bold text-orange-700 border border-orange-200">
                             <div className="bg-orange-500 text-white p-2 rounded-full mr-3"><Zap size={18}/></div>
                             <div>
                                 <div className="text-sm">Sampler / SFX</div>
                                 <div className="text-[10px] opacity-70 font-normal">Efectos cortos (One-Shot)</div>
                             </div>
                        </button>
                        <button onClick={() => confirmImport('MIDI')} className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center font-bold text-gray-700 border border-gray-200">
                             <div className="bg-gray-500 text-white p-2 rounded-full mr-3"><Music size={18}/></div>
                             <div>
                                 <div className="text-sm">Pista MIDI</div>
                                 <div className="text-[10px] opacity-70 font-normal">Instrumento Virtual</div>
                             </div>
                        </button>
                    </div>
                    <button onClick={() => setPendingImport(null)} className="mt-4 text-gray-400 text-xs hover:text-red-500 font-bold block mx-auto uppercase">Cancelar</button>
                </div>
            </div>
        )}

        {/* New Track Modal (Empty) */}
        {importModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-96">
                    <h3 className="text-xl font-bold mb-4">Crear Nueva Pista</h3>
                    <div className="space-y-3">
                        <button onClick={() => addTrack('AUDIO')} className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center font-bold text-blue-700 border border-blue-200">
                             <div className="bg-blue-500 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>
                             Audio / Voz (Mic)
                        </button>
                        <button onClick={() => addTrack('MIDI')} className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-xl flex items-center font-bold text-orange-700 border border-orange-200">
                             <div className="bg-orange-500 text-white p-2 rounded-full mr-3"><Settings size={20}/></div>
                             Instrumento Virtual (MIDI)
                        </button>
                        <button onClick={() => addTrack('SAMPLER')} className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center font-bold text-purple-700 border border-purple-200">
                             <div className="bg-purple-500 text-white p-2 rounded-full mr-3"><Zap size={20}/></div>
                             Sampler / SFX (One-Shot)
                        </button>
                    </div>
                    <button onClick={() => setImportModal(false)} className="mt-4 text-gray-500 text-sm hover:text-red-500 font-bold block mx-auto">Cancelar</button>
                </div>
            </div>
        )}
    </div>
  );
};