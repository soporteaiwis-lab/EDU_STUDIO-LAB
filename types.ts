
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
  version: '3.2.0 LMS-CL',
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
  startBar: number;
  endBar: number;
  isActive: boolean;
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

export interface ChordEvent { bar: number; name: string; duration: number; }
export interface DrumEvent { time: string; instrument: 'KICK' | 'SNARE' | 'HIHAT'; }
export interface MelodyEvent { note: string; duration: string; time: string; }

export interface MidiNote {
  note: string;
  midi: number;
  startTime: number;
  duration: number;
  velocity: number;
  label?: string; // New field for Chord Names or Drum labels
}

export interface Track {
  id: string;
  name: string;
  type: 'AUDIO' | 'MIDI' | 'AI_GENERATED' | 'CHORD' | 'RHYTHM' | 'MELODY' | 'DRUMS' | 'SAMPLER';
  instrument: InstrumentType;
  midiInstrument?: MidiInstrumentName;
  color: string;
  volume: number;
  pan: number;
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

export interface SFXSuggestion { id: string; textContext: string; soundDescription: string; timeOffset?: number; }
export interface Session { id: string; name: string; lastModified: number; bpm: number; tracks: Track[]; metadata?: SongMetadata; }

// --- AI GENERATION TYPES ---
export interface GeneratedLyrics { title: string; content: string; }
export interface GeneratedChords { key: string; progression: ChordEvent[]; melodyHint?: string; }
export interface GeneratedMelody { clef: 'TREBLE' | 'BASS'; key: string; events: MelodyEvent[]; abc: string; }
export interface GeneratedRhythm { style: string; bpm: number; events: DrumEvent[]; }
export interface GeneratedSFXList { suggestions: SFXSuggestion[]; }

// --- TEACHER / LMS TYPES (NEW) ---

export interface StudentProfile {
  id: string;
  rut: string;
  name: string;
  email: string;
  instrument?: string;
  avatar?: string;
}

export interface Course {
  id: string;
  name: string; // "1° Medio A"
  level: string; 
  students: StudentProfile[];
  color: string;
}

export interface RubricLevel {
  label: string; // "Excelente", "Bueno"
  points: number; // 4, 3
  description: string;
}

export interface RubricCriterion {
  id: string;
  name: string; // "Pulso"
  weight: number; // Percentage 0-100
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface Evaluation {
  studentId: string;
  assignmentId: string;
  rubricScores: Record<string, number>; // criterionId -> points
  totalScore: number;
  grade: number; // 1.0 - 7.0
  feedback: string;
  status: 'GRADED' | 'PENDING';
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  oa: string; // "OA 03"
  deadline: string;
  status: 'OPEN' | 'CLOSED';
  rubricId?: string;
  evaluations?: Evaluation[];
}
