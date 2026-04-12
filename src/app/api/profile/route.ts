import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
      throw error;
    }

    // If no profile exists yet, return default
    if (!data) {
      return NextResponse.json({ xp: 0, display_name: null, avatar_url: null });
    }

    return NextResponse.json({
      xp: data.xp,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Called on first sign-in to upsert profile from Clerk data
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const displayName = user?.fullName || user?.firstName || user?.username || 'Anonymous';
    const avatarUrl = user?.imageUrl || null;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        { user_id: userId, display_name: displayName, avatar_url: avatarUrl },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, profile: data });
  } catch (error: any) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
