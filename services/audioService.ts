import * as Tone from 'tone';
import { EffectType } from '../types';

interface ChannelStrip {
  player: Tone.Player;
  panner: Tone.Panner;
  eq: Tone.EQ3;
  volume: Tone.Volume;
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

  constructor() {
    // Singleton
  }

  async initialize() {
    if (this.isInitialized) return;
    await Tone.start();
    
    // Setup Metronome
    this.metronomeSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'sine' }
    }).toDestination();
    this.metronomeSynth.volume.value = -10;

    // Recorder Setup
    this.recorder = new Tone.Recorder();
    this.mic = new Tone.UserMedia();
    
    this.isInitialized = true;
    console.log("Audio Engine Initialized");
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  setTime(seconds: number) {
    Tone.Transport.seconds = seconds;
  }

  toggleMetronome(enabled: boolean) {
    if (enabled) {
      if (!this.metronomeLoop) {
        this.metronomeLoop = new Tone.Loop((time) => {
          this.metronomeSynth?.triggerAttackRelease("C5", "32n", time);
        }, "4n");
      }
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
        this.channels.get(id)?.player.dispose();
        this.channels.get(id)?.node.dispose();
        this.channels.delete(id);
    }

    return new Promise((resolve, reject) => {
      const player = new Tone.Player({
        url: url,
        loop: false,
        autostart: false,
        onload: () => {
            // Channel Strip Construction
            const eq = new Tone.EQ3(0, 0, 0);
            const panner = new Tone.Panner(0);
            const volume = new Tone.Volume(0);
            const channel = new Tone.Channel({ volume: 0, pan: 0 }).toDestination();

            // Chain: Player -> EQ -> Panner -> Volume -> Channel (Mute/Solo) -> Master
            player.chain(eq, panner, volume, channel);

            this.channels.set(id, { player, eq, panner, volume, node: channel });
            
            // Sync with Transport
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
  }

  getCurrentTime(): number {
    return Tone.Transport.seconds;
  }

  // --- Controls ---

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
    if (this.mic && this.recorder) {
      await this.mic.open();
      // Ensure clean state
      this.mic.disconnect();
      this.mic.connect(this.recorder);
      this.recorder.start();
    }
  }

  async stopRecording(): Promise<string | null> {
    if (this.recorder && this.mic) {
      const recording = await this.recorder.stop();
      this.mic.close();
      return URL.createObjectURL(recording);
    }
    return null;
  }

  async exportMixdown(): Promise<string> {
    const streamDest = Tone.getContext().createMediaStreamDestination();
    this.channels.forEach(ch => ch.node.connect(streamDest));
    
    const mediaRecorder = new MediaRecorder(streamDest.stream);
    const chunks: Blob[] = [];

    return new Promise((resolve) => {
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            resolve(URL.createObjectURL(blob));
        };
        
        // Quick render simulation
        mediaRecorder.start();
        Tone.Transport.seconds = 0;
        this.play();
        setTimeout(() => {
            this.stop();
            mediaRecorder.stop();
        }, 5000); 
    });
  }
}

export const audioService = new AudioService();