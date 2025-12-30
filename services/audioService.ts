import * as Tone from 'tone';
import { ChordEvent, DrumEvent, MelodyEvent } from '../types';

interface ChannelStrip {
  player?: Tone.Player; // Audio (Long)
  sampler?: Tone.Player; // Sampler (One-Shot)
  synth?: Tone.PolySynth; // Chords/Melody
  drumSampler?: Tone.Players; // Drums
  panner: Tone.Panner;
  eq: Tone.EQ3;
  volume: Tone.Volume;
  reverb: Tone.Reverb;
  pitchShift: Tone.PitchShift;
  node: Tone.Channel;
  type: 'AUDIO' | 'INSTRUMENT' | 'DRUMS' | 'SAMPLER';
}

class AudioService {
  private channels: Map<string, ChannelStrip> = new Map();
  private mic: Tone.UserMedia | null = null;
  private recorder: Tone.Recorder | null = null;
  private metronomeLoop: Tone.Loop | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private metronomeClick: Tone.MetalSynth | null = null; // For high click
  
  private activeParts: Map<string, Tone.Part> = new Map();
  
  public bpm: number = 120;
  public timeSignature: [number, number] = [4, 4];
  private isInitialized: boolean = false;
  private currentBeat: number = 0;

  private chordMap: Record<string, string[]> = {
      'C': ['C4', 'E4', 'G4'], 'Cm': ['C4', 'Eb4', 'G4'], 'C7': ['C4', 'E4', 'G4', 'Bb4'],
      'D': ['D4', 'F#4', 'A4'], 'Dm': ['D4', 'F4', 'A4'], 'D7': ['D4', 'F#4', 'A4', 'C5'],
      'E': ['E4', 'G#4', 'B4'], 'Em': ['E4', 'G4', 'B4'], 'E7': ['E4', 'G#4', 'B4', 'D5'],
      'F': ['F4', 'A4', 'C5'], 'Fm': ['F4', 'Ab4', 'C5'], 'G': ['G3', 'B3', 'D4'],
      'Gm': ['G3', 'Bb3', 'D4'], 'G7': ['G3', 'B3', 'D4', 'F4'],
      'A': ['A3', 'C#4', 'E4'], 'Am': ['A3', 'C4', 'E4'], 'Am7': ['A3', 'C4', 'E4', 'G4'],
      'B': ['B3', 'D#4', 'F#4'], 'Bm': ['B3', 'D4', 'F#4']
  };

  constructor() { }

  async initialize() {
    if (this.isInitialized && Tone.context.state === 'running') return;
    await Tone.start();
    
    if (!this.isInitialized) {
        // Dual Synth for Metronome (Downbeat/Upbeat)
        this.metronomeSynth = new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, oscillator: { type: 'sine' } }).toDestination();
        this.metronomeClick = new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination();
        
        this.metronomeSynth.volume.value = -10;
        if(this.metronomeClick) this.metronomeClick.volume.value = -15;

