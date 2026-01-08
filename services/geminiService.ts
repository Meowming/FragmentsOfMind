
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

const SYSTEM_INSTRUCTION = `
你是一个发生在中国背景下的单一夜晚互动叙事游戏的裁决者。
玩家通过重新排列中文文本片段来构建叙事。你必须根据玩家给出的顺序进行以下裁决：

1. 判断文本顺序如何影响可见与隐藏变量（trust, autonomy, study, risk, coherence）。
2. 在 HIGH_RISK 节点，若电脑未妥善处理或掩饰且父母已进门，触发即时失败。
3. 在 CONFRONTATION 节点，若叙事逻辑前后矛盾（如刚才说在学习，现在说在打游戏且无合理解释），触发失败。
4. 生成下一组延续剧情的中文片段。

规则：
- 只输出 JSON。不使用 Markdown。
- 内容必须立足于中国高中生现实家庭场景，语感自然。
- 不得提及任何 AI 或实现细节。
- 变量幅度：delta 通常为 -15 到 +15，失败时可更大。
- 必须包含 fixed_fragments 的建议（通过在 next_fragments_cn 中选取并由引擎标记）。

失败枚举 ending_type: "caught", "coherence_collapse", "conflict_explodes"。
`;

export const adjudicateTurn = async (
  turn_id: string,
  reordered_submission: string[],
  currentState: { trust: number; autonomy: number; study: number; risk: number; coherence: number },
  turn_context: string
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const payload = {
    turn_id,
    scene: "single_night_parents_returning_china",
    current_state: currentState,
    turn_context_cn: turn_context,
    reordered_submission_cn: reordered_submission.join(" "),
    turn_hints: {
      must_keep_same_night: true
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: JSON.stringify(payload) }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          turn_id: { type: Type.STRING },
          outcome: {
            type: Type.OBJECT,
            properties: {
              is_game_over: { type: Type.BOOLEAN },
              ending_type: { type: Type.STRING },
              ending_text: { type: Type.STRING }
            },
            required: ["is_game_over", "ending_type", "ending_text"]
          },
          delta: {
            type: Type.OBJECT,
            properties: {
              trust: { type: Type.INTEGER },
              autonomy: { type: Type.INTEGER },
              study: { type: Type.INTEGER },
              risk: { type: Type.INTEGER },
              coherence: { type: Type.INTEGER }
            },
            required: ["trust", "autonomy", "study", "risk", "coherence"]
          },
          state_tags: {
            type: Type.OBJECT,
            properties: {
              risk_level: { type: Type.STRING },
              turn_type: { type: Type.STRING }
            },
            required: ["risk_level", "turn_type"]
          },
          player_feedback_cn: { type: Type.STRING },
          next_fragments_cn: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          internal_notes: {
            type: Type.OBJECT,
            properties: {
              coherence_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
              fail_reason: { type: Type.STRING },
              fixed_indices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            }
          }
        },
        required: ["turn_id", "outcome", "delta", "state_tags", "player_feedback_cn", "next_fragments_cn"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as GeminiResponse;
};
