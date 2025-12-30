import * as Tone from 'tone';
import { EffectType, ChordEvent } from '../types';

interface ChannelStrip {
  player?: Tone.Player; // For Audio Tracks
  synth?: Tone.PolySynth; // For MIDI/Chord Tracks
  panner: Tone.Panner;
  eq: Tone.EQ3;
  volume: Tone.Volume;
  reverb: Tone.Reverb;
  pitchShift: Tone.PitchShift;
  node: Tone.Channel;
  type: 'AUDIO' | 'INSTRUMENT';
}

class AudioService {
  private channels: Map<string, ChannelStrip> = new Map();
  private mic: Tone.UserMedia | null = null;
  private recorder: Tone.Recorder | null = null;
  private metronomeLoop: Tone.Loop | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private chordPart: Tone.Part | null = null;
  
  public bpm: number = 120;
  private isInitialized: boolean = false;
  private currentBeat: number = 0;

  // Simple Chord Dictionary
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
        // Metronome
        this.metronomeSynth = new Tone.MembraneSynth({
          pitchDecay: 0.008, octaves: 2, oscillator: { type: 'sine' }
        }).toDestination();
        this.metronomeSynth.volume.value = -10;

        // Recorder
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

  toggleMetronome(enabled: boolean) {
    if (enabled) {
      if (!this.metronomeLoop) {
        this.metronomeLoop = new Tone.Loop((time) => {
          const beat = this.currentBeat % 4;
          this.metronomeSynth?.triggerAttackRelease(beat === 0 ? "C6" : "C5", "32n", time);
          this.currentBeat++;
        }, "4n");
      }
      this.metronomeLoop.start(0);
    } else {
      this.metronomeLoop?.stop();
    }
  }

  // --- Track Management ---

  async addTrack(id: string, urlOrType: string, isInstrument: boolean = false): Promise<void> {
    await this.initialize();
    
    // Cleanup existing
    if (this.channels.has(id)) {
        const c = this.channels.get(id);
        c?.player?.dispose();
        c?.synth?.dispose();
        c?.reverb.dispose();
        c?.pitchShift.dispose();
        c?.eq.dispose();
        c?.panner.dispose();
        c?.node.dispose();
        this.channels.delete(id);
    }

    const eq = new Tone.EQ3(0, 0, 0);
    const panner = new Tone.Panner(0);
    const volume = new Tone.Volume(0);
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 }); 
    const pitchShift = new Tone.PitchShift({ pitch: 0 });
    const channel = new Tone.Channel({ volume: 0, pan: 0 }).toDestination();

    // Chain: Source -> Pitch -> EQ -> Panner -> Volume -> Reverb -> Channel
    
    if (isInstrument) {
        // SYNTH TRACK (Chords/MIDI)
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
        });
        synth.chain(pitchShift, eq, panner, volume, reverb, channel);
        this.channels.set(id, { synth, eq, panner, volume, reverb, pitchShift, node: channel, type: 'INSTRUMENT' });

    } else {
        // AUDIO TRACK
        return new Promise((resolve, reject) => {
            const player = new Tone.Player({
                url: urlOrType,
                loop: false,
                autostart: false,
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

  // --- CHORD LOGIC ---

  getNotesForChord(chordName: string): string[] {
      // Basic normalization to handle "Cmaj7" -> "C" approx if needed, 
      // but for now direct lookup
      return this.chordMap[chordName] || this.chordMap[chordName.replace('maj', '')] || ['C4']; 
  }

  previewChord(chordName: string) {
      if(!this.isInitialized) this.initialize();
      const synth = new Tone.PolySynth().toDestination();
      synth.volume.value = -10;
      const notes = this.getNotesForChord(chordName);
      synth.triggerAttackRelease(notes, "0.5");
      // Cleanup
      setTimeout(() => synth.dispose(), 1000);
  }

  scheduleChords(trackId: string, chords: ChordEvent[]) {
     // 1. Find the synth for this track
     const ch = this.channels.get(trackId);
     if (!ch || !ch.synth) return;

     // 2. Create a Part
     if (this.chordPart) {
         this.chordPart.dispose();
     }

     const events = chords.map(c => ({
         time: `${c.bar - 1}:0:0`, // Bar:Quarter:Sixteenth
         chordName: c.name,
         duration: `${c.duration}m` // measures
     }));

     this.chordPart = new Tone.Part((time, value) => {
         const notes = this.getNotesForChord(value.chordName);
         ch.synth?.triggerAttackRelease(notes, value.duration, time);
     }, events).start(0);
  }

  // --- Effects Control ---

  setReverb(id: string, amount: number) {
      const ch = this.channels.get(id);
      if (ch) ch.reverb.wet.value = amount;
  }

  setPitch(id: string, semiTones: number) {
      const ch = this.channels.get(id);
      if (ch) ch.pitchShift.pitch = semiTones;
  }

  setVolume(id: string, value: number) {
    const ch = this.channels.get(id);
    if (ch) {
       const db = value <= 0 ? -Infinity : Tone.gainToDb(value / 100);
       ch.node.volume.rampTo(db, 0.1);
    }
  }

  setPan(id: string, value: number) {
    const ch = this.channels.get(id);
    if (ch) ch.node.pan.rampTo(value, 0.1);
  }

  setEQ(id: string, low: number, mid: number, high: number) {
     const ch = this.channels.get(id);
     if (ch) {
         ch.eq.low.value = low;
         ch.eq.mid.value = mid;
         ch.eq.high.value = high;
     }
  }

  toggleMute(id: string, mute: boolean) {
    const ch = this.channels.get(id);
    if (ch) ch.node.mute = mute;
  }

  toggleSolo(id: string, solo: boolean) {
     const ch = this.channels.get(id);
     if (ch) ch.node.solo = solo;
  }

  // --- Helper ---
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

  // --- Transport / Recording wrappers (same as before) ---
  play() { if (Tone.context.state !== 'running') Tone.context.resume(); Tone.Transport.start(); }
  pause() { Tone.Transport.pause(); }
  stop() { Tone.Transport.stop(); Tone.Transport.seconds = 0; this.currentBeat = 0; }
  getCurrentTime() { return Tone.Transport.seconds; }
  
  async startRecording() {
    await this.initialize();
    if (Tone.context.state !== 'running') await Tone.context.resume();
    if (this.mic && this.recorder) {
      await this.mic.open();
      this.mic.connect(this.recorder);
      this.recorder.start();
    }
  }

  async stopRecording() {
    if (this.recorder && this.mic && this.recorder.state === 'started') {
      const recording = await this.recorder.stop();
      this.mic.close();
      return URL.createObjectURL(recording);
    }
    return null;
  }

  async exportMixdown(duration: number): Promise<Blob> {
    const recorder = new Tone.Recorder();
    Tone.Destination.connect(recorder);
    recorder.start();
    Tone.Transport.stop(); Tone.Transport.seconds = 0; Tone.Transport.start();
    return new Promise((resolve) => {
        setTimeout(async () => {
            const recording = await recorder.stop();
            Tone.Transport.stop();
            Tone.Destination.disconnect(recorder);
            resolve(recording);
        }, duration * 1000);
    });
  }
}

export const audioService = new AudioService();