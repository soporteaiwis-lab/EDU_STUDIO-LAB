import * as Tone from 'tone';
import { ChordEvent, DrumEvent, MelodyEvent } from '../types';

interface ChannelStrip {
  player?: Tone.Player; // Audio
  synth?: Tone.PolySynth; // Chords/Melody
  drumSampler?: Tone.Players; // Drums
  panner: Tone.Panner;
  eq: Tone.EQ3;
  volume: Tone.Volume;
  reverb: Tone.Reverb;
  pitchShift: Tone.PitchShift;
  node: Tone.Channel;
  type: 'AUDIO' | 'INSTRUMENT' | 'DRUMS';
}

class AudioService {
  private channels: Map<string, ChannelStrip> = new Map();
  private mic: Tone.UserMedia | null = null;
  private recorder: Tone.Recorder | null = null;
  private metronomeLoop: Tone.Loop | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  
  // Parts for sequencing
  private activeParts: Map<string, Tone.Part> = new Map();
  
  public bpm: number = 120;
  private isInitialized: boolean = false;
  private currentBeat: number = 0;

  // Chord Dictionary
  private chordMap: Record<string, string[]> = {
      'C': ['C4', 'E4', 'G4'], 'Cm': ['C4', 'Eb4', 'G4'], 'C7': ['C4', 'E4', 'G4', 'Bb4'],
      'D': ['D4', 'F#4', 'A4'], 'Dm': ['D4', 'F4', 'A4'], 'D7': ['D4', 'F#4', 'A4', 'C5'],
      'E': ['E4', 'G#4', 'B4'], 'Em': ['E4', 'G4', 'B4'], 'E7': ['E4', 'G#4', 'B4', 'D5'],
      'F': ['F4', 'A4', 'C5'], 'Fm': ['F4', 'Ab4', 'C5'], 'G': ['G3', 'B3', 'D4'],
      'Gm': ['G3', 'Bb3', 'D4'], 'G7': ['G3', 'B3', 'D4', 'F4'],
      'A': ['A3', 'C#4', 'E4'], 'Am': ['A3', 'C4', 'E4'], 'Am7': ['A3', 'C4', 'E4', 'G4'],
      'B': ['B3', 'D#4', 'F#4'], 'Bm': ['B3', 'D4', 'F#4']
  };

  constructor() {
    // Singleton
  }

