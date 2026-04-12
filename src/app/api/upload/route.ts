import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const prompt = formData.get('prompt') as string | null;

    let textContent = '';
    let sourceMeta = '';

    if (file) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDFs are supported for files' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // Dynamic import prevents build-time evaluation crash (DOMMatrix not defined)
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const data = await pdfParse(buffer);
      textContent = data.text;
      sourceMeta = file.name;
    } else if (url) {
      const response = await fetch(url);
      const html = await response.text();
      // Dynamic import prevents build-time evaluation crash (File not defined)
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      textContent = $('body').text().replace(/\s+/g, ' ').trim();
      sourceMeta = url;
    } else if (prompt) {
      textContent = prompt.trim();
      sourceMeta = "Prompt Injection";
    } else {
      return NextResponse.json({ error: 'Missing file, url, or prompt parameter' }, { status: 400 });
    }

    // Split into 1,000-character chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(textContent);

    // Embed and insert each chunk
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    let processedChunks = 0;

    for (const chunk of chunks) {
      const result = await embeddingModel.embedContent(chunk);
      const embedding = result.embedding.values;

      const { error } = await supabase.from('document_chunks').insert({
        content: chunk,
        embedding: embedding,
        source: sourceMeta,
        metadata: { type: file ? 'pdf' : url ? 'url' : 'prompt' },
        user_id: userId,
      } as any);

      if (error) {
        console.error('Supabase insertion error:', error);
        continue;
      }
      processedChunks++;
    }

    // Random color for the knowledge orb
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    await supabase.from('knowledge_orbs').insert({
      title: sourceMeta.substring(0, 50),
      source: sourceMeta,
      color: randomColor,
      user_id: userId,
    } as any);

    // Ensure profile exists then award +50 XP
    await fetch(`${new URL(req.url).origin}/api/profile`, {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') || '' },
    });

    // @ts-ignore
    await supabase.rpc('increment_xp', { user_id_param: userId, xp_amount: 50 });

    await supabase.from('interactions').insert({
      user_id: userId,
      type: 'upload',
      xp_awarded: 50,
    } as any);

    return NextResponse.json({
      success: true,
      message: `Processed ${processedChunks}/${chunks.length} chunks from ${sourceMeta}`,
      source: sourceMeta,
      textContent: textContent
    });
  } catch (error: any) {
    console.error('Error in upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
