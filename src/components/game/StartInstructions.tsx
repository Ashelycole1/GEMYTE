import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';

interface StartInstructionsProps {
  title: string;
  onStart: () => void;
}

export default function StartInstructions({ title, onStart }: StartInstructionsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 select-none">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] text-center animate-in zoom-in-95 duration-500">
        
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          <Play className="w-8 h-8 ml-1" />
        </div>

        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 text-sm font-black uppercase tracking-widest mb-2">
          World Generated
        </h2>
        
        <h1 className="text-3xl font-black text-white mb-6 leading-tight">
          {title}
        </h1>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5 p-text-left space-y-4 mb-8 text-slate-300 text-sm">
          <div className="flex items-start gap-3 text-left">
            <div className="w-6 h-6 rounded bg-slate-800 text-xs flex items-center justify-center font-bold border border-slate-700 shrink-0 mt-0.5">W</div>
            <p><strong className="text-white">Move Your Avatar:</strong> Use WASD keys or the mobile onscreen joystick.</p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-6 h-6 rounded-[2em] bg-slate-800 text-xs flex items-center justify-center font-bold border border-slate-700 shrink-0 mt-0.5 px-3">_</div>
            <p><strong className="text-white">Jump:</strong> Press Spacebar or the onscreen jump button.</p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold border border-emerald-500/50 shrink-0 mt-0.5">✦</div>
            <p><strong className="text-white">Goal:</strong> Find and walk over the glowing beacons scattered on the map to learn facts and unlock the Final Boss.</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
        >
          Enter Dimension
        </button>
      </div>
    </div>
  );
}