  async initialize() {
    if (this.isInitialized && Tone.context.state === 'running') return;
    await Tone.start();
    
    if (!this.isInitialized) {
        this.metronomeSynth = new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, oscillator: { type: 'sine' } }).toDestination();
        this.metronomeSynth.volume.value = -10;
        this.recorder = new Tone.Recorder();
        this.mic = new Tone.UserMedia();
        this.isInitialized = true;
    }
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  setTime(seconds: number) {
    Tone.Transport.seconds = seconds;
    const spb = 60 / this.bpm;
    this.currentBeat = Math.floor(seconds / spb);
  }

  // --- Track Management ---

  async addTrack(id: string, urlOrType: string, type: 'AUDIO' | 'INSTRUMENT' | 'DRUMS' = 'AUDIO'): Promise<void> {
    await this.initialize();
    
    // Cleanup existing
    if (this.channels.has(id)) {
        const c = this.channels.get(id);
        c?.player?.dispose();
        c?.synth?.dispose();
        c?.drumSampler?.dispose();
        c?.reverb.dispose();
        c?.pitchShift.dispose();
        c?.eq.dispose();
        c?.panner.dispose();
        c?.node.dispose();
        this.channels.delete(id);
    }
    // Cleanup parts
    if(this.activeParts.has(id)) {
        this.activeParts.get(id)?.dispose();
        this.activeParts.delete(id);
    }

    // Common Chain
    const eq = new Tone.EQ3(0, 0, 0);
    const panner = new Tone.Panner(0);
    const volume = new Tone.Volume(0);
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 }); 
    const pitchShift = new Tone.PitchShift({ pitch: 0 });
    const channel = new Tone.Channel({ volume: 0, pan: 0 }).toDestination();

    if (type === 'INSTRUMENT') {
        // CHORDS / MELODY SYNTH
        // FIX: Short release/sustain to prevent "muddy" overlapping chords
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.3 } 
        });
        synth.chain(pitchShift, eq, panner, volume, reverb, channel);
        this.channels.set(id, { synth, eq, panner, volume, reverb, pitchShift, node: channel, type: 'INSTRUMENT' });

    } else if (type === 'DRUMS') {
        // DRUM SAMPLER
        return new Promise((resolve) => {
            const players = new Tone.Players({
                KICK: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
                SNARE: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
                HIHAT: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3"
            }, () => {
                players.chain(pitchShift, eq, panner, volume, reverb, channel);
                this.channels.set(id, { drumSampler: players, eq, panner, volume, reverb, pitchShift, node: channel, type: 'DRUMS' });
                resolve();
            });
        });

    } else {
        // AUDIO TRACK
        return new Promise((resolve, reject) => {
            const player = new Tone.Player({
                url: urlOrType, loop: false, autostart: false,
                onload: () => {
                    player.chain(pitchShift, eq, panner, volume, reverb, channel);
                    this.channels.set(id, { player, eq, panner, volume, reverb, pitchShift, node: channel, type: 'AUDIO' });
                    player.sync().start(0);
                    resolve();
                },
                onerror: (e) => reject(e)
            });
        });
    }
  }

  // --- SCHEDULING (SEQUENCER) ---

  scheduleChords(trackId: string, chords: ChordEvent[]) {
     const ch = this.channels.get(trackId);
     if (!ch || !ch.synth) return;
     if (this.activeParts.has(trackId)) this.activeParts.get(trackId)?.dispose();

     const events = chords.map(c => ({
         time: `${c.bar - 1}:0:0`, 
         chordName: c.name,
         duration: `${c.duration}m`
     }));

     const part = new Tone.Part((time, value) => {
         const notes = this.chordMap[value.chordName] || this.chordMap[value.chordName.replace('maj', '')] || ['C4'];
         ch.synth?.triggerAttackRelease(notes, "1n", time); // Force 1 bar length but envelope handles release
     }, events).start(0);
     
     this.activeParts.set(trackId, part);
  }

  scheduleDrums(trackId: string, events: DrumEvent[]) {
      const ch = this.channels.get(trackId);
      if (!ch || !ch.drumSampler) return;
      if (this.activeParts.has(trackId)) this.activeParts.get(trackId)?.dispose();

      // Loop the 2 bar pattern for the whole song duration (e.g. 30 bars)
      // For simplicity, we just schedule the pattern once at start, but let's loop it.
      const loopLength = "2m"; // Assuming 2 bar patterns from AI
      
      const part = new Tone.Part((time, value) => {
          if (ch.drumSampler?.has(value.instrument)) {
              ch.drumSampler.player(value.instrument).start(time);
          }
      }, events);
      
      part.loop = true;
      part.loopEnd = loopLength;
      part.start(0);
      
      this.activeParts.set(trackId, part);
  }

  scheduleMelody(trackId: string, events: MelodyEvent[]) {
      const ch = this.channels.get(trackId);
      if (!ch || !ch.synth) return;
      if (this.activeParts.has(trackId)) this.activeParts.get(trackId)?.dispose();

      const part = new Tone.Part((time, value) => {
          ch.synth?.triggerAttackRelease(value.note, value.duration, time);
      }, events).start(0);
      
      this.activeParts.set(trackId, part);
  }

  // --- PREVIEWS ---

  previewChord(chordName: string) {
      if(!this.isInitialized) this.initialize();
      const synth = new Tone.PolySynth().toDestination();
      synth.volume.value = -10;
      synth.set({ envelope: { release: 0.2 } }); // Short release
      const notes = this.chordMap[chordName] || ['C4', 'E4', 'G4'];
      synth.triggerAttackRelease(notes, "4n");
  }

  previewMelodyNote(note: string) {
      if(!this.isInitialized) this.initialize();
      const synth = new Tone.Synth().toDestination();
      synth.volume.value = -10;
      synth.triggerAttackRelease(note, "8n");
  }

  // --- HELPERS ---

  setVolume(id: string, value: number) {
    const ch = this.channels.get(id);
    if (ch) ch.node.volume.rampTo(value <= 0 ? -Infinity : Tone.gainToDb(value / 100), 0.1);
  }

  getWaveformPath(id: string, width: number, height: number): string {
    const channel = this.channels.get(id);
    if (!channel || !channel.player || !channel.player.loaded) return "";
    try {
        const buffer = channel.player.buffer;
        const data = buffer.getChannelData(0); 
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        let path = `M 0 ${amp} `;
        for (let i = 0; i < width; i++) {
          let min = 1.0; let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          path += `L ${i} ${(1 + min) * amp} `;
          path += `L ${i} ${(1 + max) * amp} `;
        }
        return path;
    } catch (e) { return ""; }
  }

  // Transport
  play() { if (Tone.context.state !== 'running') Tone.context.resume(); Tone.Transport.start(); }
  pause() { Tone.Transport.pause(); }
  stop() { Tone.Transport.stop(); Tone.Transport.seconds = 0; this.currentBeat = 0; }
  getCurrentTime() { return Tone.Transport.seconds; }
  
  // Effects Wrappers
  setReverb(id: string, val: number) { const c=this.channels.get(id); if(c) c.reverb.wet.value=val; }
  setPitch(id: string, val: number) { const c=this.channels.get(id); if(c) c.pitchShift.pitch=val; }
  setPan(id: string, val: number) { const c=this.channels.get(id); if(c) c.node.pan.rampTo(val,0.1); }
  setEQ(id: string, l:number, m:number, h:number) { const c=this.channels.get(id); if(c) { c.eq.low.value=l; c.eq.mid.value=m; c.eq.high.value=h; } }
  toggleMute(id: string, m: boolean) { const c=this.channels.get(id); if(c) c.node.mute=m; }
  toggleSolo(id: string, s: boolean) { const c=this.channels.get(id); if(c) c.node.solo=s; }

  // Recording
  async startRecording() { await this.initialize(); if(this.mic && this.recorder) { await this.mic.open(); this.mic.connect(this.recorder); this.recorder.start(); } }
  async stopRecording() { if(this.recorder && this.mic) { const r=await this.recorder.stop(); this.mic.close(); return URL.createObjectURL(r); } return null; }
  async exportMixdown(dur: number): Promise<Blob> {
    const r = new Tone.Recorder(); Tone.Destination.connect(r); r.start();
    Tone.Transport.stop(); Tone.Transport.seconds=0; Tone.Transport.start();
    return new Promise(res => setTimeout(async()=>{ const b=await r.stop(); Tone.Transport.stop(); Tone.Destination.disconnect(r); res(b); }, dur*1000));
  }
}

export const audioService = new AudioService();