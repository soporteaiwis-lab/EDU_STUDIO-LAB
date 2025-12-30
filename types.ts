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
  version: '1.3',
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
  reverb: number;
  pitch: number;
  distortion: number;
}

export type InstrumentType = 'DRUMS' | 'GUITAR' | 'BASS' | 'KEYS' | 'VOCAL' | 'WIND' | 'FX' | 'CHORD' | 'MELODY' | 'UNKNOWN';

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

// NEW: Stores the creative "DNA" of the song for the Songbook
export interface SongMetadata {
  lyrics: string;
  chords?: GeneratedChords;
  melody?: GeneratedMelody;
  rhythm?: GeneratedRhythm;
  key: string;
  bpm: number;
  title: string;
  author: string;
}

export interface MetronomeConfig {
  enabled: boolean;
  bpm: number;
  timeSignature: [number, number];
  countIn: boolean;
  clickSound: 'BEEP' | 'WOODBLOCK' | 'COWBELL';
  volume: number;
}

export interface Session {
  id: string;
  name: string;
  lastModified: number;
  bpm: number;
  tracks: Track[];
  metadata?: SongMetadata; // Added metadata persistence
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