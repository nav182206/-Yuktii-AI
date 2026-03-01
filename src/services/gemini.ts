import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CampaignStrategy {
  reasoning: string;
  segments: {
    id: string;
    description: string;
    criteria: any;
  }[];
  variants: {
    id: string;
    segment_id: string;
    subject: string;
    body: string;
    send_time: string;
    tone: "Emotional" | "Rational";
    strategy_focus: string;
  }[];
}

export async function extractEntities(text: string) {
  if (text.length < 10) return null;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Extract key banking campaign entities from this text: "${text}"
      Return JSON with: product, segment, bonus_rate, goal.
      If not found, use null.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          product: { type: Type.STRING, nullable: true },
          segment: { type: Type.STRING, nullable: true },
          bonus_rate: { type: Type.STRING, nullable: true },
          goal: { type: Type.STRING, nullable: true }
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch {
    return null;
  }
}

export async function generateCampaignStrategy(brief: string): Promise<CampaignStrategy> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following marketing campaign brief and generate a strategy: "${brief}"`,
    config: {
      systemInstruction: `
        You are "Yukti AI," a specialized Marketing Agent for SuperBFSI.
        Your goal is to launch the "XDeposit" term deposit product.

        CORE CONSTRAINTS:
        1. PRODUCT LOGIC: XDeposit offers 1% higher returns than competitors.
        2. BONUS LOGIC: If the audience segment includes "Female" AND "Senior Citizens" (60+), you MUST mention an additional 0.25% return (Total 1.25% advantage).
        3. SAFETY: Do not skip customers marked 'inactive'.
        4. CTA: Always include https://superbfsi.com/xdeposit/explore/

        YOUR ROLE:
        - Parse the user's natural language brief.
        - Identify demography, tone, and behavioral strategy.
        - Generate high-converting email content.
        - Optimize for Open Rate (Subject line) and Click Rate (Body/CTA).
        - Identify at least 2 customer segments based on the brief.
        - For each segment, generate exactly 2 variants:
           - Variant A: Emotional focus (e.g., "Security for your family", "Peace of mind").
           - Variant B: Rational focus (e.g., "Highest returns", "Market-leading rates").
        - Provide a "reasoning" field explaining why these strategies were chosen.
        - For each variant, specify a recommended send time (ISO format).

        OUTPUT FORMAT:
        You must ALWAYS respond in valid JSON format so the app can read your data.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reasoning: { type: Type.STRING },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                description: { type: Type.STRING },
                criteria: { type: Type.OBJECT }
              },
              required: ["id", "description", "criteria"]
            }
          },
          variants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                segment_id: { type: Type.STRING },
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
                send_time: { type: Type.STRING },
                tone: { type: Type.STRING },
                strategy_focus: { type: Type.STRING }
              },
              required: ["id", "segment_id", "subject", "body", "send_time", "tone", "strategy_focus"]
            }
          }
        },
        required: ["reasoning", "segments", "variants"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzePerformance(metrics: any): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `
      Analyze the following campaign performance metrics and provide recommendations for optimization.
      
      Metrics: ${JSON.stringify(metrics)}
      
      Provide a concise summary of which variants performed best and why, and what to change for the next iteration.
    `
  });

  return response.text;
}
