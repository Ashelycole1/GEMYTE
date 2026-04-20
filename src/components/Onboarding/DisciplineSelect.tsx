import { 
  Atom, FlaskConical, Dna, Globe, 
  Code2, Bot, Shield, Database, 
  Settings, Building, FunctionSquare, Infinity,
  ArrowLeft,
  Eye, Hash, Calculator, Activity, Link
} from 'lucide-react';
import React from 'react';

interface Discipline {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType<any>;
  iconColorClass: string;
}

const SUBJECTS_BY_LEVEL: Record<string, Discipline[]> = {
  kindergarten: [
    { id: 'observation', title: 'Observation', category: 'NATURE', icon: Eye, iconColorClass: 'text-emerald-400' },
    { id: 'counting', title: 'Counting', category: 'MATH', icon: Hash, iconColorClass: 'text-sky-400' },
  ],
  elementary: [
    { id: 'multiplication', title: 'Multiplication', category: 'MATH', icon: Calculator, iconColorClass: 'text-emerald-400' },
    { id: 'anatomy', title: 'Anatomy', category: 'SCIENCE', icon: Activity, iconColorClass: 'text-pink-400' },
  ],
  middle: [
    { id: 'pre_algebra', title: 'Pre-Algebra', category: 'MATH', icon: FunctionSquare, iconColorClass: 'text-emerald-500' },
    { id: 'earth_science', title: 'Earth Science', category: 'SCIENCE', icon: Globe, iconColorClass: 'text-sky-400' },
  ],
  high: [
    { id: 'calculus', title: 'Calculus', category: 'MATH', icon: Infinity, iconColorClass: 'text-green-400' },
    { id: 'physics', title: 'Physics', category: 'SCIENCE', icon: Atom, iconColorClass: 'text-emerald-400' },
    { id: 'coding', title: 'Coding', category: 'TECHNOLOGY', icon: Code2, iconColorClass: 'text-purple-400' },
  ],
  college: [
    { id: 'ai', title: 'AI', category: 'TECHNOLOGY', icon: Bot, iconColorClass: 'text-violet-500' },
    { id: 'blockchain', title: 'Blockchain', category: 'TECHNOLOGY', icon: Link, iconColorClass: 'text-cyan-400' },
    { id: 'quantum_physics', title: 'Quantum Physics', category: 'SCIENCE', icon: Atom, iconColorClass: 'text-emerald-400' },
  ],
  default: [
    { id: 'physics', title: 'Physics', category: 'SCIENCE', icon: Atom, iconColorClass: 'text-emerald-400' },
    { id: 'chemistry', title: 'Chemistry', category: 'SCIENCE', icon: FlaskConical, iconColorClass: 'text-cyan-400' },
    { id: 'biology', title: 'Biology', category: 'SCIENCE', icon: Dna, iconColorClass: 'text-pink-400' },
    { id: 'earth_science', title: 'Earth Science', category: 'SCIENCE', icon: Globe, iconColorClass: 'text-sky-400' },
  ]
};

interface DisciplineSelectProps {
  selectedLevel: string;
  onBack: () => void;
  onEnterHub: () => void;
  selectedIds: string[];
  toggleDiscipline: (id: string) => void;
}

export default function DisciplineSelect({ selectedLevel, onBack, onEnterHub, selectedIds, toggleDiscipline }: DisciplineSelectProps) {
  const disciplines = SUBJECTS_BY_LEVEL[selectedLevel] || SUBJECTS_BY_LEVEL.default;
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 z-20 pointer-events-auto fade-in-up flex flex-col items-center pb-20">
      
      <div className="text-center mb-10">
        <h2 className="font-black text-white text-3xl sm:text-4xl md:text-5xl tracking-wide uppercase mb-3 font-mono">
          Select Your STEM Disciplines
        </h2>
        <p className="text-slate-400 text-sm sm:text-base font-medium">Equip your cognitive loadout — choose knowledge domains to master</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
        {disciplines.map(disp => {
          const isSelected = selectedIds.includes(disp.id);
          const Icon: any = disp.icon;
          return (
            <button
              key={disp.id}
              onClick={() => toggleDiscipline(disp.id)}
              className={`group flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 border ${
                isSelected 
                  ? 'border-[#0ea5e9] bg-sky-950/20' 
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
              style={{
                boxShadow: isSelected ? '0 0 20px rgba(14, 165, 233, 0.15)' : 'none'
              }}
            >
              <Icon className={`w-8 h-8 mb-3 transition-transform duration-300 group-hover:scale-110 ${disp.iconColorClass}`} />
              <h3 className="text-white font-bold text-sm sm:text-base mb-1 text-center">{disp.title}</h3>
              <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-4">{disp.category}</p>
              
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                isSelected ? 'bg-sky-500 border-sky-400' : 'bg-transparent border-slate-600'
              }`}>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-8 py-3 rounded-xl border border-white/10 text-white font-semibold uppercase tracking-wider text-sm transition-all hover:bg-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <button
          onClick={onEnterHub}
          disabled={selectedIds.length === 0}
          className="flex items-center gap-2 px-10 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: 'linear-gradient(90deg, rgba(16,185,129,0.8), rgba(6,95,70,0.8))',
            border: '1px solid rgba(52,211,153,0.3)',
            boxShadow: selectedIds.length > 0 ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <div className="w-2.5 h-2.5 border border-white/50 rotate-45 mr-1" />
          Enter The Hub
        </button>
      </div>

    </div>
  );
}
