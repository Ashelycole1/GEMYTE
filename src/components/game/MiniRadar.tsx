import { ContentNode } from '@/hooks/useGemyteEngine';
import { Compass } from 'lucide-react';

interface MiniRadarProps {
  nodes: ContentNode[];
  completedIds: number[];
}

export default function MiniRadar({ nodes, completedIds }: MiniRadarProps) {
  // Game coordinates map roughly from -120 to +120
  // We'll normalize this to 0% - 100% for the radar CSS
  
  const mapPos = (val: number) => {
    // clamp to -150 to 150 bounds just in case
    const clamped = Math.max(-150, Math.min(150, val));
    // map to 0 - 100%
    return ((clamped / 150) * 50 + 50) + '%';
  };

  return (
    <div className="absolute top-28 md:top-4 right-4 md:right-8 z-10 w-32 h-32 md:w-48 md:h-48 bg-slate-900/60 backdrop-blur-md rounded-full border-4 border-slate-700/50 shadow-2xl overflow-hidden pointer-events-none">
      
      {/* Radar Sweeper Animation */}
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_70%,rgba(16,185,129,0.3)_100%)] animate-spin" style={{ animationDuration: '3s' }} />

      {/* Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-full h-[1px] bg-emerald-400" />
        <div className="h-full w-[1px] bg-emerald-400 absolute" />
        <div className="w-[70%] h-[70%] rounded-full border border-emerald-400 absolute" />
      </div>

      {/* Nodes on Radar */}
      {nodes.map(node => {
        const isCompleted = completedIds.includes(node.id);
        const x = mapPos(node.position[0]);
        // Note: 3D Z-axis maps to the 2D Y-axis on our radar
        const y = mapPos(node.position[2]);

        return (
          <div 
            key={node.id}
            className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border border-white/50 transition-all shadow-[0_0_10px_currentColor]
              ${isCompleted ? 'bg-slate-500 text-slate-500 scale-75' : 'bg-emerald-400 text-emerald-400 animate-pulse scale-100'}
            `}
            style={{ left: x, top: y }}
          />
        );
      })}

      {/* The Player's Spawn (Center) */}
      <div className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 w-3 h-3 bg-white rounded-full border-2 border-indigo-500 shadow-[0_0_15px_rgba(255,255,255,1)]" />

      {/* Label */}
      <div className="absolute bottom-2 w-full text-center text-[9px] font-black tracking-widest text-emerald-500/80 uppercase">
        Sector Map
      </div>
      <div className="absolute top-2 w-full flex justify-center text-emerald-500/30">
        <Compass className="w-4 h-4" />
      </div>
    </div>
  );
}
