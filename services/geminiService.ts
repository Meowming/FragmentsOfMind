
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are the narrative engine for "Fragments of Her Heart", a text-manipulation game.
The player influences a love-stricken protagonist's fate by reordering her fragmented thoughts.

RULES:
1. Interpret the emotional and logical coherence of the sequence of text fragments provided.
2. The sequence fundamentally alters the meaning.
3. Update the Happiness Value based on the emotional trajectory.
4. Generate the next set of 4-6 text fragments.
5. IMPORTANT: Designate 1 or 2 fragments as "is_fixed: true". These are "anchors" of her psyche that she cannot currently change or move. 
6. Anchors should ideally be the longer, more descriptive, or more overwhelming thoughts.
7. Ensure the fragments vary significantly in length (poetic rhythm).
8. Return output strictly in JSON.
`;

export const processFragments = async (
  fragments: string[],
  currentHappiness: number
): Promise<GeminiResponse> => {
  // Creating a new instance right before the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Ordered Sequence: ${fragments.join(" -> ")}
    Current Happiness: ${currentHappiness}
    
    Interpret this sequence and provide the delta, summary, and next fragments (designate 1-2 as fixed).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          happiness_delta: { type: Type.INTEGER },
          interpretation_summary: { type: Type.STRING },
          next_fragments: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                is_fixed: { type: Type.BOOLEAN }
              },
              required: ["text", "is_fixed"]
            }
          },
          tone: { type: Type.STRING }
        },
        required: ["happiness_delta", "interpretation_summary", "next_fragments", "tone"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  return result as GeminiResponse;
};

export const getEndingNarrative = async (
  isVictory: boolean,
  history: any[]
): Promise<string> => {
  // Creating a new instance right before the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    The game has ended in ${isVictory ? 'Victory' : 'Failure'}.
    Summary: ${JSON.stringify(history.slice(-3))}
    Write a concluding narrative paragraph (approx 100 words).
    ${isVictory 
      ? "The protagonist has successfully fixed her relationship with the man she loves. They have reconciled deeply and decided to live together. Describe their warm, shared future and the strength of their renewed bond." 
      : "Describe her emotional collapse or a destructive choice where she loses him forever."
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a poetic narrator finishing a romantic story."
    }
  });

  return response.text || (isVictory ? "They finally stood together, their hearts whole once more." : "The story concludes in silence...");
};
