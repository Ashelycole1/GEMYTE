import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';

interface StartInstructionsProps {
  title: string;
  onStart: () => void;
  nodeCount: number;
}

export default function StartInstructions({ title, onStart, nodeCount }: StartInstructionsProps) {
  const [mounted, setMounted] = useState(false);

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

      <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between px-8 md:px-16 pointer-events-auto">
        
        {/* LEFT COLUMN: Main Menu Feel */}
        <div className="flex-1 max-w-sm flex flex-col justify-center h-full pt-20 md:pt-0">
          <div className="mb-20">
            <h2 className="text-white/90 font-bold tracking-[0.25em] uppercase text-xs sm:text-sm leading-loose">
              SYSTEM<br/>CALIBRATION
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-white pl-4 py-2 opacity-100 transition-opacity">
              <div className="text-white font-bold tracking-widest uppercase text-sm sm:text-base">{title}</div>
            </div>
            <div className="border-l-4 border-transparent pl-4 py-2 opacity-30 hover:opacity-100 transition-opacity cursor-pointer text-sm">
              <div className="text-white font-bold tracking-widest uppercase truncate">RECORDS [LOCKED]</div>
            </div>
            <div className="border-l-4 border-transparent pl-4 py-2 opacity-30 hover:opacity-100 transition-opacity cursor-pointer text-sm">
              <div className="text-white font-bold tracking-widest uppercase">ABANDON PROTOCOL</div>
            </div>
          </div>
          
          <div className="mt-16 w-32 border-b border-white/20"></div>
        </div>

        {/* CENTER COLUMN: The "Canvas" cutout (visible on desktop) */}
        <div className="hidden md:flex flex-col items-center justify-center relative">
          {/* This creates a central window that lets the vibrant 3D world shine through
              by cutting a transparent hole in a dark local overlay */}
          <div 
            className="w-[380px] h-[520px] relative border-[8px] border-[#0a0a0a]"
            style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,1)',
              backdropFilter: 'blur(2px)' // Slight blur for that "painting" feel
            }}
          >
            {/* Rough canvas edge effect (CSS hack with borders) */}
            <div className="absolute inset-0 border border-white/10 m-2 mix-blend-overlay"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Lore */}
        <div className="flex-1 max-w-md flex flex-col justify-center h-full pl-0 md:pl-16 pb-20 md:pb-0">
          
          <div className="mb-6 opacity-90">
            <Compass className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-white text-2xl sm:text-3xl font-black tracking-widest uppercase mb-4 leading-tight">
            {title}
          </h1>
          
          <div className="flex items-center gap-1 mb-8">
            <span className="text-white/40 text-[10px] sm:text-xs tracking-[0.25em] uppercase mr-3">Difficulty</span>
            <span className="text-white/80 font-black tracking-widest text-sm">/ / / <span className="text-white/20">/ /</span></span>
          </div>
          
          <div className="space-y-6">
            <p className="text-white/60 text-sm sm:text-base leading-relaxed font-medium">
              You have materialized inside a newly generated dimension. The laws of physics here are stable, but the internal knowledge nodes have scattered across the terrain.
            </p>

            <p className="text-[#f5b041] text-sm sm:text-base leading-relaxed font-bold">
              Move using WASD or Joystick. Recover the {nodeCount} remaining beacons to reconstruct the logic required to unlock the Final Sequence.
            </p>
          </div>

        </div>
        
      </div>

      {/* BOTTOM RIGHT BUTTONS */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 flex gap-6 sm:gap-10 pointer-events-auto">
        <button 
          onClick={onStart} 
          className="text-white/60 hover:text-white font-bold tracking-[0.2em] uppercase text-xs sm:text-sm transition-all border-b-2 border-transparent hover:border-white pb-1 group flex items-center gap-2"
        >
          Confirm
        </button>
        <button 
          className="text-white/40 hover:text-white font-bold tracking-[0.2em] uppercase text-xs sm:text-sm transition-all border-b-2 border-transparent hover:border-white pb-1"
        >
          Back
        </button>
      </div>

    </div>
  );
}
