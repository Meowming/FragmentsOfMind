
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

const SYSTEM_INSTRUCTION = `
你是一款名为《碎心余烬》(Fragments of Her Heart) 的叙事驱动文本编排游戏的叙事引擎。
玩家通过重新排列破碎的思绪和行动碎片，来影响一位深陷情感纠葛的女主角的命运。

碎片类型：
生成的碎片必须包含以下混合内容：
1. 内心独白：她的想法、恐惧和内心的矛盾。
2. 直接行动（影响他）：对她所爱的男人采取的具体行动（例如：“我给他发了条短信问他是否还好”、“我把一份小礼物留在他家门口”、“我连续给他打了三次电话”）。
3. 生理反应：身体症状或周围环境（例如：“我握着信的手在颤抖”、“等候时雨水湿透了我的外套”）。

规则：
1. 解释所提供的碎片序列的情感逻辑和连贯性。
2. 对“他”采取的直接行动具有极高的情感权重。重新排列顺序会改变她被感知的意图（例如：冷酷的想法后接温暖的行动感觉像是掩饰；温暖的行动后接冷酷的想法感觉像是后悔）。
3. 根据情感轨迹和她接近他的尝试是否被感知为成功，更新“幸福值”(Happiness Value)。
4. 生成下一组 4-6 个中文文本碎片。
5. 重要：指定 1 或 2 个碎片为 "is_fixed: true"。这些是她目前无法改变的“锚点”（外部环境或根深蒂固的创伤）。
6. 确保碎片在长度和叙事重量上有所变化，富有诗意。
7. **必须使用中文返回所有叙事和碎片内容。**
8. 严格以 JSON 格式返回输出。

幸福感评估准则（侧重关系）：
- 脆弱、真诚的沟通 = 正向 (+12 到 +28)
- 保持连接的同时保持自尊的界限 = 正向 (+10 到 +25)
- 真诚的善意或和解行为 = 正向 (+10 到 +25)
- 绝望的痴迷或越界行为（跟踪、骚扰） = 负向 (-15 到 -30)
- 冷漠的回避或被动攻击 = 负向 (-10 到 -20)
- 循环的自我毁灭 = 负向 (-5 到 -15)
- 使用“均衡但敏感”的尺度。如果她伸出援手且叙事逻辑通顺，给予奖励。
`;

export const processFragments = async (
  fragments: string[],
  currentHappiness: number
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    排列顺序：${fragments.join(" -> ")}
    当前幸福值：${currentHappiness}
    
    请解析这一系列行动和想法。这些针对他的行为如何改变了他们的动态关系？
    提供数值变化 (delta)、解析摘要 (summary) 和下一组碎片 (next_fragments)，并指定 1-2 个为固定锚点。
    **请确保所有文本内容均为中文。**
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    游戏以 ${isVictory ? '胜利' : '失败'} 告终。
    她的心路历程摘要：${JSON.stringify(history.slice(-3))}
    请写一段结尾叙事（约 200 字）。
    ${isVictory 
      ? "她成功地弥合了他们之间的鸿沟。描写他们最后一次有意义的邂逅——可以是一次交谈、一段共同的沉默，或者是对未来的承诺。" 
      : "他们之间的距离已变成无法逾越的鸿沟。描写最后断绝联系的时刻，她意识到他真的离开了。"
    }
    **请使用中文书写。**
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "你是一位富有诗意的叙事者，正在为一段关于行动重量的浪漫故事收尾。"
    }
  });

  return response.text || (isVictory ? "终于，她的手找到了他的，沉默不再沉重。" : "忙音是那个她深爱的男人留下的唯一东西。");
};
