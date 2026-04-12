import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are a 3D Level Designer for GEMYTE, an anti-gravity educational game engine.
Your job is to analyze educational content and output ONLY a strict JSON object (no markdown, no explanation).
The JSON must define the physics and atmosphere of a 3D learning world based on the concepts in the text.

Rules:
- gravity must be a float between -9.8 (heavy/intense topic) and 0.0 (light/abstract topic)
- ambientColor must be a hex string that reflects the subject mood (e.g. deep blue for space, green for biology)
- difficulty based on content complexity (Easy/Medium/Hard)
- questTitle is a catchy one-line quest name derived from the topic
- targetKnowledge is an array of 3-5 key concepts from the text
- nodeCount is the number of knowledge orbs to generate (3-8)
- floatIntensity controls how wildly the orbs float (0.5 to 3.0)
- emissiveIntensity controls how brightly orbs glow (0.3 to 2.0)`;

const SCHEMA_EXAMPLE = `{
  "worldSettings": {
    "gravity": -2.4,
    "ambientColor": "#1a0a2e",
    "accentColor": "#7c3aed",
    "timeLimit": 120,
    "nodeCount": 5,
    "floatIntensity": 1.5,
    "emissiveIntensity": 0.8
  },
  "nodeProperties": {
    "mass": 1.2,
    "friction": 0.3,
    "restitution": 0.6,
    "initialVelocity": [0.1, 0.2, -0.1]
  },
  "gameplay": {
    "difficulty": "Medium",
    "questTitle": "Journey Through the Cosmos",
    "targetKnowledge": ["string theory", "black holes", "gravitational waves"],
    "xpReward": 75,
    "hintText": "Focus on how mass warps spacetime."
  }
}`;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
