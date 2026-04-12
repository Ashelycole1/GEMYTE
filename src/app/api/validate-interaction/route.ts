import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answer, question, orbTitle } = await req.json();

    if (!answer || !question) {
      return NextResponse.json({ error: 'Answer and question are required' }, { status: 400 });
    }

    // Fetch relevant context from vector DB for this topic
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const queryEmb = await embeddingModel.embedContent(question);
    const queryEmbedding = queryEmb.embedding.values;

    // @ts-ignore
    const { data: docs } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: 4,
    });

    const contextText = docs && docs.length > 0
      ? (docs as any[]).map((d: any) => d.content).join('\n---\n')
      : '';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let evaluation: any;
    try {
      evaluation = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'AI returned malformed evaluation' }, { status: 500 });
    }

    // Award XP if correct
    if (evaluation.correct && evaluation.xpAwarded > 0) {
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
    }

    return NextResponse.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Validate interaction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
