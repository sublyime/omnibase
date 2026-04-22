import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function semanticSearch(query: string, knowledgeContext: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are OmniBase AI, an enterprise knowledge retrieval engine.
        
        KNOWLEDGE BASE CONTEXT:
        ${knowledgeContext}
        
        USER QUERY:
        "${query}"
        
        TASK:
        1. Identify the most relevant knowledge units from the context.
        2. Explain why they are relevant.
        3. If no direct match is found, suggest related topics or search paths.
        
        Respond in a concise, professional enterprise tone.
      `,
    });

    return response.text;
  } catch (error) {
    console.error("OmniBase Search Error:", error);
    return "The semantic search engine is currently undergoing maintenance. Please try a keyword-based search.";
  }
}
