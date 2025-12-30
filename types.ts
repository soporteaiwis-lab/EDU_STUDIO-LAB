export enum UserMode {
  EXPLORER = 'EXPLORER', // 7-10 years (Lego blocks, no timeline)
  MAKER = 'MAKER',       // 11-14 years (Colorful, simplified DAW)
  PRO = 'PRO'            // 15+ years (Dark, Cubase-style, full features)
}

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface TrackEQ {
  high: number;
  mid: number;
  low: number;
}

export type InstrumentType = 'DRUMS' | 'GUITAR' | 'BASS' | 'KEYS' | 'VOCAL' | 'WIND' | 'FX' | 'UNKNOWN';

export interface Track {
  id: string;
  name: string;
  type: 'AUDIO' | 'MIDI' | 'AI_GENERATED';
  instrument: InstrumentType;
  color: string;
  volume: number;
  pan: number;
  eq: TrackEQ;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  audioUrl?: string;
  isSelected?: boolean;
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