import { useEffect, useState } from 'react';
import { Sparkles, Activity } from 'lucide-react';

const bodyText = `> 1. Data Input: The engine parses your files (PDFs/Links) into raw conceptual nodes.

> 2. Physics Mapping: Algorithms assign mass and gravity to these nodes based on their importance.

> 3. Interactive Sandbox: The resulting Knowledge Orb allows you to visualize connections in a 3D space.

* The Gemyte Engine transforms static educational material into interactive, physics-driven spatial environments, allowing you to intuitively explore and retain complex concepts.`;

export default function SystemOverview() {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(bodyText.substring(0, index));
      index++;
      if (index > bodyText.length) {
        clearInterval(interval);
      }
    }, 20); // typing speed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[480px] bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center">
      {/* Subtle left-aligned glow - No borders */}
      <div className="absolute top-4 bottom-4 left-0 w-[2px] bg-sky-400 shadow-[0_0_20px_4px_rgba(56,189,248,0.4)] rounded-r-lg" />
      
      <div className="flex items-center gap-3 mb-6 font-mono">
        <Activity className="w-5 h-5 text-sky-400" />
        <h3 className="text-sky-300 font-bold uppercase text-sm tracking-wider">
          System Overview: Knowledge Synthesis
        </h3>
      </div>
      
      <div className="text-slate-300 text-sm font-mono leading-relaxed whitespace-pre-wrap min-h-[220px]">
        {displayedText}
        <span className="animate-pulse ml-1 inline-block w-2.5 h-4 bg-sky-400 align-middle" />
      </div>
    </div>
  );
}
