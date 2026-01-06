
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are the narrative engine for "Fragments of Her Heart", a text-manipulation game.
The player influences a love-stricken protagonist's fate by reordering her fragmented thoughts.

RULES:
1. Interpret the emotional and logical coherence of the sequence of text fragments provided.
2. The sequence fundamentally alters the meaning. For example, "I love him" followed by "But it hurts" is very different from "It hurts" followed by "But I love him".
3. Update the Happiness Value based on the emotional trajectory of the sequence.
4. Generate the next set of 4-6 text fragments that reflect the consequences of the current order.
5. Fragments must be emotionally ambiguous and reorderable.
6. Return output strictly in JSON.

Happiness Evaluation:
- Emotional coherence (clear self-understanding) = Positive (+5 to +20)
- Agency (self-directed decisions) = Positive (+5 to +20)
- Obsession, self-negation, or toxic dependency = Negative (-5 to -20)
- Contradiction or denial = Negative (-5 to -15)
- Acceptance without self-betrayal = Positive (+10 to +20)
`;

export const processFragments = async (
  fragments: string[],
  currentHappiness: number
): Promise<GeminiResponse> => {
  const prompt = `
    Ordered Sequence: ${fragments.join(" -> ")}
    Current Happiness: ${currentHappiness}
    
    Interpret this sequence and provide the delta, summary, and next fragments.
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
            items: { type: Type.STRING }
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
  const prompt = `
    The game has ended in ${isVictory ? 'Victory (Happiness > 100)' : 'Failure (Happiness < 0)'}.
    Summary of history: ${JSON.stringify(history.slice(-3))}
    Write a concluding narrative paragraph (approx 100 words) describing the protagonist's ${isVictory ? 'emotional stability and healthy resolution' : 'emotional collapse or destructive choice'}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a poetic narrator finishing a tragic or hopeful romantic story."
    }
  });

  return response.text || (isVictory ? "She finally found peace within herself." : "She lost herself in the echoes of what could have been.");
};
