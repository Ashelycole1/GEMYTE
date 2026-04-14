import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function callAI(prompt: string): Promise<string> {
  // 1. Try OpenRouter first (Gemini 3.1)
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      const client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openrouterKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://gemyte.vercel.app',
          'X-Title': 'GEMYTE Engine',
        },
      });
      const response = await client.chat.completions.create({
        model: 'google/gemini-3.1-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      return response.choices[0].message.content || '';
    } catch {
      // fall through to Google
    }
  }

  // 2. Fallback to Google Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function POST(req: Request) {
  try {
    // Auth is OPTIONAL — guests can play but don't earn persistent XP
    const { userId } = await auth().catch(() => ({ userId: null })) as { userId: string | null };

    const { answer, question, orbTitle } = await req.json();

    if (!answer || !question) {
      return NextResponse.json({ error: 'Answer and question are required' }, { status: 400 });
    }

    // Try to find matching context from vector DB (non-fatal)
    let contextText = '';
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const queryEmb = await embeddingModel.embedContent(question);
      const queryEmbedding = queryEmb.embedding.values;

      // @ts-ignore
      const { data: docs } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 4,
      });

      if (docs && docs.length > 0) {
        contextText = (docs as any[]).map((d: any) => d.content).join('\n---\n');
      }
    } catch {
      // RAG failed — still evaluate without vector context
    }

    const prompt = `You are an educational AI evaluator for GEMYTE.
A student was asked: "${question}"
${orbTitle ? `This question is about the module: "${orbTitle}"` : ''}
${contextText ? `\nRelevant source material:\n${contextText}\n` : ''}
The student answered: "${answer}"

Evaluate the answer and respond with ONLY a JSON object (no markdown):
{
  "correct": true or false,
  "score": 0-100,
  "feedback": "brief encouraging feedback in 1-2 sentences",
  "xpAwarded": 0-50,
  "hint": "a hint for improvement if wrong, empty string if correct"
}

Be lenient — partial credit for partially correct answers.`;

    const rawText = await callAI(prompt);

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let evaluation: any;
    try {
      evaluation = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI returned malformed evaluation' }, { status: 500 });
    }

    // Award XP only for authenticated users
    if (evaluation.correct && evaluation.xpAwarded > 0 && userId) {
      try {
        // @ts-ignore
        await supabase.rpc('increment_xp', {
          user_id_param: userId,
          xp_amount: evaluation.xpAwarded,
        });
        await supabase.from('interactions').insert({
          user_id: userId,
          type: 'validated_answer',
          xp_awarded: evaluation.xpAwarded,
        } as any);
      } catch {
        // XP write failed — non-fatal
      }
    }

    return NextResponse.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Validate interaction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
