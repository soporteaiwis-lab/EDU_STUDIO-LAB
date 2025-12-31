
export enum UserMode {
  EXPLORER = 'EXPLORER',
  MAKER = 'MAKER',
  PRO = 'PRO'
}

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export const APP_INFO = {
  version: '3.0.0 PRO-X',
  creator: 'Armin Wildo Salazar San Martin',
  company: 'AIWIS',
  year: '2025'
};

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface LoopRegion {
  startBar: number; // Start in Bars (1-indexed or 0-indexed depending on logic, let's use 0-indexed internally)
  endBar: number;   // End in Bars
  isActive: boolean;
}

export interface ProjectState {
  bpm: number;
  timeSignature: string; // '4/4'
  isMetronomeOn: boolean;
  transportStatus: 'STOP' | 'PLAY' | 'RECORD';
}

export interface TrackEQ {
  high: number;
  mid: number;
  low: number;
}

export interface TrackEffects {
  reverb: number;
  pitch: number;
  distortion: number;
}

export type InstrumentType = 'DRUMS' | 'GUITAR' | 'BASS' | 'KEYS' | 'VOCAL' | 'WIND' | 'FX' | 'CHORD' | 'MELODY' | 'SAMPLER' | 'UNKNOWN';

export type MidiInstrumentName = 'GRAND_PIANO' | 'SYNTH_STRINGS' | 'ELECTRIC_GUITAR' | 'TRUMPET' | 'BRASS_SECTION' | 'CHURCH_ORGAN' | 'PERCUSSION_KIT' | 'SINE_LEAD';

export interface ChordEvent {
  bar: number;
  name: string;
  duration: number;
}

export interface DrumEvent {
  time: string;
  instrument: 'KICK' | 'SNARE' | 'HIHAT';
}

export interface MelodyEvent {
  note: string;
  duration: string;
  time: string;
}

export interface MidiNote {
  note: string;      // e.g. "C4"
  midi: number;      // e.g. 60
  startTime: number; // Seconds relative to track start
  duration: number;  // Seconds
  velocity: number;  // 0-1
}

export interface Track {
  id: string;
  name: string;
  type: 'AUDIO' | 'MIDI' | 'AI_GENERATED' | 'CHORD' | 'RHYTHM' | 'MELODY' | 'DRUMS' | 'SAMPLER';
  instrument: InstrumentType;
  midiInstrument?: MidiInstrumentName;
  color: string;
  volume: number; // 0-100
  pan: number; // -50 to 50 (Left to Right)
  eq: TrackEQ;
  effects: TrackEffects; 
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  audioUrl?: string; 
  samplerUrl?: string; 
  isSelected?: boolean;
  chordData?: ChordEvent[]; 
  rhythmData?: DrumEvent[];
  melodyData?: MelodyEvent[];
  midiNotes?: MidiNote[]; 
}

export interface SongMetadata {
  lyrics: string;
  script?: string;
  sfxSuggestions?: SFXSuggestion[];
  chords?: GeneratedChords;
  melody?: GeneratedMelody;
  rhythm?: GeneratedRhythm;
  key: string;
  bpm: number;
  timeSignature: [number, number];
  title: string;
  author: string;
}

export interface SFXSuggestion {
  id: string;
  textContext: string;
  soundDescription: string;
  timeOffset?: number;
}

export interface Session {
  id: string;
  name: string;
  lastModified: number;
  bpm: number;
  tracks: Track[];
  metadata?: SongMetadata;
}

export interface GeneratedLyrics {
  title: string;
  content: string;
}

export interface GeneratedChords {
  key: string;
  progression: ChordEvent[];
  melodyHint?: string;
}

export interface GeneratedMelody {
  clef: 'TREBLE' | 'BASS';
  key: string;
  events: MelodyEvent[];
  abc: string;
}

export interface GeneratedRhythm {
  style: string;
  bpm: number;
  events: DrumEvent[];
}

export interface GeneratedSFXList {
  suggestions: SFXSuggestion[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  oa: string;
  deadline: string;
  status: 'PENDING' | 'GRADED' | 'SUBMITTED';
  grade?: number;
}
