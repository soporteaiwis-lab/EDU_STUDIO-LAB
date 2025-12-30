import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLyrics } from "../types";

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateLyrics = async (topic: string, complexity: 'kids' | 'teens'): Promise<GeneratedLyrics> => {
  // FALLBACK for missing API key in preview environments
  // This allows the user to see the UI flow even without a valid backend connection
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
      console.warn("Gemini API Key missing. Using mock response.");
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  title: `Canción sobre ${topic} (Demo)`,
                  content: `(Verso 1)\nAquí estamos cantando sobre ${topic}\nEs algo muy divertido y tópico\nLa música suena sin parar\nY todos nos ponemos a bailar\n\n(Coro)\n${topic}, ${topic}, qué genial\nEs el tema de nuestro festival\n\n[NOTA: Esto es un texto simulado porque falta la API Key]`
              });
          }, 1500);
      });
  }

  try {
    const prompt = complexity === 'kids' 
      ? `Escribe una letra de canción para niños pequeños (7-10 años) sobre el tema: "${topic}". 
         Estructura: 4 estrofas cortas. Rima simple AABB. Lenguaje positivo y educativo.
         IMPORTANTE: Responde SOLAMENTE con el JSON raw, sin bloques de código ni markdown.`
      : `Escribe una letra de canción estilo urbano/pop para adolescentes sobre: "${topic}".
         Estructura: Verso, Coro, Verso, Coro. Rima libre pero rítmica.
         IMPORTANTE: Responde SOLAMENTE con el JSON raw.`;

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
    
    // SANITIZATION: Remove markdown code fences if Gemini adds them
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as GeneratedLyrics;

  } catch (error) {
    console.error("Gemini Error:", error);
    // Return a friendly error object that looks like lyrics so the UI doesn't break
    return {
      title: "Modo Offline / Error",
      content: "No pude conectar con el servidor de IA.\n\nPosibles causas:\n1. Falta la API Key en el archivo .env\n2. Bloqueo de red escolar\n\nPuedes escribir tu letra manualmente aquí."
    };
  }
};