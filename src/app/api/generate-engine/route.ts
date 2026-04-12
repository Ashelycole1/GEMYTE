import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are a Game Architect for GEMYTE, an AI-powered educational game engine.
Your job is to analyze educational content and output ONLY a strict JSON object (no markdown, no explanation).
The JSON configures BOTH a 3D world AND a 2D Flappy Bird game based on the subject material.

Rules:
- gravity must be a float between -9.8 (heavy/intense topic) and 0.0 (light/abstract topic)
- ambientColor: hex color reflecting subject mood (e.g. deep blue for space, lush green for biology)
- bgColor: hex background color for the 2D game sky (derived from topic atmosphere)
- pipeColor: hex color for the 2D pipe obstacles
- birdColor: hex color for the player bird (vibrant, distinct from bgColor)
- difficulty: Easy / Medium / Hard (based on content complexity)
- questTitle: catchy one-line title from the topic
- topics: array of 3-5 objects, each with a 'title' (key concept) and 'question' (a short quiz question a student must answer to pass that checkpoint in the Flappy Bird game)
- xpReward: XP per correct answer (25-100)`;

const SCHEMA_EXAMPLE = `{
  "worldSettings": {
    "gravity": -3.2,
    "ambientColor": "#0a1628",
    "accentColor": "#3b82f6",
    "timeLimit": 120,
    "nodeCount": 4,
    "floatIntensity": 1.8,
    "emissiveIntensity": 0.9
  },
  "nodeProperties": {
    "mass": 1.0,
    "friction": 0.2,
    "restitution": 0.7,
    "initialVelocity": [0, 0, 0]
  },
  "gameplay": {
    "difficulty": "Medium",
    "questTitle": "Escape Velocity: Astrophysics Run",
    "bgColor": "#020c1b",
    "pipeColor": "#1e3a5f",
    "birdColor": "#38bdf8",
    "topics": [
      { "title": "Black Holes", "question": "What is the boundary of a black hole from which nothing can escape called?" },
      { "title": "Gravitational Waves", "question": "What astronomical event first confirmed the existence of gravitational waves in 2015?" },
      { "title": "Dark Matter", "question": "How do scientists detect dark matter if it does not emit or absorb light?" }
    ],
    "targetKnowledge": ["Black Holes", "Gravitational Waves", "Dark Matter"],
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
