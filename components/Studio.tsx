import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrackBlock } from './TrackBlock';
import { Mixer } from './Mixer';
import { Inspector } from './Inspector';
import { Browser } from './Browser';
import { LyricsPanel } from './LyricsPanel';
import { TimelineRuler } from './TimelineRuler';
import { CreativeAssistant } from './CreativeAssistant';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { Track, UserMode, MetronomeConfig, GeneratedChords } from '../types';
import { Play, Square, Sparkles, Home, Download, SkipBack, Circle, PanelBottom, BookOpen, Pause, Grid, Save } from 'lucide-react';

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

const HEADER_WIDTH = 256; 

export const Studio: React.FC<StudioProps> = ({ userMode, onExit }) => {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('Mi Proyecto');
  const [sessionId, setSessionId] = useState(Date.now().toString());
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const recordingTrackIdRef = useRef<string | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const [showMixer, setShowMixer] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const [lyricsContent, setLyricsContent] = useState('');
  const [bpm, setBpm] = useState(120);
  
  const isPro = userMode === UserMode.PRO;
  const isExplorer = userMode === UserMode.EXPLORER;
  const bgMain = isPro ? 'bg-gray-900 text-gray-200' : isExplorer ? 'bg-lego text-gray-800' : 'bg-gray-50 text-gray-700';

  useEffect(() => {
    tracks.forEach(t => { 
        if(t.type === 'AUDIO' && t.audioUrl) audioService.addTrack(t.id, t.audioUrl);
        if(t.type === 'CHORD' || t.type === 'MIDI') audioService.addTrack(t.id, '', true);
    });
    return () => { audioService.stop(); }
  }, []);

  useEffect(() => { audioService.setBpm(bpm); }, [bpm]);

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

  // --- Transport ---
  const handlePlayToggle = async () => {
    await audioService.initialize();
    if (isPlaying) { 
        audioService.pause(); 
    } else { 
        // Schedule Chords before playing
        tracks.forEach(t => {
            if (t.type === 'CHORD' && t.chordData) {
                audioService.scheduleChords(t.id, t.chordData);
            }
        });
        audioService.play(); 
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
      audioService.stop();
      setIsPlaying(false);
      setIsRecording(false);
  };

  const handleRewind = () => { audioService.setTime(0); };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineContainerRef.current?.getBoundingClientRect();
    if (rect) {
        let x = e.clientX - rect.left + (timelineContainerRef.current?.scrollLeft || 0);
        if (x < HEADER_WIDTH) x = HEADER_WIDTH;
        audioService.setTime(Math.max(0, (x - HEADER_WIDTH) / 40));
    }
  };

  // --- Session Management ---
  const handleSaveSession = () => {
      storageService.saveSession({
          id: sessionId,
          name: sessionName,
          lastModified: Date.now(),
          bpm: bpm,
          tracks: tracks
      });
      alert('Proyecto guardado en tu nube local.');
  };

  const handleLoadSession = (session: any) => {
      handleStop();
      setSessionId(session.id);
      setSessionName(session.name);
      setBpm(session.bpm);
      setTracks(session.tracks);
      // Re-initialize audio engine with new tracks
      session.tracks.forEach((t: Track) => {
         if(t.type === 'AUDIO' && t.audioUrl) audioService.addTrack(t.id, t.audioUrl);
         if(t.type === 'CHORD') audioService.addTrack(t.id, '', true);
      });
      setShowBrowser(false);
  };

  // --- Recording ---
  const handleRecordToggle = async () => {
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

    let targetTrackId: string | null = null;
    const existingArmed = tracks.find(t => t.isArmed);

    if (isExplorer) {
        const newId = Date.now().toString();
        const newTrack: Track = { id: newId, name: `Voz ${tracks.length + 1}`, type: 'AUDIO', instrument: 'VOCAL', color: 'bg-rose-500', volume: 80, pan: 0, eq: {low:0, mid:0, high:0}, effects: { reverb: 0, pitch: 0, distortion: 0 }, isMuted: false, isSolo: false, isArmed: true };
        setTracks(prev => [...prev, newTrack]);
        targetTrackId = newId;
    } else {
        if (!existingArmed) return alert("¡Arma una pista!");
        targetTrackId = existingArmed.id;
    }

    try {
        await audioService.startRecording();
        recordingTrackIdRef.current = targetTrackId;
        setIsRecording(true);
        if (!isPlaying) audioService.play();
    } catch (e) { alert("Error mic"); }
  };

  const handleImport = async (url: string, name: string, type: 'AUDIO'|'MIDI') => {
      const newId = Date.now().toString();
      const newTrack: Track = { id: newId, name: name, type: type, instrument: type === 'MIDI' ? 'KEYS' : 'UNKNOWN', color: 'bg-emerald-500', volume: 80, pan: 0, eq: {low:0, mid:0, high:0}, effects: { reverb: 0, pitch: 0, distortion: 0 }, isMuted: false, isSolo: false, isArmed: false, audioUrl: type === 'AUDIO' ? url : undefined };
      if (type === 'AUDIO') await audioService.addTrack(newId, url);
      setTracks(prev => [...prev, newTrack]);
  };

  const addTrack = (type: 'AUDIO'|'MIDI', name?: string) => {
      const newT: Track = { id: Date.now().toString(), name: name || (type === 'AUDIO' ? 'Audio Nuevo' : 'Inst. Nuevo'), type: type, instrument: type === 'AUDIO' ? 'VOCAL' : 'KEYS', color: 'bg-gray-500', volume: 80, pan: 0, eq: {low:0, mid:0, high:0}, effects: { reverb: 0, pitch: 0, distortion: 0 }, isMuted: false, isSolo: false, isArmed: false };
      setTracks(prev => [...prev, newT]);
      if(type === 'MIDI') audioService.addTrack(newT.id, '', true);
  };

  const handleAcceptAIChords = (data: GeneratedChords) => {
      const chordTrack: Track = { id: Date.now().toString(), name: `Acordes (${data.key})`, type: 'CHORD', instrument: 'CHORD', color: 'bg-blue-400', volume: 80, pan: 0, eq: {low:0, mid:0, high:0}, effects: { reverb: 0, pitch: 0, distortion: 0 }, isMuted: false, isSolo: false, isArmed: false, chordData: data.progression };
      setTracks(prev => [...prev, chordTrack]);
      // Init synth for this chord track
      audioService.addTrack(chordTrack.id, '', true);
      if (data.melodyHint) {
          setLyricsContent(prev => prev + `\n\n[IDEA MELÓDICA - ABC]\n${data.melodyHint}`);
          setShowLyrics(true);
      }
  };

  const gridLines = useMemo(() => {
    const lines = [];
    for(let i=0; i<50; i++) {
        lines.push(<div key={`bar-${i}`} className={`absolute top-0 bottom-0 w-px border-l ${isPro ? 'border-gray-600' : 'border-gray-400'} pointer-events-none opacity-50`} style={{left: `${HEADER_WIDTH + (i * 160)}px`}}></div>);
    }
    return lines;
  }, [bpm, isPro]);

  return (
    <div className={`flex flex-col h-screen ${bgMain} font-nunito select-none overflow-hidden relative`}>
        {/* HEADER */}
        <div className={`h-10 flex-shrink-0 flex justify-between items-center px-4 z-50 shadow-sm ${isPro ? 'bg-[#1a1a1a] border-b border-black text-gray-400' : 'bg-white border-b border-gray-200'}`}>
            <div className="flex items-center space-x-3">
                <button onClick={onExit} className="hover:text-white flex items-center"><Home size={16} className="mr-1"/> <span className="text-xs font-bold">Salir</span></button>
                <div className="flex items-center space-x-2 ml-4">
                     <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-500 text-xs font-bold focus:outline-none w-32"/>
                     <button onClick={handleSaveSession} title="Guardar Proyecto"><Save size={14}/></button>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                 <button onClick={() => setShowAI(true)} className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full font-bold text-[10px] hover:brightness-110"><Sparkles size={12}/><span>IA MAGIC</span></button>
            </div>
        </div>

        {/* TRANSPORT */}
        <div className={`h-12 flex-shrink-0 flex items-center px-4 space-x-6 z-40 border-b ${isPro ? 'bg-[#252526] border-black text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
             <div className="flex items-center space-x-2">
                 <button onClick={handleRewind} className="p-1.5 rounded hover:bg-black/20"><SkipBack size={18} fill="currentColor"/></button>
                 <button onClick={handleStop} className="p-1.5 rounded hover:bg-black/20"><Square size={18} fill="currentColor"/></button>
                 <button onClick={handlePlayToggle} className={`p-1.5 rounded-full ${isPlaying ? 'bg-amber-500 text-white' : 'hover:bg-black/20 text-green-500'}`}>{isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}</button>
                 <button onClick={handleRecordToggle} className={`p-1.5 rounded-full ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'hover:bg-black/20 text-red-500'}`}><Circle size={20} fill="currentColor"/></button>
             </div>
             <div className="w-px h-6 bg-gray-500/30"></div>
             <div className="flex items-center space-x-4 font-mono">
                 <div className="flex flex-col items-center leading-none group"><span className="text-xl font-bold text-blue-400">{bpm}</span><span className="text-[9px] text-gray-500">BPM</span></div>
                 <div className="flex flex-col items-center leading-none"><span className="text-xl font-bold text-gray-400">4/4</span><span className="text-[9px] text-gray-500">SIG</span></div>
             </div>
             <div className="flex-1"></div>
             <div className="flex items-center space-x-2 border-l border-gray-500/30 pl-4">
                 <button onClick={() => setShowMixer(!showMixer)} className={`p-1.5 rounded ${showMixer ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><PanelBottom size={18}/></button>
                 <button onClick={() => {setShowBrowser(false); setShowLyrics(!showLyrics);}} className={`p-1.5 rounded ${showLyrics ? 'bg-gray-600 text-white' : 'text-gray-500'}`}><BookOpen size={18}/></button>
                 <button onClick={() => {setShowLyrics(false); setShowBrowser(!showBrowser);}} className={`p-1.5 rounded ${showBrowser ? 'bg-gray-600 text-white' : 'text-gray-500'}`}><Grid size={18}/></button>
             </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex overflow-hidden min-h-0">
            {!isExplorer && showInspector && selectedTrackId && <Inspector track={tracks.find(t => t.id === selectedTrackId)} mode={userMode} onUpdate={(id, up) => { setTracks(prev => prev.map(t => t.id === id ? { ...t, ...up } : t)); }} onClose={() => setSelectedTrackId(null)} />}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <div ref={timelineContainerRef} className="flex-1 overflow-auto relative scroll-smooth bg-opacity-10 cursor-crosshair bg-black/20" onMouseDown={(e) => { if(e.target === timelineContainerRef.current) handleSeek(e); }}>
                     <div className="sticky top-0 z-30 w-fit" onMouseDown={handleSeek}><TimelineRuler mode={userMode} bpm={bpm} zoom={1} paddingLeft={HEADER_WIDTH} /></div>
                     <div className="relative min-w-max pb-32">
                         <div className="absolute top-0 left-0 min-w-full h-full pointer-events-none z-0">{gridLines}</div>
                         <div ref={playheadRef} className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none" style={{ left: '0px', transform: `translateX(${HEADER_WIDTH}px)` }}></div>
                         <div className="relative z-10 pt-2">
                            {tracks.map(track => (<TrackBlock key={track.id} track={{...track, isSelected: track.id === selectedTrackId}} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onToggleArm={(id) => setTracks(prev => prev.map(t => ({...t, isArmed: t.id === id ? !t.isArmed : false})))} onDelete={(id) => setTracks(prev => prev.filter(t => t.id !== id))} onSelect={(id) => { setSelectedTrackId(id); setShowInspector(true); }} />))}
                         </div>
                         <div className="mt-4 p-4 border-2 border-dashed border-gray-600/30 rounded-xl flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity w-fit" style={{ marginLeft: HEADER_WIDTH }}>
                             <button onClick={() => addTrack('AUDIO')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold mr-4">+ Audio Track</button>
                             <button onClick={() => addTrack('MIDI')} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Instrument Track</button>
                        </div>
                     </div>
                </div>
                {showMixer && !isExplorer && <div className="h-64 flex-shrink-0 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] border-t border-gray-700 animate-slide-up relative"><Mixer tracks={tracks} mode={userMode} onVolumeChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: v } : t)); audioService.setVolume(id, v);}} onPanChange={(id, v) => {setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: v } : t)); audioService.setPan(id, v);}} onEQChange={(id, b, v) => {const t=tracks.find(x=>x.id===id); if(t){const n={...t.eq, [b]:v}; setTracks(prev=>prev.map(x=>x.id===id?{...x, eq:n}:x)); audioService.setEQ(id, n.low, n.mid, n.high);}}} onToggleMute={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isMuted:!t.isMuted}:x)); audioService.toggleMute(id, !t.isMuted);}}} onToggleSolo={(id) => {const t=tracks.find(x=>x.id===id); if(t){setTracks(prev=>prev.map(x=>x.id===id?{...x,isSolo:!t.isSolo}:x)); audioService.toggleSolo(id, !t.isSolo);}}} onClose={() => setShowMixer(false)} /></div>}
            </div>
            {showBrowser && <Browser mode={userMode} onImport={handleImport} onLoadSession={handleLoadSession} onClose={() => setShowBrowser(false)} />}
            {showLyrics && <LyricsPanel mode={userMode} content={lyricsContent} onUpdateContent={setLyricsContent} onClose={() => setShowLyrics(false)} />}
        </div>
        {showAI && <CreativeAssistant onClose={() => setShowAI(false)} onAcceptLyrics={(text) => {setLyricsContent(text); setShowLyrics(true);}} onAcceptChords={handleAcceptAIChords} />}
    </div>
  );
};