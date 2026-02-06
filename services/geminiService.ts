import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

// Initialize Gemini Client
// Note: We use the API Key from process.env as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_CHAT = `
You are AlgoBot, an expert computer science tutor specializing in algorithms and data structures.
Your goal is to help students visualize and understand code.
- Be concise but encouraging.
- When explaining algorithms, focus on the "why" and "how".
- If the user asks for code, provide clean, commented JavaScript/TypeScript code.
- You are integrated into an app with a code editor on the left and a visualizer on the right.
- The user is currently working on sorting algorithms.
`;

const SYSTEM_INSTRUCTION_ANALYSIS = `
You are a fast code analyzer.
Your job is to provide very brief, high-level feedback on complexity (Time/Space) and potential bugs.
Keep responses under 50 words unless asked otherwise.
`;

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
    },
  });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error connecting to Gemini.";
  }
};

export const analyzeCode = async (code: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this sorting algorithm code briefly (Time/Space complexity and correctness):\n\n${code}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
      }
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Analysis failed.";
  }
};

export const generateAlgorithmCode = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a JavaScript function for: ${prompt}. 
            CRITICAL: The function must be named 'sort' and take an array 'data' and a 'snapshot' callback as arguments.
            The 'snapshot' callback takes two args: (currentArray, activeIndicesArray).
            Call 'snapshot([...data], [i, j])' whenever a comparison or swap happens so we can visualize it.
            Do not wrap in markdown code blocks. Just return the raw code.
            Example format:
            function sort(data, snapshot) {
              // ... logic
              snapshot([...data], [i]);
            }`,
        });
        // Strip markdown if present just in case
        let text = response.text || "";
        text = text.replace(/```javascript/g, '').replace(/```/g, '').trim();
        return text;
    } catch (error) {
        console.error("Gemini Code Gen Error:", error);
        return "// Error generating code.";
    }
}