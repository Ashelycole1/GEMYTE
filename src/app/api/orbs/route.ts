import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('knowledge_orbs')
      .select('id, title, source, color, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ orbs: data || [] });
  } catch (error: any) {
    console.error('Orbs GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
