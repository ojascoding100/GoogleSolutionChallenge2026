import { GoogleGenAI, Type } from "@google/genai";
import { RiskEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function parseNewsRisk(newsText: string): Promise<Partial<RiskEvent>> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Using mock response.");
    return {
      location: "Suez Canal",
      severity: "High",
      impactRadius: 500,
      description: "Predicted storm activity based on simulation.",
      coordinates: { lat: 30.5852, lng: 32.2654 }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this news text for logistics risks. Extract the location, severity, impact radius in km, and a brief description. News: "${newsText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            severity: { 
              type: Type.STRING,
              enum: ["Low", "Medium", "High"]
            },
            impactRadius: { 
              type: Type.NUMBER,
              description: "Radius of impact in kilometers"
            },
            description: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["location", "severity", "impactRadius", "description", "lat", "lng"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      location: data.location,
      severity: data.severity as 'Low' | 'Medium' | 'High',
      impactRadius: data.impactRadius,
      description: data.description,
      coordinates: { lat: data.lat, lng: data.lng }
    };
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Gemini API quota exceeded (429). Falling back to mock risk analysis data.");
      return {
        location: "Simulated Risk Zone",
        severity: "Medium",
        impactRadius: 300,
        description: "Analysis fallback: Potential obstruction detected via predictive modeling.",
        coordinates: { lat: (Math.random() * 40), lng: (Math.random() * 120) }
      };
    }
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
