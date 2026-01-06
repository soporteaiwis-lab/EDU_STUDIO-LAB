
import * as Tone from 'tone';
import { ChordEvent, DrumEvent, MelodyEvent, MidiInstrumentName, MidiNote, AudioDevice } from '../types';

interface ChannelStrip {
  player?: Tone.Player; 
  sampler?: Tone.Player; 
  synth?: Tone.PolySynth; 
  drumSampler?: Tone.Players; 
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
  
  // Callbacks
  public onMidiNoteRecorded: ((trackId: string, note: MidiNote) => void) | null = null;
  public onMidiNoteActive: ((note: number, velocity: number) => void) | null = null;
  public onMidiStatusChange: ((isConnected: boolean, inputs: string[]) => void) | null = null;

  public bpm: number = 120;
  public timeSignature: [number, number] = [4, 4];
  public currentBeat: number = 0;
  private isInitialized: boolean = false;
  private isRecordingMidi: boolean = false;
  private sustainEnabled: boolean = false;
  private metronomeVolumeValue: number = -10; // dB

  // Simple Chord Dictionary for AI translation
  private chordMap: Record<string, number[]> = {
      'C': [60, 64, 67], 'Cm': [60, 63, 67], 'C7': [60, 64, 67, 70],
      'Cmaj7': [60, 64, 67, 71],
      'D': [62, 66, 69], 'Dm': [62, 65, 69], 'D7': [62, 66, 69, 72],
      'E': [64, 68, 71], 'Em': [64, 67, 71], 'E7': [64, 68, 71, 74],
      'F': [65, 69, 72], 'Fm': [65, 68, 72], 'Fmaj7': [65, 69, 72, 76],
      'G': [67, 71, 74], 'Gm': [67, 70, 74], 'G7': [67, 71, 74, 77],
      'A': [69, 73, 76], 'Am': [69, 72, 76], 'Am7': [69, 72, 76, 79],
      'B': [71, 75, 78], 'Bm': [71, 74, 78], 'Bdim': [71, 74, 77],
      'Bb': [58, 62, 65], 'Bbm': [58, 61, 65],
      'Eb': [63, 67, 70], 'Ebm': [63, 66, 70],
      'Ab': [68, 72, 75], 'Abm': [68, 71, 75],
      'Db': [61, 65, 68], 
      'F#': [66, 70, 73], 'Gb': [66, 70, 73]
  };

  constructor() { }

  async initialize() {
    if (Tone.context.state === 'suspended') {
        await Tone.context.resume();
    }
    
    if (this.isInitialized && Tone.context.state === 'running') return;
    await Tone.start();
    
    if (!this.isInitialized) {
        this.metronomeSynth = new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, oscillator: { type: 'sine' } }).toDestination();
        this.metronomeClick = new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination();
        this.setMetronomeVolume(this.metronomeVolumeValue);

        this.previewSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        this.previewSynth.volume.value = -6;

