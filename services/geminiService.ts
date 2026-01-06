
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are the narrative engine for "Fragments of Her Heart", a text-manipulation game.
The player influences a love-stricken protagonist's fate by reordering her fragmented world.

FRAGMENT TYPES:
Fragments MUST include a mix of:
1. INTERNAL MONOLOGUE: Her thoughts, fears, and internal contradictions.
2. DIRECT ACTIONS (IMPACTING HIM): Concrete actions taken toward the man she loves (e.g., "I sent him a text asking if he's okay," "I left a small gift at his doorstep," "I called him three times in a row").
3. PHYSICAL RESPONSES: Physical symptoms or immediate surroundings (e.g., "My hands shook as I held the letter," "The rain soaked through my coat as I waited").

RULES:
1. Interpret the emotional and logical coherence of the sequence.
2. Direct actions toward "him" have high emotional weight. Reordering them changes her perceived intent (e.g., a cold thought followed by a warm action feels like masking; a warm action followed by a cold thought feels like regret).
3. Update the Happiness Value based on the emotional trajectory and the perceived success/failure of her attempts to reach him.
4. Generate the next set of 4-6 text fragments.
5. IMPORTANT: Designate 1 or 2 fragments as "is_fixed: true". These are "anchors" (external circumstances or deep-seated traumas) she cannot currently change.
6. Ensure fragments vary in length and narrative weight.
7. Return output strictly in JSON.

Happiness Evaluation Guidelines (Relationship Focused):
- Vulnerable, honest communication toward him = Positive (+12 to +28)
- Self-respecting boundaries while maintaining connection = Positive (+10 to +25)
- Acts of genuine kindness or reconciliation = Positive (+10 to +25)
- Desperate obsession or boundary-crossing (stalking, harassment) = Negative (-15 to -30)
- Cold avoidance or passive-aggression = Negative (-10 to -20)
- Circular self-sabotage = Negative (-5 to -15)
- Use a "Balanced but Sensitive" scale. If she reaches out and the narrative flow makes sense, reward it.
`;

export const processFragments = async (
  fragments: string[],
  currentHappiness: number
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Ordered Sequence: ${fragments.join(" -> ")}
    Current Happiness: ${currentHappiness}
    
    Interpret this sequence of actions and thoughts. How do these actions toward him change their dynamic?
    Provide the delta, summary, and next fragments (designate 1-2 as fixed).
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    The game has ended in ${isVictory ? 'Victory' : 'Failure'}.
    Summary of her journey: ${JSON.stringify(history.slice(-3))}
    Write a concluding narrative paragraph (approx 100 words).
    ${isVictory 
      ? "She has successfully bridged the gap between them. Describe their final, meaningful encounter—be it a conversation, a shared silence, or a promise of a future together." 
      : "The distance between them has become an uncrossable ocean. Describe the final moment of severance, where she realizes he is truly gone."
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a poetic narrator finishing a romantic story about the weight of direct actions."
    }
  });

  return response.text || (isVictory ? "Finally, her hand found his, and the silence was no longer heavy." : "The dial tone was the only thing left of the man she loved.");
};
