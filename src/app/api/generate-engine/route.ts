import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

async function generateViaOpenRouter(text: string): Promise<string> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) throw new Error('NO_OPENROUTER_KEY');

  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: openrouterKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://gemyte.vercel.app',
      'X-Title': 'GEMYTE Engine',
    },
  });

  // Try models in order — first available wins
  const models = [
    'google/gemini-3.1-flash-preview',
    'google/gemini-3.1-flash-lite-preview',
    'google/gemini-2.5-flash-preview',
    'google/gemini-2.0-flash-001',
  ];

  let lastError = '';
  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `Analyze the following educational content and generate a Game Config JSON.\n\nContent:\n"""\n${text.substring(0, 6000)}\n"""\n\nReturn ONLY the JSON object. No markdown fences.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });
      return response.choices[0].message.content || '';
    } catch (err: any) {
      lastError = err?.message || String(err);
      const is429 = lastError.includes('429') || lastError.includes('quota') || lastError.includes('rate');
      if (is429) { await new Promise(r => setTimeout(r, 1500)); continue; }
      throw err;
    }
  }
  throw new Error(`All OpenRouter models rate-limited: ${lastError}`);
}

async function generateViaGoogle(text: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('NO_GEMINI_KEY');

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash-lite'];
  let lastError = '';

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const result = await model.generateContent(
        `Analyze the following content and generate a valid Game Config JSON.\n\nContent:\n"""\n${text.substring(0, 6000)}\n"""\n\nReturn ONLY the raw JSON. No code fences.`
      );
      return result.response.text().trim();
    } catch (err: any) {
      lastError = err?.message || String(err);
      const is429 = lastError.includes('429') || lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED');
      if (is429) { await new Promise(r => setTimeout(r, 1500)); continue; }
      throw err;
    }
  }
  throw new Error(`All Google models rate-limited: ${lastError}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, orbId } = body;

    if (!text || text.trim().length < 2) {
      return NextResponse.json({ error: 'Content too short to analyze' }, { status: 400 });
    }

    // Try OpenRouter first (Gemini 3.1), fall back to Google directly
    let rawText = '';
    try {
      rawText = await generateViaOpenRouter(text);
    } catch (err: any) {
      if (err.message === 'NO_OPENROUTER_KEY') {
        // Key not set — fall through to Google
        rawText = await generateViaGoogle(text);
      } else {
        // OpenRouter failed for another reason — try Google as backup
        try {
          rawText = await generateViaGoogle(text);
        } catch {
          throw err; // both failed — re-throw original error
        }
      }
    }

    // Clean markdown fences just in case
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let gameConfig: any;
    try {
      gameConfig = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw:', cleaned.substring(0, 400));
      return NextResponse.json(
        { error: `AI returned malformed JSON: ${(parseErr as Error).message}` },
        { status: 500 }
      );
    }

    if (!gameConfig.worldMeta || !Array.isArray(gameConfig.contentNodes) || !gameConfig.finalBossChallenge) {
      return NextResponse.json(
        { error: 'AI response missing required fields (worldMeta, contentNodes, finalBossChallenge)' },
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
