import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLyrics, GeneratedChords, ChordEvent } from "../types";

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export interface DrumPattern {
  name: string;
  bpm: number;
  events: { time: string; instrument: 'KICK' | 'SNARE' | 'HIHAT' }[];
}

// --- LYRICS ---
export const generateLyrics = async (topic: string, complexity: 'kids' | 'teens'): Promise<GeneratedLyrics> => {
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
      return new Promise((resolve) => setTimeout(() => resolve({
          title: `Canción Demo: ${topic}`,
          content: `(Verso 1)\nSin API Key no puedo pensar\nPero una letra puedo inventar\n${topic} es el tema de hoy\nY cantando muy feliz estoy\n\n(Coro)\nModo Offline, Modo Offline\nConecta la Key para que sea online.`
      }), 1500));
  }
  try {
    const prompt = `Escribe letra de canción para ${complexity} sobre: "${topic}". Estructura clara. JSON.`;
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
      return new Promise((resolve) => setTimeout(() => resolve({
          key: key,
          progression: [{bar:1, name:key, duration:1}, {bar:2, name:key === 'C'?'F':'G', duration:1}, {bar:3, name:key, duration:1}, {bar:4, name:key==='C'?'G7':'D7', duration:1}],
          melodyHint: `${key}2 ${key}2 | z4 |`
      }), 1500));
  }
  try {
      const prompt = `Progresión de acordes 8 compases en ${key}, estilo ${mood}. JSON.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { 
                    key: {type: Type.STRING}, 
                    progression: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {bar: {type: Type.INTEGER}, name: {type: Type.STRING}, duration: {type: Type.INTEGER}}}},
                    melodyHint: {type: Type.STRING}
                } 
            } 
        }
      });
      return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
  } catch (e) { return { key: "C", progression: [], melodyHint: "Error" }; }
}

// --- DRUMS ---
export const generateDrumPattern = async (style: string): Promise<DrumPattern> => {
   if (!apiKey || apiKey === 'YOUR_API_KEY') {
       // Mock Pattern
       return new Promise((resolve) => setTimeout(() => resolve({
           name: `Batería ${style} (Demo)`,
           bpm: 120,
           events: [
               {time: "0:0:0", instrument: "KICK"}, {time: "0:1:0", instrument: "HIHAT"},
               {time: "0:2:0", instrument: "SNARE"}, {time: "0:3:0", instrument: "HIHAT"},
               {time: "1:0:0", instrument: "KICK"}, {time: "1:1:0", instrument: "HIHAT"},
               {time: "1:2:0", instrument: "SNARE"}, {time: "1:3:0", instrument: "HIHAT"}
           ]
       }), 2000));
   }

   try {
       const prompt = `Genera un patrón de batería simple de 2 compases para estilo "${style}". 
       Usa formato Tone.js Time (Bar:Quarter:Sixteenth). Instrumentos: KICK, SNARE, HIHAT.
       Responde SOLO JSON con estructura: {name, bpm, events: [{time, instrument}]}.`;
       
       const response = await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: prompt,
           config: { responseMimeType: "application/json" } // Schema is complex for events, letting loose JSON
       });
       return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
   } catch (e) {
       console.error(e);
       return { name: "Error Drums", bpm: 120, events: [] };
   }
}