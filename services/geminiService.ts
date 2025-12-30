import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLyrics } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure safety in production

const ai = new GoogleGenAI({ apiKey });

export const generateLyrics = async (topic: string, complexity: 'kids' | 'teens'): Promise<GeneratedLyrics> => {
  try {
    const prompt = complexity === 'kids' 
      ? `Escribe una letra de canción para niños pequeños (7-10 años) sobre el tema: "${topic}". 
         Estructura: 4 estrofas cortas. Rima simple AABB. Lenguaje positivo y educativo.
         Incluye un título divertido.`
      : `Escribe una letra de canción estilo urbano/pop para adolescentes sobre: "${topic}".
         Estructura: Verso, Coro, Verso, Coro. Rima libre pero rítmica.`;

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
    
    return JSON.parse(text) as GeneratedLyrics;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "Error Creativo",
      content: "Lo siento, mi cerebro musical está un poco cansado. ¿Intentamos de nuevo?"
    };
  }
};