
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLyrics, GeneratedChords, GeneratedRhythm, GeneratedMelody } from "../types";

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

// --- RHYTHM (DRUMS) ---
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
       const prompt = `Genera un patrón de batería (2 compases) estilo "${style}". 
       Formato Tone.js (Bar:Quarter:Sixteenth) comenzando en 0:0:0 hasta 1:3:0. 
       Instrumentos: KICK, SNARE, HIHAT. 
       JSON: {style, bpm, events:[{time, instrument}]}`;
       
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
            events: [
                {note: "C4", duration: "4n", time: "0:0:0"}, {note: "D4", duration: "4n", time: "0:1:0"},
                {note: "E4", duration: "4n", time: "0:2:0"}, {note: "F4", duration: "4n", time: "0:3:0"},
                {note: "G4", duration: "4n", time: "1:0:0"}, {note: "A4", duration: "4n", time: "1:1:0"},
                {note: "B4", duration: "4n", time: "1:2:0"}, {note: "C5", duration: "4n", time: "1:3:0"}
            ]
        });
    }
    try {
        const prompt = `Genera una melodía simple de 2 compases en escala de ${key}, Clave ${clef}.
        Devuelve formato JSON compatible con Tone.js Part:
        {
          key, clef, abc: "string (notacion abc)",
          events: [{note: "C4", duration: "4n", time: "0:0:0"}, ...]
        }
        Usa tiempos 0:0:0, 0:1:0, etc. Notas dentro de rango C3-C5.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || '{}');
    } catch (e) { return { key, clef, abc: "", events: [] }; }
}