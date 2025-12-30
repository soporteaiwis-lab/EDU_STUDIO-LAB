import * as Tone from 'tone';
import { EffectType } from '../types';

interface ChannelStrip {
  player: Tone.Player;
  panner: Tone.Panner;
  eq: Tone.EQ3;
  volume: Tone.Volume;
  reverb: Tone.Reverb;
  pitchShift: Tone.PitchShift;
  node: Tone.Channel;
}

class AudioService {
  private channels: Map<string, ChannelStrip> = new Map();
  private mic: Tone.UserMedia | null = null;
  private recorder: Tone.Recorder | null = null;
  private metronomeLoop: Tone.Loop | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  
  public bpm: number = 120;
  private isInitialized: boolean = false;
  private currentBeat: number = 0;

  constructor() {
    // Singleton
  }

  async initialize() {
    if (this.isInitialized && Tone.context.state === 'running') return;
    
    await Tone.start();
    
    if (!this.isInitialized) {
        // Setup Metronome
        this.metronomeSynth = new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 2,
          oscillator: { type: 'sine' }
        }).toDestination();
        this.metronomeSynth.volume.value = -5;

        // Recorder Setup
        this.recorder = new Tone.Recorder();
        this.mic = new Tone.UserMedia();
        
        this.isInitialized = true;
        console.log("Audio Engine Initialized");
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
          if (beat === 0) {
            this.metronomeSynth?.triggerAttackRelease("C6", "32n", time, 1.0); 
          } else {
            this.metronomeSynth?.triggerAttackRelease("C5", "32n", time, 0.5); 
          }
          this.currentBeat++;
        }, "4n");
      }
      const spb = 60 / this.bpm;
      this.currentBeat = Math.floor(Tone.Transport.seconds / spb);
      this.metronomeLoop.start(0);
    } else {
      this.metronomeLoop?.stop();
    }
  }

  // --- Core Audio Logic ---

  async addTrack(id: string, url: string): Promise<void> {
    await this.initialize();
    
    // Dispose existing track if updating
    if (this.channels.has(id)) {
        const c = this.channels.get(id);
        c?.player.dispose();
        c?.reverb.dispose();
        c?.pitchShift.dispose();
        c?.eq.dispose();
        c?.panner.dispose();
        c?.node.dispose();
        this.channels.delete(id);
    }

    return new Promise((resolve, reject) => {
      const player = new Tone.Player({
        url: url,
        loop: false,
        autostart: false,
        onload: () => {
            // FX Chain Nodes
            const pitchShift = new Tone.PitchShift({ pitch: 0 });
            const eq = new Tone.EQ3(0, 0, 0);
            const panner = new Tone.Panner(0);
            const volume = new Tone.Volume(0);
            const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 }); // Wet starts at 0
            const channel = new Tone.Channel({ volume: 0, pan: 0 }).toDestination();

            // Chain Construction: Player -> Pitch -> EQ -> Panner -> Volume -> Reverb -> Channel
            // Note: In real production we might want Reverb as a Send, but for simplicity/Insert style:
            player.chain(pitchShift, eq, panner, volume, reverb, channel);

            this.channels.set(id, { player, eq, panner, volume, reverb, pitchShift, node: channel });
            player.sync().start(0);
            resolve();
        },
        onerror: (e) => {
            console.error("Error loading audio", e);
            reject(e);
        }
      });
    });
  }

  // --- Effects Control ---

  setReverb(id: string, amount: number) {
      const ch = this.channels.get(id);
      if (ch) {
          // Amount 0-1. 
          ch.reverb.wet.value = amount;
      }
  }

  setPitch(id: string, semiTones: number) {
      const ch = this.channels.get(id);
      if (ch) {
          ch.pitchShift.pitch = semiTones;
      }
  }

  getWaveformPath(id: string, width: number, height: number): string {
    const channel = this.channels.get(id);
    if (!channel || !channel.player.loaded) return "";
    try {
        const buffer = channel.player.buffer;
        const data = buffer.getChannelData(0); 
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        let path = `M 0 ${amp} `;
        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          path += `L ${i} ${(1 + min) * amp} `;
          path += `L ${i} ${(1 + max) * amp} `;
        }
        return path;
    } catch (e) {
        return "";
    }
  }

  // --- Transport ---

  play() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  pause() {
    Tone.Transport.pause();
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    this.currentBeat = 0;
  }

  getCurrentTime(): number {
    return Tone.Transport.seconds;
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

  // --- Recording ---

  async startRecording(): Promise<void> {
    await this.initialize();
    
    if (Tone.context.state !== 'running') {
        await Tone.context.resume();
    }

    if (this.mic && this.recorder) {
      try {
          await this.mic.open();
          this.mic.disconnect(); 
          this.mic.connect(this.recorder);
          this.recorder.start();
      } catch (e) {
          console.error("Microphone access denied or error", e);
          throw e;
      }
    } else {
        throw new Error("Audio Engine not initialized properly");
    }
  }

  async stopRecording(): Promise<string | null> {
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
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    Tone.Transport.start();
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