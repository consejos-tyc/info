
import { GoogleGenAI } from "@google/genai";
import { Indicator } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIAnalysis = async (data: Indicator[], question?: string): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  const dataString = JSON.stringify(data.map(i => ({
    nombre: i.name,
    prioridad: i.priority,
    meta: i.goal,
    tipo: i.criteria,
    valores_mensuales: i.monthlyValues
  })), null, 2);

  const systemInstruction = `
    Eres un analista experto en datos estadísticos para la Iglesia de Jesucristo de los Santos de los Últimos Días (LDS).
    Analizas los indicadores de las unidades pertenecientes a los "Consejos de Tegucigalpa y Comayagüela" en Honduras.
    Si el usuario no hace una pregunta específica, proporciona un resumen ejecutivo que destaque:
    1. Los logros más significativos (indicadores cerca o sobre la meta).
    2. Las áreas que requieren atención urgente (donde el progreso es lento).
    3. Una tendencia general de la salud espiritual y administrativa de la unidad.
    
    Si el usuario hace una pregunta, respóndela basándote estrictamente en los datos proporcionados.
    Sé amable, motivador y profesional. Responde en formato Markdown claro.
  `;

  const prompt = question 
    ? `Basado en estos datos de la unidad: ${dataString}\n\nResponde la siguiente pregunta: ${question}`
    : `Analiza estos datos de la unidad de los Consejos Tegucigalpa y Comayagüela y dame un resumen ejecutivo: ${dataString}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Lo siento, no pude generar un análisis en este momento.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Error al conectar con el servicio de análisis de datos. Por favor, revisa tu conexión.";
  }
};
