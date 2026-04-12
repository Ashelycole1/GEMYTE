import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Embed the user's query
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const queryEmb = await embeddingModel.embedContent(message);
    const queryEmbedding = queryEmb.embedding.values;

    // Search Supabase pgvector for similar chunks
    // * Requires a Postgres function `match_document_chunks` installed *
    // @ts-ignore
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Adjust as needed
      match_count: 5,
    });
    const documents = data as any[] | null;

    if (error) {
      console.error('Vector search error:', error);
      // Fallback to non-RAG chat if DB fails
    }

    let contextText = "";
    if (documents && documents.length > 0) {
      contextText = documents.map((doc: any) => doc.content).join("\n---\n");
    }

    // Generate response using Gemini
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt = `You are the AI brain behind GEMYTE, an educational 3D learning engine.`;
    if (contextText) {
       prompt += `\n\nUse the following extracted context from syllabi/documents to answer the student's question:\n${contextText}`;
    }
    prompt += `\n\nStudent Question: ${message}\nAnswer clearly, concisely, and with a helpful tone.`;

    const result = await chatModel.generateContent(prompt);
    const responseText = result.response.text();

    // Reward XP internally - logging interaction
    // First call profile upsert just in case it doesn't exist
    await fetch(`${new URL(req.url).origin}/api/profile`, { method: 'POST', headers: { cookie: req.headers.get('cookie') || '' } });
    
    // Update XP
    // @ts-ignore
    await supabase.rpc('increment_xp', {
      user_id_param: userId,
      xp_amount: 10
    });
    
    // Log interaction
    await supabase.from('interactions').insert({
      user_id: userId,
      type: 'chat',
      xp_awarded: 10
    } as any);

    return NextResponse.json({ response: responseText, contextFound: !!contextText });
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
