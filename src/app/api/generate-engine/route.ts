import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Ordered fallback list — if first model returns 429 quota, we try the next
const MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const SYSTEM_INSTRUCTION = `You are a Senior Full-Stack Game Engineer and AI Specialist for GEMYTE.
Your job is to analyze educational content and output ONLY a strict JSON object (no markdown, no explanation).
The JSON defines a playable 3D learning "World" based on the content.

Extract 5-7 "Core Knowledge Points" and 1 "Major Challenge" (multiple choice).

Rules:
- worldMeta.themeColor: hex color string like "#b91c1c"
- worldMeta.title: short descriptive title string
- worldMeta.sky: one of "Sunset", "Night", "Dawn", "Day"
- contentNodes: array of 5-7 nodes, each with:
    - id: number starting at 1
    - position: [x, y, z] where x and z are between -8 and 8, y is between 0 and 3
    - fact: a key educational fact as a sentence
    - interactionType: "click"
- finalBossChallenge: an object with:
    - question: a challenging multiple-choice question string
    - options: array of exactly 3 answer strings
    - correctAnswer: one of the options strings (must match exactly)

Output ONLY the raw JSON object. No markdown. No explanation. No code fences.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, orbId } = body;

    if (!text || text.trim().length < 2) {
      return NextResponse.json({ error: 'Content too short to analyze' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Analyze the following educational content and generate a valid Game Config JSON.

Content:
"""
${text.substring(0, 6000)}
"""

Return ONLY the JSON object matching the schema. Do not wrap in code fences.`;

    let rawText = '';
    let lastError = '';

    // Try each model in the fallback chain
    for (const modelName of MODEL_FALLBACKS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
        const result = await model.generateContent(prompt);
        rawText = result.response.text().trim();
        break; // success — exit the loop
      } catch (err: any) {
        lastError = err?.message || String(err);
        const is429 = lastError.includes('429') || lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED');
        if (is429) {
          await sleep(1500); // brief pause before trying next model
          continue;
        }
        // Non-quota error — surface it immediately
        throw err;
      }
    }

    if (!rawText) {
      return NextResponse.json(
        { error: `All AI models hit rate limits. Please try again in a minute. (${lastError.substring(0, 120)})` },
        { status: 429 }
      );
    }

    // Strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let gameConfig: any;
    try {
      gameConfig = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw response:', rawText.substring(0, 500));
      return NextResponse.json(
        { error: `AI returned malformed JSON: ${(parseErr as Error).message}` },
        { status: 500 }
      );
    }

    // Validate the config has the required fields
    if (!gameConfig.worldMeta || !Array.isArray(gameConfig.contentNodes) || !gameConfig.finalBossChallenge) {
      return NextResponse.json(
        { error: 'AI response is missing required fields (worldMeta, contentNodes, finalBossChallenge)' },
        { status: 500 }
      );
    }

    gameConfig._meta = {
      generatedAt: new Date().toISOString(),
      orbId: orbId || null,
      textLength: text.length,
    };

    return NextResponse.json({ success: true, gameConfig });

  } catch (error: any) {
    console.error('Generate engine error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Unknown error generating level' },
      { status: 500 }
    );
  }
}
