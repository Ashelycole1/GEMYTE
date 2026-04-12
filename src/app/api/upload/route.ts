import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
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

    let textContent = '';
    let sourceMeta = '';

    if (file) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDFs are supported for files' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      textContent = data.text;
      sourceMeta = file.name;
    } else if (url) {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      textContent = $('body').text().replace(/\s+/g, ' ').trim();
      sourceMeta = url;
    } else {
      return NextResponse.json({ error: 'Missing file or url parameter' }, { status: 400 });
    }

    // Split the text into 1,000 character chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.splitText(textContent);

    // Get the embedding model
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    // Process and insert chunks sequentially to avoid rate limits
    let processedChunks = 0;
    for (const chunk of chunks) {
      const result = await embeddingModel.embedContent(chunk);
      const embedding = result.embedding.values;

      const { error } = await supabase.from('document_chunks').insert({
        content: chunk,
        embedding: embedding,
        source: sourceMeta,
        metadata: { type: file ? 'pdf' : 'url' },
        user_id: userId
      });

      if (error) {
         console.error('Supabase insertion error:', error);
         continue; // Try to insert the rest
      }
      processedChunks++;
    }

    // Random color assignment
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Insert the knowledge orb metadata
    await supabase.from('knowledge_orbs').insert({
      title: sourceMeta.substring(0, 50),
      source: sourceMeta,
      color: randomColor,
      user_id: userId,
    });

    // Reward XP +50
    // First call profile upsert just in case it doesn't exist
    await fetch(`${new URL(req.url).origin}/api/profile`, { method: 'POST', headers: { cookie: req.headers.get('cookie') || '' } });
    
    // Update XP
    await supabase.rpc('increment_xp', {
      user_id_param: userId,
      xp_amount: 50
    });
    
    // Log interaction
    await supabase.from('interactions').insert({
      user_id: userId,
      type: 'upload',
      xp_awarded: 50
    });

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedChunks}/${chunks.length} chunks successfully from ${sourceMeta}`,
      source: sourceMeta
    });

  } catch (error: any) {
    console.error('Error in upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
