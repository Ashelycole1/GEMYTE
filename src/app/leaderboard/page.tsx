'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Crown, Zap, User, Medal, ChevronUp, ChevronDown, Activity } from 'lucide-react';

const COLORS = ['#fbbf24', '#e2e8f0', '#b45309', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#fb923c'];

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) {
          const formatted = data.leaderboard.map((u: any, i: number) => ({
            name: u.isCurrentUser ? 'You ✦' : (u.display_name || 'Scholar'),
            xp: u.xp,
            rank: u.rank,
            isCurrentUser: u.isCurrentUser,
            color: u.isCurrentUser ? '#34d399' : COLORS[i % COLORS.length],
            trend: u.isCurrentUser ? 'up' : (Math.random() > 0.5 ? 'up' : 'down') // Mock trend since api doesn't have it yet
          }));
          setUsers(formatted);
        }
      })
      .catch(err => console.error('Leaderboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const top3 = users.slice(0, 3);
  const remaining = users.slice(3);
  
  // Ensure we have exactly 3 for the podium layout even if fewer users
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  return (
    <main className="min-h-screen w-full overflow-y-auto selection:bg-indigo-500/30 font-sans" 
          style={{ background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-sky-500/10 blur-[150px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen flex flex-col">
        
        {/* ── HEADER ── */}
        <header className="flex items-center justify-between mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 sm:py-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Bridge</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <h1 className="text-sm sm:text-base font-bold text-white tracking-widest uppercase">
              Leaderboard
            </h1>
          </div>
          
          {/* Invisible spacer for center alignment */}
          <div className="w-[100px] hidden sm:block" />
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Activity className="w-10 h-10 text-indigo-500 animate-pulse mb-4" />
            <p className="text-indigo-200 animate-pulse font-medium">Loading Ranks...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-8 py-10 rounded-3xl text-center max-w-sm shadow-xl">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-lg mb-2">The Board is empty</p>
              <p className="text-slate-400 text-sm">Sign in, upload a syllabus, and be the first to claim the top spot.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start w-full">
            
            {/* ── PODIUM SECTION ── */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-end min-h-[340px] relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 mt-4 lg:mt-10">
              
              <div className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-md pb-8">
                
                {/* RANK 2 */}
                {rank2 && (
                  <div className="flex flex-col items-center pb-4 relative z-10 w-1/3 hover:-translate-y-2 transition-transform duration-300">
                    <div className="relative mb-3 group">
                      <div className="absolute inset-0 bg-slate-300 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] sm:border-4 border-slate-300 bg-slate-800 flex items-center justify-center relative overflow-hidden shadow-lg" style={{ borderColor: rank2.color }}>
                        <span className="text-lg font-black text-white drop-shadow-md">{getInitials(rank2.name)}</span>
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-slate-300 rounded-full flex items-center justify-center border-2 border-[#1e1b4b] text-xs font-bold text-slate-800 shadow-md">2</div>
                    </div>
                    <p className="text-sm font-bold text-white text-center truncate w-full px-1 drop-shadow-md">{rank2.name}</p>
                    <p className="text-xs text-indigo-300 font-semibold mt-1">{rank2.xp.toLocaleString()} pts</p>
                  </div>
                )}

                {/* RANK 1 */}
                {rank1 && (
                  <div className="flex flex-col items-center relative z-20 w-1/3 -mt-6 hover:-translate-y-3 transition-transform duration-300">
                    <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mb-[-10px] sm:mb-[-12px] relative z-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse" />
                    <div className="relative mb-4 group">
                      <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400 bg-slate-800 flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                        <span className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-lg">{getInitials(rank1.name)}</span>
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-amber-400 rounded-full flex items-center justify-center border-2 border-[#1e1b4b] text-sm font-black text-amber-900 shadow-lg">1</div>
                    </div>
                    <p className="text-base sm:text-lg font-black text-white text-center truncate w-full px-1 drop-shadow-lg">{rank1.name}</p>
                    <p className="text-sm text-amber-400 font-bold mt-1">{rank1.xp.toLocaleString()} pts</p>
                  </div>
                )}

                {/* RANK 3 */}
                {rank3 && (
                  <div className="flex flex-col items-center pb-2 relative z-10 w-1/3 hover:-translate-y-2 transition-transform duration-300">
                    <div className="relative mb-3 group">
                      <div className="absolute inset-0 bg-amber-700 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] sm:border-4 border-amber-700 bg-slate-800 flex items-center justify-center relative overflow-hidden shadow-lg" style={{ borderColor: rank3.color }}>
                        <span className="text-base font-black text-white drop-shadow-md">{getInitials(rank3.name)}</span>
                      </div>
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-amber-700 rounded-full flex items-center justify-center border-2 border-[#1e1b4b] text-[10px] font-bold text-white shadow-md">3</div>
                    </div>
                    <p className="text-sm font-bold text-white text-center truncate w-full px-1 drop-shadow-md">{rank3.name}</p>
                    <p className="text-xs text-indigo-300 font-semibold mt-1">{rank3.xp.toLocaleString()} pts</p>
                  </div>
                )}

              </div>
              
              {/* Podium Base Graphic */}
              <div className="absolute bottom-0 w-full max-w-md h-32 bg-gradient-to-t from-white/[0.03] to-transparent rounded-t-full blur-2xl -z-10 pointer-events-none" />
            </div>

            {/* ── LIST SECTION ── */}
            <div className="w-full lg:w-[55%] flex flex-col gap-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              
              <div className="bg-[#1e1b4b]/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 sm:p-5 shadow-2xl flex-1 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* List Header */}
                <div className="flex justify-between px-4 sm:px-6 py-3 border-b border-white/5 mb-3 sticky top-0 bg-[#1e1b4b]/90 backdrop-blur-md z-10 rounded-2xl hidden sm:flex shadow-sm">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider w-12 text-center">Rank</span>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex-1 ml-4">Player</span>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider text-right">Score</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {remaining.map((u, i) => {
                    const isCurrentUser = u.isCurrentUser;
                    return (
                      <div 
                        key={i}
                        className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
                          isCurrentUser 
                            ? 'bg-indigo-600/30 border border-indigo-400/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/5'
                        }`}
                      >
                        {/* Rank & Trend */}
                        <div className="flex items-center gap-2 sm:gap-4 w-12 sm:w-16">
                          <span className={`text-sm sm:text-base font-bold ${isCurrentUser ? 'text-indigo-300' : 'text-slate-400'}`}>
                            {u.rank}
                          </span>
                          {u.trend === 'up' ? (
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-rose-400" />
                          )}
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex flex-1 items-center gap-3 sm:gap-4 overflow-hidden">
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs sm:text-sm shadow-inner ring-2 ring-white/10" style={{ background: u.color, color: '#000' }}>
                            {getInitials(u.name.replace('✦', '').trim())}
                          </div>
                          <span className={`text-sm sm:text-base font-semibold truncate ${isCurrentUser ? 'text-white drop-shadow-md' : 'text-slate-200'}`}>
                            {u.name}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="text-right pl-3">
                          <span className={`text-sm sm:text-base font-bold ${isCurrentUser ? 'text-indigo-200' : 'text-slate-300'}`}>
                            {u.xp.toLocaleString()}
                          </span>
                          <span className={`text-[10px] sm:text-xs ml-1 font-medium ${isCurrentUser ? 'text-indigo-400' : 'text-slate-500'}`}>pts</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {remaining.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No other players to display.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
}
