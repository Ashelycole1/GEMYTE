import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();

    // Fetch top 20 users ordered by XP
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, xp')
      .order('xp', { ascending: false })
      .limit(20);

    if (error) throw error;

    const ranked = ((data as any[]) || []).map((user: any, index: number) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.user_id === userId,
    }));

    // Find current user's rank if not in top 20
    let currentUserEntry = null;
    if (userId && !ranked.find((u) => u.isCurrentUser)) {
      const { data: myProfileRaw } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url, xp')
        .eq('user_id', userId)
        .single();
        
      const myProfile = myProfileRaw as any;

      if (myProfile) {
        // Count how many users have more XP
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gt('xp', myProfile.xp);

        currentUserEntry = {
          ...myProfile,
          rank: (count || 0) + 1,
          isCurrentUser: true,
        };
      }
    }

    return NextResponse.json({
      leaderboard: ranked,
      currentUser: currentUserEntry || ranked.find((u) => u.isCurrentUser) || null,
    });
  } catch (error: any) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
