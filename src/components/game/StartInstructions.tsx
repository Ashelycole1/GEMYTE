import { useEffect, useState } from 'react';
import { User, Play, Sparkles } from 'lucide-react';

interface StartInstructionsProps {
  title: string;
  onStart: (gender: 'male' | 'female') => void;
  nodeCount: number;
}

export default function StartInstructions({ title, onStart, nodeCount }: StartInstructionsProps) {
  const [mounted, setMounted] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center select-none font-sans text-white bg-slate-950/30 backdrop-blur-md transition-all duration-1000">
      
      {/* Subtle overlay gradient to keep text readable without blocking the game */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(2,6,23,0.8)_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header / Title */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-xl rotate-3 hover:rotate-0 transition-transform">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-300 drop-shadow-2xl mb-4 text-center">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-white/50 text-xs tracking-[0.25em] uppercase font-bold">Difficulty</span>
            <span className="text-indigo-400 font-black tracking-widest text-sm flex gap-1">
              <span>/</span><span>/</span><span>/</span><span className="text-indigo-400/20">/</span><span className="text-indigo-400/20">/</span>
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#0f172a]/60 border border-white/10 rounded-[2rem] p-6 md:p-10 backdrop-blur-2xl shadow-2xl w-full text-center mb-10 relative overflow-hidden group max-w-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 relative z-10 font-medium">
            You have materialized inside a newly generated dimension. The laws of physics here are stable, but the internal knowledge nodes have scattered across the terrain.
          </p>
          <p className="text-amber-400/90 font-bold text-sm md:text-base relative z-10 bg-amber-400/10 inline-block px-6 py-3 rounded-xl border border-amber-400/20">
            Move using WASD or Joystick. Recover the {nodeCount} remaining beacons to reconstruct the logic required to unlock the Final Sequence.
          </p>
        </div>

        {/* Character Selection */}
        <div className="flex flex-col items-center mb-12 w-full max-w-md">
          <span className="text-slate-400 font-bold tracking-[0.2em] uppercase text-xs mb-5">Select Character</span>
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setGender('male')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all duration-300 ${
                gender === 'male' 
                  ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-[1.02]' 
                  : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <User className={`w-5 h-5 ${gender === 'male' ? 'text-indigo-400' : ''}`} />
              <span className="text-sm font-black tracking-widest uppercase">Guy</span>
            </button>
            <button 
              onClick={() => setGender('female')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all duration-300 ${
                gender === 'female' 
                  ? 'border-pink-500 bg-pink-500/20 text-white shadow-[0_0_30px_rgba(236,72,153,0.2)] scale-[1.02]' 
                  : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <User className={`w-5 h-5 ${gender === 'female' ? 'text-pink-400' : ''}`} />
              <span className="text-sm font-black tracking-widest uppercase">Girl</span>
            </button>
          </div>
        </div>

        {/* GLOWING START BUTTON */}
        <div className="relative mt-2">
          {/* Intense Outer Glow */}
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[40px] opacity-60 animate-pulse" />
          
          <button 
            onClick={() => onStart(gender)} 
            className="relative group flex items-center justify-center gap-4 px-12 md:px-16 py-5 md:py-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 rounded-full text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.8)] border border-white/20 overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <Play className="w-6 h-6 md:w-7 md:h-7 fill-current text-white/90 group-hover:text-white relative z-10" />
            <span className="font-black tracking-[0.25em] uppercase text-sm md:text-base drop-shadow-md relative z-10">Assemble & Start</span>
          </button>
        </div>

      </div>
    </div>
  );
}
