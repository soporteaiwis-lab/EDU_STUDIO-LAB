
export enum UserMode {
  EXPLORER = 'EXPLORER', // 7-10 years (Lego blocks, no timeline)
  MAKER = 'MAKER',       // 11-14 years (Colorful, simplified DAW)
  PRO = 'PRO'            // 15+ years (Dark, Cubase-style, full features)
}

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export const APP_INFO = {
  version: '1.2',
  creator: 'Armin Wildo Salazar San Martin',
  company: 'AIWIS',
  year: '2025'
};

export interface TrackEQ {
  high: number;
  mid: number;
  low: number;
}

export interface TrackEffects {
  reverb: number; // 0 to 1 (wet/dry)
  pitch: number;  // -12 to +12 semitones
  distortion: number; // 0 to 1
}

export type InstrumentType = 'DRUMS' | 'GUITAR' | 'BASS' | 'KEYS' | 'VOCAL' | 'WIND' | 'FX' | 'CHORD' | 'MELODY' | 'UNKNOWN';

export interface ChordEvent {
  bar: number; // Bar number (1-based)
  name: string; // e.g., "Cmaj7"
  duration: number; // in bars
}

export interface DrumEvent {
  time: string; // "0:0:0"
  instrument: 'KICK' | 'SNARE' | 'HIHAT';
}

export interface MelodyEvent {
  note: string; // "C4"
  duration: string; // "4n"
  time: string; // "0:0:0"
}

export interface Track {
  id: string;
  name: string;
  type: 'AUDIO' | 'MIDI' | 'AI_GENERATED' | 'CHORD' | 'RHYTHM' | 'MELODY' | 'DRUMS';
  instrument: InstrumentType;
  color: string;
  volume: number;
  pan: number;
  eq: TrackEQ;
  effects: TrackEffects; 
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  audioUrl?: string;
  isSelected?: boolean;
  chordData?: ChordEvent[]; 
  rhythmData?: DrumEvent[];
  melodyData?: MelodyEvent[];
}

export interface MetronomeConfig {
  enabled: boolean;
  bpm: number;
  timeSignature: [number, number]; // e.g., [4, 4]
  countIn: boolean;
  clickSound: 'BEEP' | 'WOODBLOCK' | 'COWBELL';
  volume: number;
}

export interface ExportConfig {
  format: 'WAV' | 'MP3';
  quality: '128k' | '320k' | '16bit' | '24bit';
  range: 'ENTIRE_PROJECT' | 'LOOP_REGION';
}

export interface Session {
  id: string;
  name: string;
  lastModified: number;
  bpm: number;
  tracks: Track[];
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

export enum EffectType {
  NONE = 'NONE',
  REVERB_BATHROOM = 'REVERB_BATHROOM',
  REVERB_STADIUM = 'REVERB_STADIUM',
  ROBOT = 'ROBOT',
  CHIPMUNK = 'CHIPMUNK'
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