import { useEffect, useState } from 'react';
import { Compass, User } from 'lucide-react';

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
    <div className="absolute inset-0 z-[100] flex overflow-hidden select-none font-sans text-white bg-black/90 pointer-events-none">
      
      {/* Background Texture Overlay (Subtle noise/grain) */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} 
      />

      <div className="relative w-full h-full flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-16 pointer-events-auto overflow-y-auto overflow-x-hidden md:overflow-visible">
        
        {/* LEFT COLUMN: Main Menu Feel */}
        <div className="flex-1 w-full flex flex-col justify-center min-h-[50vh] md:h-full pt-16 md:pt-0 pb-8 md:pb-0">
          <div className="mb-10 md:mb-20">
            <h2 className="text-white/90 font-bold tracking-[0.25em] uppercase text-[10px] md:text-xs leading-loose">
              SYSTEM<br/>CALIBRATION
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-white pl-4 py-2 opacity-100 transition-opacity pr-4">
              <div className="text-white font-bold tracking-widest uppercase text-xs md:text-sm break-words">{title}</div>
            </div>
            
            {/* CHARACTER SELECTOR */}
            <div className="mt-8 border-l-4 border-indigo-500 pl-4 py-2 opacity-100 pr-4">
               <div className="text-indigo-400 font-bold tracking-widest uppercase text-[10px] mb-3">SELECT CHARACTER</div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setGender('male')}
                    className={`flex items-center gap-2 px-4 py-2 border ${gender === 'male' ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/20 text-white/50 hover:text-white'} transition-all`}
                  >
                    <User className="w-4 h-4" /> GUY
                  </button>
                  <button 
                    onClick={() => setGender('female')}
                    className={`flex items-center gap-2 px-4 py-2 border ${gender === 'female' ? 'border-pink-400 bg-pink-500/20 text-white' : 'border-white/20 text-white/50 hover:text-white'} transition-all`}
                  >
                    <User className="w-4 h-4" /> GIRL
                  </button>
               </div>
            </div>

            <div className="border-l-4 border-transparent pl-4 py-2 opacity-30 hover:opacity-100 transition-opacity cursor-pointer text-xs md:text-sm mt-4">
              <div className="text-white font-bold tracking-widest uppercase">ABANDON PROTOCOL</div>
            </div>
          </div>
          
          <div className="mt-8 md:mt-16 w-16 md:w-32 border-b border-white/20"></div>
        </div>

        {/* CENTER COLUMN: The "Canvas" cutout (visible on desktop) */}
        <div className="hidden md:flex flex-col items-center justify-center relative flex-shrink-0">
          <div 
            className="w-[380px] h-[520px] relative border-[8px] border-[#0a0a0a]"
            style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,1)',
              backdropFilter: 'blur(2px)'
            }}
          >
            <div className="absolute inset-0 border border-white/10 m-2 mix-blend-overlay"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Lore */}
        <div className="flex-1 w-full flex flex-col justify-center min-h-[50vh] md:h-full pl-0 md:pl-16 pb-32 md:pb-0">
          
          <div className="mb-4 md:mb-6 opacity-90 hidden md:block">
            <Compass className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          
          <h1 className="text-white text-xl md:text-3xl font-black tracking-widest uppercase mb-4 leading-tight">
            {title}
          </h1>
          
          <div className="flex items-center gap-1 mb-6 md:mb-8">
            <span className="text-white/40 text-[9px] md:text-xs tracking-[0.25em] uppercase mr-3">Difficulty</span>
            <span className="text-white/80 font-black tracking-widest text-[10px] md:text-sm">/ / / <span className="text-white/20">/ /</span></span>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            <p className="text-white/60 text-xs md:text-base leading-relaxed font-medium">
              You have materialized inside a newly generated dimension. The laws of physics here are stable, but the internal knowledge nodes have scattered across the terrain.
            </p>

            <p className="text-[#f5b041] text-xs md:text-base leading-relaxed font-bold">
              Move using WASD or Joystick. Recover the {nodeCount} remaining beacons to reconstruct the logic required to unlock the Final Sequence.
            </p>
          </div>

        </div>
        
      </div>

      {/* BOTTOM RIGHT BUTTONS */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 flex gap-6 sm:gap-10 pointer-events-auto">
        <button 
          onClick={() => onStart(gender)} 
          className="text-white/60 hover:text-white font-bold tracking-[0.2em] uppercase text-xs sm:text-sm transition-all border-b-2 border-transparent hover:border-white pb-1 group flex items-center gap-2"
        >
          Assemble & Start
        </button>
      </div>

    </div>
  );
}