        this.recorder = new Tone.Recorder();
        this.mic = new Tone.UserMedia();
        this.isInitialized = true;
    }
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  setTimeSignature(numerator: number, denominator: number) {
    this.timeSignature = [numerator, denominator];
    Tone.Transport.timeSignature = numerator;
  }

  setTime(seconds: number) {
    Tone.Transport.seconds = seconds;
    // Calculate beat for visual sync if needed
    const spb = 60 / this.bpm;
    this.currentBeat = Math.floor(seconds / spb);
  }

  toggleMetronome(enabled: boolean) {
      if (enabled) {
          if (this.metronomeLoop) { this.metronomeLoop.stop(); this.metronomeLoop.dispose(); }
          
          this.metronomeLoop = new Tone.Loop((time) => {
              // Calculate current beat position in the bar (0 to numerator-1)
              const position = Tone.Transport.position.toString().split(':');
              const quarter = parseInt(position[1]); // 0, 1, 2, 3...
              
              if (quarter === 0) {
                  // Downbeat (High pitch)
                  this.metronomeClick?.triggerAttackRelease("C6", "32n", time);
              } else {
                  // Upbeat (Low pitch)
                  this.metronomeSynth?.triggerAttackRelease("C5", "32n", time);
              }
          }, "4n"); // Quarter note pulse
          
          this.metronomeLoop.start(0);
      } else {
          this.metronomeLoop?.stop();
      }
  }

  // --- Track Management ---

  async addTrack(id: string, urlOrType: string, type: 'AUDIO' | 'INSTRUMENT' | 'DRUMS' | 'SAMPLER' = 'AUDIO'): Promise<void> {
    await this.initialize();
    
    if (this.channels.has(id)) {
        this.disposeTrack(id);
    }
    
    // Common Chain
    const eq = new Tone.EQ3(0, 0, 0);
    const panner = new Tone.Panner(0);
    const volume = new Tone.Volume(0);
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 }); 
    const pitchShift = new Tone.PitchShift({ pitch: 0 });
    const channel = new Tone.Channel({ volume: 0, pan: 0 }).toDestination();

    // Chain builder helper
    const buildChain = (node: Tone.AudioNode) => {
        node.chain(pitchShift, eq, panner, volume, reverb, channel);
    };

    if (type === 'INSTRUMENT') {
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.3 } 
        });
        buildChain(synth);
        this.channels.set(id, { synth, eq, panner, volume, reverb, pitchShift, node: channel, type: 'INSTRUMENT' });

    } else if (type === 'DRUMS') {
        return new Promise((resolve) => {
            const players = new Tone.Players({
                KICK: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
                SNARE: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
                HIHAT: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3"
            }, () => {
                buildChain(players);
                this.channels.set(id, { drumSampler: players, eq, panner, volume, reverb, pitchShift, node: channel, type: 'DRUMS' });
                resolve();
            });
        });

    } else if (type === 'SAMPLER') {
        // ONE-SHOT SFX
        return new Promise((resolve, reject) => {
             // For sampler, we want re-trigger ability, no loop
            const player = new Tone.Player({
                url: urlOrType, loop: false, autostart: false,
                onload: () => {
                    buildChain(player);
                    this.channels.set(id, { sampler: player, eq, panner, volume, reverb, pitchShift, node: channel, type: 'SAMPLER' });
                    resolve();
                },
                onerror: (e) => reject(e)
            });
        });
    } else {
        // AUDIO TRACK (Long form)
        return new Promise((resolve, reject) => {
            const player = new Tone.Player({
                url: urlOrType, loop: false, autostart: false,
                onload: () => {
                    buildChain(player);
                    this.channels.set(id, { player, eq, panner, volume, reverb, pitchShift, node: channel, type: 'AUDIO' });
                    player.sync().start(0); // Syncs to transport timeline
                    resolve();
                },
                onerror: (e) => reject(e)
            });
        });
    }
  }

  triggerSampler(id: string) {
      const ch = this.channels.get(id);
      if (ch && ch.sampler && ch.sampler.loaded) {
          ch.sampler.start();
      }
  }

  private disposeTrack(id: string) {
      const c = this.channels.get(id);
      c?.player?.dispose();
      c?.sampler?.dispose();
      c?.synth?.dispose();
      c?.drumSampler?.dispose();
      c?.reverb.dispose();
      c?.pitchShift.dispose();
      c?.eq.dispose();
      c?.panner.dispose();
      c?.node.dispose();
      this.channels.delete(id);
      if(this.activeParts.has(id)) {
        this.activeParts.get(id)?.dispose();
        this.activeParts.delete(id);
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
         ch.synth?.triggerAttackRelease(notes, "1n", time);
     }, events).start(0);
     this.activeParts.set(trackId, part);
  }

  scheduleDrums(trackId: string, events: DrumEvent[]) {
      const ch = this.channels.get(trackId);
      if (!ch || !ch.drumSampler) return;
      if (this.activeParts.has(trackId)) this.activeParts.get(trackId)?.dispose();
      
      const part = new Tone.Part((time, value) => {
          if (ch.drumSampler?.has(value.instrument)) {
              ch.drumSampler.player(value.instrument).start(time);
          }
      }, events);
      
      part.loop = true;
      part.loopEnd = "2m";
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

  // --- HELPERS ---
  previewChord(chordName: string) {
      if(!this.isInitialized) this.initialize();
      const synth = new Tone.PolySynth().toDestination();
      synth.volume.value = -10;
      synth.set({ envelope: { release: 0.2 } }); 
      const notes = this.chordMap[chordName] || ['C4', 'E4', 'G4'];
      synth.triggerAttackRelease(notes, "4n");
  }

  setVolume(id: string, value: number) {
    const ch = this.channels.get(id);
    if (ch) ch.node.volume.rampTo(value <= 0 ? -Infinity : Tone.gainToDb(value / 100), 0.1);
  }

  getWaveformPath(id: string, width: number, height: number): string {
    const channel = this.channels.get(id);
    // Support waveform for both Audio and Sampler
    const player = channel?.player || channel?.sampler;
    if (!channel || !player || !player.loaded) return "";
    try {
        const buffer = player.buffer;
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

  // Recording - ROBUST PERMISSION CHECK
  async checkPermissions(): Promise<boolean> {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop immediately to release
          stream.getTracks().forEach(track => track.stop());
          return true;
      } catch (err) {
          console.error("Microphone permission denied:", err);
          return false;
      }
  }

  async startRecording() { 
      await this.initialize(); 
      if(this.mic && this.recorder) { 
          try {
              await this.mic.open(); 
              this.mic.connect(this.recorder); 
              this.recorder.start(); 
          } catch(e) {
              throw new Error("Cannot open microphone");
          }
      } 
  }
  
  async stopRecording() { 
      if(this.recorder && this.mic && this.recorder.state === 'started') { 
          const r = await this.recorder.stop(); 
          this.mic.close(); 
          return URL.createObjectURL(r); 
      } 
      return null; 
  }
}

export const audioService = new AudioService();