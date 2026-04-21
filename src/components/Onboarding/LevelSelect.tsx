import { Star, Sprout, Atom, FlaskConical, GraduationCap, ArrowLeft } from 'lucide-react';

interface LevelOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType<any>;
  iconColorClass: string;
  bgColorClass: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  { id: 'kindergarten', title: 'Kindergarten', subtitle: 'Ages 4-6', icon: Star, iconColorClass: 'text-pink-400', bgColorClass: 'bg-pink-400/10' },
  { id: 'elementary', title: 'Elementary', subtitle: 'Ages 6-11', icon: Sprout, iconColorClass: 'text-yellow-400', bgColorClass: 'bg-yellow-400/10' },
  { id: 'middle', title: 'Middle School', subtitle: 'Ages 11-14', icon: Atom, iconColorClass: 'text-emerald-400', bgColorClass: 'bg-emerald-400/10' },
  { id: 'high', title: 'High School', subtitle: 'Ages 14-18', icon: FlaskConical, iconColorClass: 'text-blue-400', bgColorClass: 'bg-blue-400/10' },
  { id: 'college', title: 'College', subtitle: 'Ages 18+', icon: GraduationCap, iconColorClass: 'text-purple-400', bgColorClass: 'bg-purple-400/10' },
];

export default function LevelSelect({ onSelect, selectedId, onBack }: { onSelect: (id: string) => void, selectedId?: string | null, onBack?: () => void }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 z-20 pointer-events-auto fade-in-up flex flex-col items-center">
      
      <div className="text-center mb-10 w-full relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 sm:-top-8 sm:translate-y-0 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Hub</span>
          </button>
        )}
        <h2 className="font-black text-white text-3xl sm:text-4xl md:text-5xl tracking-wide uppercase mb-3 flex flex-wrap justify-center items-center font-mono pt-12 sm:pt-0">
          Select Your Level of Study
        </h2>
        <p className="text-slate-400 text-sm sm:text-base font-medium">Choose the memory stream that matches your cognitive tier</p>
      </div>

      <div className="flex flex-nowrap w-full justify-start xl:justify-center overflow-x-auto scrollbar-hide gap-4 md:gap-6 lg:gap-8 pb-8 px-4 snap-x snap-mandatory scroll-smooth">
        {LEVEL_OPTIONS.map(opt => {
          const isSelected = selectedId === opt.id;
          const Icon: any = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`group flex-shrink-0 snap-center flex flex-col items-center justify-center relative rounded-2xl w-40 sm:w-48 aspect-square transition-all duration-300 border ${
                isSelected 
                  ? 'border-[#0ea5e9] bg-white/[0.04]' 
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
              style={{
                boxShadow: isSelected ? '0 0 30px rgba(14, 165, 233, 0.2)' : 'none'
              }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/5 to-transparent rounded-2xl transition-opacity duration-500 pointer-events-none" />

              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${opt.bgColorClass}`}>
                <Icon className={`w-8 h-8 ${opt.iconColorClass}`} />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{opt.title}</h3>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{opt.subtitle}</p>
            </button>
          )
        })}
      </div>
    </div>
  );
}
