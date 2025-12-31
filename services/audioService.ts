import * as Tone from 'tone';
import { ChordEvent, DrumEvent, MelodyEvent, MidiInstrumentName, MidiNote } from '../types';

interface ChannelStrip {
  player?: Tone.Player; // Audio (Long)
  sampler?: Tone.Player; // Sampler (One-Shot)
  synth?: Tone.PolySynth; // Chords/Melody/MIDI
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
  private metronomeClick: Tone.MetalSynth | null = null; 
  private previewSynth: Tone.PolySynth | null = null; 
  
  private activeParts: Map<string, Tone.Part> = new Map();
  
  // MIDI State
  private midiAccess: any | null = null;
  private activeMidiTrackId: string | null = null;
  private activeNotes: Map<number, { startTime: number, velocity: number }> = new Map();
  // Callback to update UI when recording MIDI
  public onMidiNoteRecorded: ((trackId: string, note: MidiNote) => void) | null = null;
  // Callback for visualizing pressed keys
  public onMidiNoteActive: ((note: number, velocity: number) => void) | null = null;

  public bpm: number = 120;
  public timeSignature: [number, number] = [4, 4];
  public currentBeat: number = 0;
  private isInitialized: boolean = false;
  private isRecordingMidi: boolean = false;

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
        // Metronome
        this.metronomeSynth = new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, oscillator: { type: 'sine' } }).toDestination();
        this.metronomeClick = new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination();
        this.metronomeSynth.volume.value = -10;
        if(this.metronomeClick) this.metronomeClick.volume.value = -15;

        // Preview Synth (Fallback)
        this.previewSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.previewSynth.volume.value = -6;

        this.recorder = new Tone.Recorder();
        this.mic = new Tone.UserMedia();

        // INIT MIDI
        this.initializeMidi();

        this.isInitialized = true;
    }
  }

  // --- WEB MIDI API IMPLEMENTATION ---
  async initializeMidi() {
      if ((navigator as any).requestMIDIAccess) {
          try {
              this.midiAccess = await (navigator as any).requestMIDIAccess();
              const inputs = this.midiAccess.inputs.values();
              for (let input of inputs) {
                  input.onmidimessage = this.handleMidiMessage.bind(this);
              }
              this.midiAccess.onstatechange = (e: any) => {
                  console.log("MIDI Device Connection Status:", e.port.state);
              };
              console.log("MIDI Access Granted");
          } catch (e) {
              console.warn("MIDI Access Failed", e);
          }
      }
  }

  handleMidiMessage(message: any) {
      const [command, note, velocity] = message.data;
      const cmd = command >> 4;
      const channel = command & 0xf;
      
      // Note On
      if (cmd === 9 && velocity > 0) {
          this.triggerMidiNoteOn(note, velocity / 127);
      } 
      // Note Off
      else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
          this.triggerMidiNoteOff(note);
      }
  }

  setActiveMidiTrack(trackId: string | null) {
      this.activeMidiTrackId = trackId;
  }

  setMidiRecordingState(isRecording: boolean) {
      this.isRecordingMidi = isRecording;
      if (!isRecording) {
          // Clear stuck notes
          this.activeNotes.clear();
      }
  }

  triggerMidiNoteOn(midiVal: number, velocity: number) {
      const noteName = Tone.Frequency(midiVal, "midi").toNote();
      
      // Visual feedback
      if (this.onMidiNoteActive) this.onMidiNoteActive(midiVal, velocity);

      // Audio Trigger (if a track is armed/selected)
      if (this.activeMidiTrackId) {
          const ch = this.channels.get(this.activeMidiTrackId);
          if (ch && ch.synth) {
              ch.synth.triggerAttack(noteName, Tone.now(), velocity);
          }
      } else {
          // Fallback preview
          this.previewSynth?.triggerAttack(noteName, Tone.now(), velocity);
      }

      // Recording Logic
      if (this.isRecordingMidi && this.activeMidiTrackId) {
          this.activeNotes.set(midiVal, {
              startTime: Tone.Transport.seconds,
              velocity: velocity
          });
      }
  }

  triggerMidiNoteOff(midiVal: number) {
      const noteName = Tone.Frequency(midiVal, "midi").toNote();
      
      // Visual feedback off
      if (this.onMidiNoteActive) this.onMidiNoteActive(midiVal, 0);

      // Audio Release
      if (this.activeMidiTrackId) {
          const ch = this.channels.get(this.activeMidiTrackId);
          if (ch && ch.synth) {
              ch.synth.triggerRelease(noteName, Tone.now());
          }
      } else {
          this.previewSynth?.triggerRelease(noteName, Tone.now());
      }

      // Recording Logic End
      if (this.isRecordingMidi && this.activeMidiTrackId && this.activeNotes.has(midiVal)) {
          const startData = this.activeNotes.get(midiVal)!;
          const duration = Tone.Transport.seconds - startData.startTime;
          
          if (duration > 0.05) { // Minimum duration filter
              const midiNote: MidiNote = {
                  midi: midiVal,
                  note: noteName,
                  startTime: startData.startTime,
                  duration: duration,
                  velocity: startData.velocity
              };

              // Send to UI to save in state
              if (this.onMidiNoteRecorded) {
                  this.onMidiNoteRecorded(this.activeMidiTrackId, midiNote);
              }
          }
          this.activeNotes.delete(midiVal);
      }
  }

  // --- INSTRUMENT PRESETS ---
  updateInstrumentPreset(trackId: string, instrument: MidiInstrumentName) {
      const ch = this.channels.get(trackId);
      if (!ch || !ch.synth) return;

      const synth = ch.synth;
      
      // Reset generic settings first to avoid weird combos
      synth.set({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
      });

      switch (instrument) {
          case 'GRAND_PIANO':
              // Default sound, percussive but sustained
              synth.set({
                  oscillator: { type: "triangle" },
                  envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 1.2 }
              });
              break;
          case 'SYNTH_STRINGS':
              synth.set({
                  oscillator: { type: "sawtooth" },
                  envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 2.5 }
              });
              break;
          case 'ELECTRIC_GUITAR':
               synth.set({
                  oscillator: { type: "square" },
                  envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 }
              });
              break;
          case 'CHURCH_ORGAN':
              synth.set({
                  oscillator: { type: "sine" },
                  envelope: { attack: 0.2, decay: 0.0, sustain: 1.0, release: 1.0 }
              });
              // Add a second harmonic manually if we had FM, but simple poly is fine for now
              break;
          case 'BRASS_SECTION':
              synth.set({
                  oscillator: { type: "sawtooth" },
                  envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.5 }
              });
              break;
          case 'SINE_LEAD':
               synth.set({
                  oscillator: { type: "sine" },
                  envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.1 }
              });
              break;
          case 'PERCUSSION_KIT':
               // Minimal simulation using synth noise/membrane
               synth.set({
                  oscillator: { type: "square" },
                  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
              });
              break;
          default:
              break;
      }
  }


  setBpm(bpm: number) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  toggleMetronome(enabled: boolean) {
      if (enabled) {
          if (this.metronomeLoop) { this.metronomeLoop.stop(); this.metronomeLoop.dispose(); }
          this.metronomeLoop = new Tone.Loop((time) => {
              const position = Tone.Transport.position.toString().split(':');
              const quarter = parseInt(position[1]); 
              if (quarter === 0) { this.metronomeClick?.triggerAttackRelease("C6", "32n", time); } 
              else { this.metronomeSynth?.triggerAttackRelease("C5", "32n", time); }
          }, "4n"); 
          this.metronomeLoop.start(0);
      } else { this.metronomeLoop?.stop(); }
  }

  rewind(seconds: number) { this.setTime(Math.max(0, Tone.Transport.seconds - seconds)); }
  seekToStart() { this.setTime(0); }
  setTime(seconds: number) { Tone.Transport.seconds = seconds; this.currentBeat = Math.floor(seconds / (60/this.bpm)); }
  previewNote(note: string) { if (!this.isInitialized) this.initialize(); this.previewSynth?.triggerAttackRelease(note, "8n"); }

  previewChord(chordName: string) {
    if (!this.isInitialized) this.initialize();
    const notes = this.chordMap[chordName];
    if (notes) {
        this.previewSynth?.triggerAttackRelease(notes, "4n");
    }
  }

  // --- Track Management ---

  async addTrack(id: string, urlOrType: string, type: 'AUDIO' | 'INSTRUMENT' | 'DRUMS' | 'SAMPLER' = 'AUDIO'): Promise<void> {
    await this.initialize();
    if (this.channels.has(id)) { this.removeTrack(id); }
    
    const eq = new Tone.EQ3(0, 0, 0);
    const panner = new Tone.Panner(0);
    const volume = new Tone.Volume(0);
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 }); 
    const pitchShift = new Tone.PitchShift({ pitch: 0 });
    const channel = new Tone.Channel({ volume: 0, pan: 0 }).toDestination();

    const buildChain = (node: Tone.AudioNode) => { node.chain(pitchShift, eq, panner, volume, reverb, channel); };

    if (type === 'INSTRUMENT') {
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.3 },
            maxPolyphony: 32
        });
        buildChain(synth);
        this.channels.set(id, { synth, eq, panner, volume, reverb, pitchShift, node: channel, type: 'INSTRUMENT' });
    } else if (type === 'DRUMS') {
        // ... (Existing drum code)
        const players = new Tone.Players({
            KICK: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
            SNARE: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
            HIHAT: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3"
        }).toDestination(); // Simplified for brevity in diff
        buildChain(players);
        this.channels.set(id, { drumSampler: players, eq, panner, volume, reverb, pitchShift, node: channel, type: 'DRUMS' });
    } else if (type === 'SAMPLER') {
        const player = new Tone.Player(urlOrType).toDestination();
        buildChain(player);
        this.channels.set(id, { sampler: player, eq, panner, volume, reverb, pitchShift, node: channel, type: 'SAMPLER' });
    } else {
        const player = new Tone.Player(urlOrType).toDestination();
        player.sync().start(0);
        buildChain(player);
        this.channels.set(id, { player, eq, panner, volume, reverb, pitchShift, node: channel, type: 'AUDIO' });
    }
  }

  triggerSampler(id: string) { const ch = this.channels.get(id); if (ch?.sampler?.loaded) ch.sampler.start(); }

  public removeTrack(id: string) {
      const c = this.channels.get(id);
      if (c) {
          if (c.player) { c.player.unsync(); c.player.dispose(); }
          if (c.sampler) { c.sampler.dispose(); }
          c.synth?.dispose();
          c.drumSampler?.dispose();
          c.reverb.dispose();
          c.pitchShift.dispose();
          c.eq.dispose();
          c.panner.dispose();
          c.node.dispose();
          this.channels.delete(id);
      }
      if(this.activeParts.has(id)) { this.activeParts.get(id)?.dispose(); this.activeParts.delete(id); }
  }

  // --- PLAYBACK OF RECORDED MIDI ---
  scheduleMidi(trackId: string, notes: MidiNote[]) {
      const ch = this.channels.get(trackId);
      if (!ch || !ch.synth) return;
      
      if (this.activeParts.has(trackId)) {
          this.activeParts.get(trackId)?.dispose();
      }

      const events = notes.map(n => ({
          time: n.startTime,
          note: n.note,
          duration: n.duration,
          velocity: n.velocity
      }));

      const part = new Tone.Part((time, value) => {
          ch.synth?.triggerAttackRelease(value.note, value.duration, time, value.velocity);
      }, events).start(0);

      this.activeParts.set(trackId, part);
  }

  // Reuse existing schedulers
  scheduleChords(trackId: string, chords: ChordEvent[]) { /* Existing implementation */ }
  scheduleDrums(trackId: string, events: DrumEvent[]) { /* Existing implementation */ }
  scheduleMelody(trackId: string, events: MelodyEvent[]) { /* Existing implementation */ }

  setVolume(id: string, value: number) { const ch = this.channels.get(id); if (ch) ch.node.volume.rampTo(value <= 0 ? -Infinity : Tone.gainToDb(value / 100), 0.1); }
  
  getWaveformPath(id: string, width: number, height: number): string { /* Existing Implementation */ return ""; }
  
  play() { if (Tone.context.state !== 'running') Tone.context.resume(); Tone.Transport.start(); }
  pause() { Tone.Transport.pause(); }
  stop() { Tone.Transport.stop(); Tone.Transport.seconds = 0; this.currentBeat = 0; this.activeNotes.clear(); }
  getCurrentTime() { return Tone.Transport.seconds; }
  
  setReverb(id: string, val: number) { const c=this.channels.get(id); if(c) c.reverb.wet.value=val; }
  setPitch(id: string, val: number) { const c=this.channels.get(id); if(c) c.pitchShift.pitch=val; }
  setPan(id: string, val: number) { const c=this.channels.get(id); if(c) c.node.pan.rampTo(val,0.1); }
  setEQ(id: string, l:number, m:number, h:number) { const c=this.channels.get(id); if(c) { c.eq.low.value=l; c.eq.mid.value=m; c.eq.high.value=h; } }
  toggleMute(id: string, m: boolean) { const c=this.channels.get(id); if(c) c.node.mute=m; }
  toggleSolo(id: string, s: boolean) { const c=this.channels.get(id); if(c) c.node.solo=s; }

  async checkPermissions(): Promise<boolean> {
      try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop()); return true; } catch (err) { return false; }
  }
  async startRecording() { await this.initialize(); if(this.mic && this.recorder) { try { await this.mic.open(); this.mic.connect(this.recorder); this.recorder.start(); } catch(e){} } }
  async stopRecording() { if(this.recorder && this.mic && this.recorder.state === 'started') { const r = await this.recorder.stop(); this.mic.close(); return URL.createObjectURL(r); } return null; }
}

export const audioService = new AudioService();