        this.recorder = new Tone.Recorder();
        this.mic = new Tone.UserMedia();
        this.initializeMidi();
        this.isInitialized = true;
    }
  }

  setMetronomeVolume(db: number) {
      this.metronomeVolumeValue = db;
      if (this.metronomeSynth) this.metronomeSynth.volume.value = db;
      if (this.metronomeClick) this.metronomeClick.volume.value = db - 5;
  }

  // --- HELPER: CONVERT AI CHORDS TO MIDI NOTES ---
  convertChordsToMidi(chords: ChordEvent[]): MidiNote[] {
      const midiNotes: MidiNote[] = [];
      const secondsPerBar = (60 / this.bpm) * 4;

      chords.forEach(chord => {
          const cleanName = chord.name.trim(); // American Key Label (e.g., "Am", "G7")
          
          let notes = this.chordMap[cleanName];
          if (!notes) {
              // Simple Fallback logic if dictionary fails
              const root = cleanName.charAt(0);
              const isMinor = cleanName.includes('m');
              const lookup = root + (isMinor ? 'm' : '');
              if (this.chordMap[lookup]) {
                  notes = this.chordMap[lookup];
              } else {
                  notes = [60, 64, 67]; // Default C Major
              }
          }

          const octaveShift = -12; // Shift down for better accompaniment range
          
          // STRICT GRID ALIGNMENT
          // Start exactly at the beginning of the assigned bar
          const startTime = (chord.bar - 1) * secondsPerBar;
          
          // DURATION CALCULATION WITH GAP
          // Calculate strict duration based on bars
          const strictDuration = (chord.duration || 1) * secondsPerBar;
          // Reduce duration slightly (95%) to prevent overlap/crossing ("No sustain")
          const actualDuration = strictDuration * 0.95; 

          notes.forEach((midi, index) => {
              midiNotes.push({
                  note: Tone.Frequency(midi + octaveShift, "midi").toNote(),
                  midi: midi + octaveShift,
                  startTime: startTime,
                  duration: actualDuration,
                  velocity: 0.65,
                  // Assign American Key label ONLY to the root note (index 0) so it's readable
                  label: index === 0 ? cleanName : undefined
              });
          });
      });
      return midiNotes;
  }

  // --- HELPER: CONVERT AI MELODY TO MIDI NOTES ---
  convertMelodyToMidi(events: MelodyEvent[]): MidiNote[] {
      const midiNotes: MidiNote[] = [];
      
      events.forEach(ev => {
          const time = Tone.Time(ev.time).toSeconds();
          const duration = Tone.Time(ev.duration).toSeconds();
          const midi = Tone.Frequency(ev.note).toMidi();
          
          midiNotes.push({
              note: ev.note,
              midi: midi,
              startTime: time,
              duration: duration, // Melody can be more legato
              velocity: 0.9
          });
      });
      return midiNotes;
  }

  // --- HELPER: CONVERT AI RHYTHM TO MIDI NOTES ---
  convertRhythmToMidi(events: DrumEvent[]): MidiNote[] {
      const midiNotes: MidiNote[] = [];
      const drumMap: Record<string, number> = {
          'KICK': 36,
          'SNARE': 38,
          'HIHAT': 42
      };

      const loopCount = 4; // Extend loop for 8 bars usually
      const barDuration = (60 / this.bpm) * 4;

      for (let i = 0; i < loopCount; i++) {
          const offset = i * barDuration * 2; 
          
          events.forEach(ev => {
              const time = Tone.Time(ev.time).toSeconds() + offset;
              const midi = drumMap[ev.instrument] || 42;
              const note = Tone.Frequency(midi, "midi").toNote();
              
              midiNotes.push({
                  note: note,
                  midi: midi,
                  startTime: time,
                  duration: 0.1, 
                  velocity: ev.instrument === 'KICK' ? 1.0 : 0.8,
                  label: ev.instrument
              });
          });
      }
      return midiNotes;
  }

  // --- DEVICE MANAGEMENT ---
  async getAudioInputDevices(): Promise<AudioDevice[]> {
      await this.checkPermissions();
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput').map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Micrófono ${d.deviceId.slice(0,4)}...`,
          kind: d.kind
      }));
  }

  async setAudioInputDevice(deviceId: string) {
      if (!this.mic) this.mic = new Tone.UserMedia();
      try {
          if (this.mic.state === 'started') this.mic.close();
          await this.mic.open({ deviceId: { exact: deviceId } });
          console.log("Input device set to:", deviceId);
      } catch (e) {
          console.error("Error setting input device", e);
      }
  }

  // --- WEB MIDI API ---
  async initializeMidi() {
      if ((navigator as any).requestMIDIAccess) {
          try {
              this.midiAccess = await (navigator as any).requestMIDIAccess();
              this.updateMidiStatus(); 
              const inputs = this.midiAccess.inputs.values();
              for (let input of inputs) {
                  input.onmidimessage = this.handleMidiMessage.bind(this);
              }
              this.midiAccess.onstatechange = (e: any) => {
                  console.log("MIDI Device Change:", e.port.state);
                  this.updateMidiStatus();
              };
          } catch (e) {
              console.warn("MIDI Access Failed", e);
          }
      }
  }

  updateMidiStatus() {
      if (!this.midiAccess) return;
      const inputs = Array.from(this.midiAccess.inputs.values());
      const isConnected = inputs.length > 0;
      const inputNames = inputs.map((i: any) => i.name);
      if (this.onMidiStatusChange) {
          this.onMidiStatusChange(isConnected, inputNames);
      }
  }

  handleMidiMessage(message: any) {
      const [command, note, velocity] = message.data;
      const cmd = command >> 4;
      if (cmd === 9 && velocity > 0) {
          this.triggerMidiNoteOn(note, velocity / 127);
      } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
          this.triggerMidiNoteOff(note);
      }
  }

  setActiveMidiTrack(trackId: string | null) { this.activeMidiTrackId = trackId; }
  setMidiRecordingState(isRecording: boolean) { this.isRecordingMidi = isRecording; if (!isRecording) this.activeNotes.clear(); }
  setSustain(enabled: boolean) { this.sustainEnabled = enabled; }

  async triggerMidiNoteOn(midiVal: number, velocity: number) {
      if (Tone.context.state !== 'running') await this.initialize();

      const noteName = Tone.Frequency(midiVal, "midi").toNote();
      if (this.onMidiNoteActive) this.onMidiNoteActive(midiVal, velocity);
      
      const now = Tone.now();
      let played = false;
      
      const activeTrack = this.activeMidiTrackId ? this.channels.get(this.activeMidiTrackId) : null;
      
      if (activeTrack) {
          if (activeTrack.type === 'DRUMS' && activeTrack.drumSampler) {
              let sample = "HIHAT";
              if (midiVal === 36) sample = "KICK";
              if (midiVal === 38 || midiVal === 40) sample = "SNARE";
              if (midiVal >= 42) sample = "HIHAT";
              
              if (activeTrack.drumSampler.has(sample)) {
                  activeTrack.drumSampler.player(sample).start(now);
                  played = true;
              }
          } else if (activeTrack.synth) {
              activeTrack.synth.triggerAttack(noteName, now, velocity);
              played = true;
          }
      } 
      
      if (!played) {
          this.previewSynth?.triggerAttack(noteName, now, velocity);
      }

      if (this.isRecordingMidi && this.activeMidiTrackId) {
          this.activeNotes.set(midiVal, { startTime: Tone.Transport.seconds, velocity: velocity });
      }
  }

  triggerMidiNoteOff(midiVal: number) {
      const noteName = Tone.Frequency(midiVal, "midi").toNote();
      if (this.onMidiNoteActive) this.onMidiNoteActive(midiVal, 0);
      const now = Tone.now();
      
      const useTrackSynth = this.activeMidiTrackId && this.channels.get(this.activeMidiTrackId)?.synth;

      if (!this.sustainEnabled) {
        if (useTrackSynth) {
            const ch = this.channels.get(this.activeMidiTrackId!);
            ch?.synth?.triggerRelease(noteName, now);
        } else {
            this.previewSynth?.triggerRelease(noteName, now);
        }
      } else {
          if (useTrackSynth) {
              const ch = this.channels.get(this.activeMidiTrackId!);
              ch?.synth?.triggerRelease(noteName, now + 1); 
          }
      }

      if (this.isRecordingMidi && this.activeMidiTrackId && this.activeNotes.has(midiVal)) {
          const startData = this.activeNotes.get(midiVal)!;
          const duration = Tone.Transport.seconds - startData.startTime;
          if (duration > 0.05) { 
              const midiNote: MidiNote = {
                  midi: midiVal, note: noteName,
                  startTime: startData.startTime, duration: duration, velocity: startData.velocity
              };
              if (this.onMidiNoteRecorded) this.onMidiNoteRecorded(this.activeMidiTrackId, midiNote);
          }
          this.activeNotes.delete(midiVal);
      }
  }

  // --- WAVEFORM ---
  getWaveformPath(id: string, width: number, height: number): string {
    const channel = this.channels.get(id);
    const player = channel?.player || channel?.sampler;
    if (!channel || !player || !(player as any).loaded) return "";
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
          if(min < -1) min = -1; if(max > 1) max = 1;
          path += `L ${i} ${(1 + min) * amp} `;
          path += `L ${i} ${(1 + max) * amp} `;
        }
        return path;
    } catch (e) { return ""; }
  }

  // --- TRANSPORT ---
  setVolume(id: string, value: number) { const ch = this.channels.get(id); if (ch) ch.node.volume.rampTo(value <= 0 ? -Infinity : Tone.gainToDb(value / 100), 0.1); }
  setPan(id: string, value: number) { const normalized = value / 50; const ch = this.channels.get(id); if(ch) ch.panner.pan.rampTo(normalized, 0.1); }
  setBpm(bpm: number) { this.bpm = bpm; Tone.Transport.bpm.value = bpm; }
  
  setTimeSignature(numerator: number, denominator: number) {
      this.timeSignature = [numerator, denominator];
      Tone.Transport.timeSignature = [numerator, denominator];
      if(this.metronomeLoop && this.metronomeLoop.state === 'started') {
          this.toggleMetronome(true);
      }
  }

  toggleMetronome(enabled: boolean) {
      if (this.metronomeLoop) { this.metronomeLoop.stop(); this.metronomeLoop.dispose(); }
      
      if (enabled) {
          const numerator = this.timeSignature[0];
          const subdivision = this.timeSignature[1] === 8 ? '8n' : '4n';

          let counter = 0;
          this.metronomeLoop = new Tone.Loop((time) => {
              if (counter % numerator === 0) {
                  this.metronomeClick?.triggerAttackRelease("C6", "32n", time);
              } else {
                  this.metronomeSynth?.triggerAttackRelease("C5", "32n", time);
              }
              counter++;
          }, subdivision); 
          this.metronomeLoop.start(0);
      }
  }

  rewind(seconds: number) { this.setTime(Math.max(0, Tone.Transport.seconds - seconds)); }
  seekToStart() { this.setTime(0); }
  setTime(seconds: number) { Tone.Transport.seconds = seconds; this.currentBeat = 0; }
  previewNote(note: string) { 
      if (!this.isInitialized) this.initialize(); 
      this.previewSynth?.triggerAttackRelease(note, "8n"); 
  }
  previewChord(chordName: string) { 
      if (!this.isInitialized) this.initialize(); 
      const cleanName = chordName.trim();
      let notes = this.chordMap[cleanName] || [60, 64, 67];
      const freqs = notes.map(m => Tone.Frequency(m, "midi").toNote());
      this.previewSynth?.triggerAttackRelease(freqs, "4n"); 
  }

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
        const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.3 }, maxPolyphony: 32 });
        buildChain(synth);
        this.channels.set(id, { synth, eq, panner, volume, reverb, pitchShift, node: channel, type: 'INSTRUMENT' });
    } else if (type === 'DRUMS') {
        const players = new Tone.Players({ KICK: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3", SNARE: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3", HIHAT: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3" }).toDestination();
        buildChain(players);
        this.channels.set(id, { drumSampler: players, eq, panner, volume, reverb, pitchShift, node: channel, type: 'DRUMS' });
    } else if (type === 'SAMPLER') {
        const player = new Tone.Player({
            url: urlOrType,
            loop: false,
            autostart: false,
            onload: () => console.log(`Sampler loaded for ${id}`)
        }).toDestination();
        buildChain(player);
        this.channels.set(id, { sampler: player, eq, panner, volume, reverb, pitchShift, node: channel, type: 'SAMPLER' });
    } else {
        const player = new Tone.Player({
            url: urlOrType,
            loop: false,
            autostart: false,
            onload: () => {
                player.sync().start(0);
                console.log(`Audio loaded for ${id}`);
            }
        }).toDestination();
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
  scheduleMidi(trackId: string, notes: MidiNote[]) {
      const ch = this.channels.get(trackId);
      if (!ch) return;
      
      if (this.activeParts.has(trackId)) { 
          this.activeParts.get(trackId)?.dispose(); 
          this.activeParts.delete(trackId); 
      }
      
      const events = notes.map(n => ({ time: n.startTime, note: n.note, duration: n.duration, velocity: n.velocity, midi: n.midi }));
      
      const part = new Tone.Part((time, value) => { 
          if (ch.type === 'DRUMS' && ch.drumSampler) {
              let sample = "HIHAT";
              if (value.midi === 36) sample = "KICK";
              if (value.midi === 38) sample = "SNARE";
              if (ch.drumSampler.has(sample)) {
                  ch.drumSampler.player(sample).start(time);
              }
          } else if (ch.synth) {
              ch.synth.triggerAttackRelease(value.note, value.duration, time, value.velocity); 
          }
      }, events).start(0);
      
      this.activeParts.set(trackId, part);
  }
  scheduleChords(trackId: string, chords: ChordEvent[]) {}
  scheduleDrums(trackId: string, events: DrumEvent[]) {}
  scheduleMelody(trackId: string, events: MelodyEvent[]) {}
  
  play() { if (Tone.context.state !== 'running') Tone.context.resume(); Tone.Transport.start(); }
  pause() { Tone.Transport.pause(); }
  stop() { Tone.Transport.stop(); Tone.Transport.seconds = 0; this.currentBeat = 0; this.activeNotes.clear(); }
  getCurrentTime() { return Tone.Transport.seconds; }
  setReverb(id: string, val: number) { const c=this.channels.get(id); if(c) c.reverb.wet.value=val; }
  setPitch(id: string, val: number) { const c=this.channels.get(id); if(c) c.pitchShift.pitch=val; }
  setEQ(id: string, l:number, m:number, h:number) { const c=this.channels.get(id); if(c) { c.eq.low.value=l; c.eq.mid.value=m; c.eq.high.value=h; } }
  toggleMute(id: string, m: boolean) { const c=this.channels.get(id); if(c) c.node.mute=m; }
  toggleSolo(id: string, s: boolean) { const c=this.channels.get(id); if(c) c.node.solo=s; }
  
  updateInstrumentPreset(trackId: string, instrument: MidiInstrumentName) {
      const ch = this.channels.get(trackId);
      if (!ch || !ch.synth) return;
      const synth = ch.synth;
      synth.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } });
      switch (instrument) {
          case 'GRAND_PIANO': synth.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 1.2 } }); break;
          case 'SYNTH_STRINGS': synth.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 2.5 } }); break;
          case 'ELECTRIC_GUITAR': synth.set({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 } }); break;
          case 'CHURCH_ORGAN': synth.set({ oscillator: { type: "sine" }, envelope: { attack: 0.2, decay: 0.0, sustain: 1.0, release: 1.0 } }); break;
          case 'BRASS_SECTION': synth.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.5 } }); break;
          case 'SINE_LEAD': synth.set({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.1 } }); break;
          case 'PERCUSSION_KIT': synth.set({ oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } }); break;
          default: break;
      }
  }

  async checkPermissions(): Promise<boolean> {
      try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop()); return true; } catch (err) { return false; }
  }
  async startRecording() { await this.initialize(); if(this.mic && this.recorder) { try { await this.mic.open(); this.mic.connect(this.recorder); this.recorder.start(); } catch(e){} } }
  async stopRecording() { if(this.recorder && this.mic && this.recorder.state === 'started') { const r = await this.recorder.stop(); this.mic.close(); return URL.createObjectURL(r); } return null; }
}

export const audioService = new AudioService();
