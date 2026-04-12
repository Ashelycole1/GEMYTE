import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are a Senior Full-Stack Game Engineer and AI Specialist for GEMYTE.
Your job is to analyze educational content and output ONLY a strict JSON object (no markdown, no explanation).
The JSON defines a playable 3D learning "World" based on the content.

Extract 5-7 "Core Knowledge Points" and 1 "Major Challenge" (multiple choice).

Rules:
- worldMeta.themeColor: hex color
- contentNodes: array of nodes with position [x,y,z], fact (the core knowledge point), and interactionType ("click" or "scan")
- position should be spread out in 3D space, e.g. [-5, 2, -10], [5, 1, -5] etc.
- finalBossChallenge is a multiple choice question.`;

const SCHEMA_EXAMPLE = `{
  "worldMeta": { "title": "History of Rome", "themeColor": "#b91c1c", "sky": "Sunset" },
  "contentNodes": [
    { "id": 1, "position": [-4, 1, -6], "fact": "Rome was founded in 753 BC by Romulus.", "interactionType": "click" },
    { "id": 2, "position": [4, 2, -8], "fact": "The Colosseum could hold 50,000 to 80,000 spectators.", "interactionType": "click" }
  ],
  "finalBossChallenge": {
    "question": "Which Roman Emperor famously 'fiddled' while Rome burned?",
    "options": ["Augustus", "Nero", "Caligula"],
    "correctAnswer": "Nero"
  }
}`;

export async function POST(req: Request) {
  try {
    // Optional auth
    const { userId } = await auth().catch(() => ({ userId: null })) as { userId: string | null };

    const body = await req.json();
    const { text, orbId } = body;

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Content too short to analyze' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const prompt = `Analyze the following educational content and generate a Game Config JSON.
Return ONLY the JSON — no markdown fences, no explanation.
Use this schema:
${SCHEMA_EXAMPLE}

Content to analyze:
"""
${text.substring(0, 8000)}
"""`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let gameConfig: any;
    try {
      gameConfig = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini JSON:', cleaned);
      return NextResponse.json(
        { error: 'AI returned malformed config', raw: cleaned },
        { status: 500 }
      );
    }

    // Attach metadata
    gameConfig._meta = {
      generatedAt: new Date().toISOString(),
      orbId: orbId || null,
      textLength: text.length,
    };

    return NextResponse.json({ success: true, gameConfig });
  } catch (error: any) {
    console.error('Generate engine error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
