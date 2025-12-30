import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLyrics, GeneratedChords, ChordEvent } from "../types";

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

// --- LYRICS GENERATION ---
export const generateLyrics = async (topic: string, complexity: 'kids' | 'teens'): Promise<GeneratedLyrics> => {
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
      console.warn("Gemini API Key missing (Lyrics).");
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  title: `Canción sobre ${topic} (Demo)`,
                  content: `(Verso 1)\nAquí estamos cantando sobre ${topic}\nEs algo muy divertido y tópico\nLa música suena sin parar\nY todos nos ponemos a bailar\n\n(Coro)\n${topic}, ${topic}, qué genial\nEs el tema de nuestro festival\n\n[NOTA: API Key no encontrada, respuesta simulada]`
              });
          }, 1500);
      });
  }

  try {
    const prompt = complexity === 'kids' 
      ? `Escribe una letra de canción para niños pequeños sobre: "${topic}". Estructura AABB. IMPORTANTE: Responde SOLO JSON.`
      : `Escribe una letra urbana/pop para adolescentes sobre: "${topic}". Estructura Verso/Coro. IMPORTANTE: Responde SOLO JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as GeneratedLyrics;

  } catch (error) {
    console.error("Gemini Error:", error);
    return { title: "Error", content: "No pude conectar con la IA." };
  }
};

// --- CHORDS GENERATION ---
export const generateProgression = async (key: string, mood: string): Promise<GeneratedChords> => {
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
      console.warn("Gemini API Key missing (Chords).");
      return new Promise((resolve) => {
          setTimeout(() => {
              // Mock Progression in C Major
              const mock: ChordEvent[] = [
                  { bar: 1, name: "C", duration: 1 },
                  { bar: 2, name: "Am", duration: 1 },
                  { bar: 3, name: "F", duration: 1 },
                  { bar: 4, name: "G7", duration: 1 },
              ];
              resolve({
                  key: key || "C",
                  progression: mock,
                  melodyHint: "C D E F | E D C z | A B c A | G2 z2 |"
              });
          }, 1500);
      });
  }

  try {
      const prompt = `Genera una progresión de acordes de 8 compases en la tonalidad de ${key} con estilo ${mood}.
      Devuelve un array de objetos con 'bar' (número de compás 1-8) y 'name' (nombre del acorde en notación americana).
      También sugiere una melodía muy simple en notación ABC en el campo 'melodyHint'.
      IMPORTANTE: Responde SOLO JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING },
              progression: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        bar: { type: Type.INTEGER },
                        name: { type: Type.STRING },
                        duration: { type: Type.INTEGER }
                    }
                }
              },
              melodyHint: { type: Type.STRING }
            },
            required: ["key", "progression"]
          }
        }
      });
      
      const text = response.text;
      if(!text) throw new Error("Empty response");
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as GeneratedChords;

  } catch (e) {
      console.error(e);
      return { key: "C", progression: [], melodyHint: "Error" };
  }
}