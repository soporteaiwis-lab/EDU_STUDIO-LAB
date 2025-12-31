import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLyrics, GeneratedChords, GeneratedRhythm, GeneratedMelody, GeneratedSFXList, Track } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const mockDelay = <T>(data: T): Promise<T> => new Promise(res => setTimeout(() => res(data), 1500));

// --- LYRICS ---
export const generateLyrics = async (topic: string, complexity: 'kids' | 'teens'): Promise<GeneratedLyrics> => {
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
      return mockDelay({
          title: `Canción sobre ${topic}`,
          content: `(Verso 1)\nLa IA está desconectada\nPero la música no para\nImagina que aquí hay letra\nSobre ${topic} en tu libreta\n\n(Coro)\nConecta la API Key\nPara que yo sea el rey.`
      });
  }
  try {
    const prompt = `Escribe letra para canción ${complexity} sobre "${topic}". Estructura verso/coro. JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, content: {type: Type.STRING} } } }
    });
    return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
  } catch (e) { return { title: "Error", content: "Error de conexión." }; }
};

// --- CHORDS ---
export const generateProgression = async (key: string, mood: string): Promise<GeneratedChords> => {
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
      return mockDelay({
          key: key,
          progression: [{bar:1, name:key, duration:1}, {bar:2, name:key==='C'?'Am':'Em', duration:1}, {bar:3, name:'F', duration:1}, {bar:4, name:'G', duration:1}],
          melodyHint: "C E G A | G F E D | C"
      });
  }
  try {
      const prompt = `Progresión de acordes 8 compases en ${key}, estilo ${mood}. JSON {key, progression:[{bar, name, duration}], melodyHint: "string with ABC notation suggestion"}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
  } catch (e) { return { key: "C", progression: [] }; }
}

// --- RHYTHM ---
export const generateRhythm = async (style: string): Promise<GeneratedRhythm> => {
   if (!apiKey || apiKey === 'YOUR_API_KEY') {
       return mockDelay({
           style, bpm: 120,
           events: [
               {time: "0:0:0", instrument: "KICK"}, {time: "0:1:0", instrument: "HIHAT"},
               {time: "0:2:0", instrument: "SNARE"}, {time: "0:3:0", instrument: "HIHAT"},
               {time: "1:0:0", instrument: "KICK"}, {time: "1:1:0", instrument: "HIHAT"},
               {time: "1:2:0", instrument: "SNARE"}, {time: "1:3:0", instrument: "HIHAT"}
           ]
       });
   }
   try {
       const prompt = `Genera un patrón de batería (2 compases) estilo "${style}". JSON: {style, bpm, events:[{time, instrument}]}`;
       const response = await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: prompt,
           config: { responseMimeType: "application/json" }
       });
       return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
   } catch (e) { return { style, bpm: 120, events: [] }; }
}

// --- MELODY ---
export const generateMelody = async (key: string, clef: 'TREBLE' | 'BASS'): Promise<GeneratedMelody> => {
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
        return mockDelay({
            key, clef,
            abc: "C D E F | G A B c | c B A G | F E D C |",
            events: [{note: "C4", duration: "4n", time: "0:0:0"}, {note: "G4", duration: "4n", time: "1:0:0"}]
        });
    }
    try {
        const prompt = `Genera melodía 2 compases en ${key}, Clave ${clef}. JSON {key, clef, abc, events:[{note, duration, time}]}.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
    } catch (e) { return { key, clef, abc: "", events: [] }; }
}

// --- SFX SCRIPT ANALYSIS ---
export const analyzeScriptForSFX = async (scriptText: string): Promise<GeneratedSFXList> => {
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
        return mockDelay({
            suggestions: [
                { id: '1', textContext: 'Se abre la puerta', soundDescription: 'Puerta de madera rechinando' },
                { id: '2', textContext: 'cae un rayo', soundDescription: 'Trueno fuerte y estruendoso' }
            ]
        });
    }
    try {
        const prompt = `Analiza este guion y sugiere efectos de sonido (SFX). 
        Texto: "${scriptText}".
        Devuelve JSON: { suggestions: [{ id, textContext, soundDescription }] }.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
    } catch (e) { return { suggestions: [] }; }
}

// --- AI PRODUCER (NEW INTEGRATION) ---
export interface ProducerAdvice {
    message: string;
    actionLabel?: string;
    actionType?: 'ADD_DRUMS' | 'FIX_MIX' | 'ADD_CHORDS' | 'NONE';
}

export const getProducerAdvice = async (tracks: Track[], bpm: number): Promise<ProducerAdvice> => {
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
        const hasDrums = tracks.some(t => t.type === 'DRUMS' || t.type === 'RHYTHM');
        if (!hasDrums) return mockDelay({ message: "¡Tu canción necesita ritmo! ¿Quieres que genere una batería básica para empezar?", actionLabel: "Generar Batería", actionType: "ADD_DRUMS" });
        return mockDelay({ message: "El proyecto va tomando forma. Revisa los volúmenes, la batería parece un poco fuerte.", actionLabel: "Ajustar Niveles", actionType: "FIX_MIX" });
    }

    // Prepare context for Gemini
    const projectContext = tracks.map(t => `${t.name} (${t.type}, Vol:${t.volume})`).join(', ');
    const prompt = `Actúa como un Productor Musical Junior amigable para niños. Analiza este proyecto: BPM ${bpm}. Pistas: [${projectContext}]. 
    Dame 1 consejo corto y divertido. Si falta batería, sugierela. Si hay muchas pistas, sugiere mezclar. 
    Devuelve JSON: { message: "consejo", actionLabel: "texto boton corto", actionType: "ADD_DRUMS" | "ADD_CHORDS" | "FIX_MIX" | "NONE" }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
    } catch (e) {
        return { message: "¡Sigue creando! Tu música suena interesante.", actionType: 'NONE' };
    }
}