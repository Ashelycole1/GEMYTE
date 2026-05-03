'use client'

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { User, Zap, BookOpen, Target } from 'lucide-react';

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
    <AnimatePresence>
      <motion.div
        key="start-screen"
        className="absolute inset-0 z-[100] scanline"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f0c29 50%, #020617 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Aceternity Spotlight */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="rgba(99,102,241,0.8)"
        />

        {/* Full-screen layout: Left lore | Right 3D Scene */}
        <div className="relative w-full h-full flex flex-col lg:flex-row">

          {/* ─── LEFT PANEL ─── */}
          <div className="relative z-10 flex flex-col justify-center flex-1 px-8 md:px-16 py-12 lg:py-0 overflow-y-auto">

            {/* Mission Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-indigo-300 text-[10px] font-bold tracking-[0.3em] uppercase">Mission Active</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-none mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                  {title.split(' ').slice(0, -1).join(' ')}
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                  {title.split(' ').slice(-1)[0]}
                </span>
              </h1>

              {/* Difficulty */}
              <div className="flex items-center gap-3 mt-4 mb-8">
                <span className="text-slate-500 text-xs tracking-[0.2em] uppercase font-semibold">Knowledge Tier</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`w-5 h-1.5 rounded-full ${i <= 3 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Mission Briefing Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="space-y-3 mb-8"
            >
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  You have been deployed into a <span className="text-white font-semibold">live knowledge simulation</span>. The terrain is unstable — scattered learning nodes await recovery.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-400/[0.06] border border-amber-400/20 backdrop-blur-sm">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-amber-200/80 text-sm leading-relaxed font-medium">
                  <span className="text-amber-300 font-bold">Objective:</span> Navigate using WASD or Joystick. Recover{' '}
                  <span className="text-amber-300 font-black text-base">{nodeCount}</span> knowledge beacons to unlock the Final Sequence.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-400/[0.05] border border-emerald-400/20 backdrop-blur-sm">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Each beacon activates a <span className="text-emerald-300 font-semibold">Concept Module</span>. Master all to earn XP and ascend the Scholar Ranks.
                </p>
              </div>
            </motion.div>

            {/* Character Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="mb-8"
            >
              <span className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 block">Select Agent Profile</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 transition-all duration-300 text-sm font-bold tracking-widest uppercase ${
                    gender === 'male'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                      : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70 bg-white/[0.02]'
                  }`}
                >
                  <User className={`w-4 h-4 ${gender === 'male' ? 'text-indigo-400' : ''}`} />
                  Agent M
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 transition-all duration-300 text-sm font-bold tracking-widest uppercase ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-500/20 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                      : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70 bg-white/[0.02]'
                  }`}
                >
                  <User className={`w-4 h-4 ${gender === 'female' ? 'text-pink-400' : ''}`} />
                  Agent F
                </button>
              </div>
            </motion.div>

            {/* GLOWING LAUNCH BUTTON */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5, type: 'spring', stiffness: 200 }}
            >
              <button
                onClick={() => onStart(gender)}
                className="glow-ring relative w-full group flex items-center justify-center gap-4 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white font-black tracking-[0.2em] uppercase text-base overflow-hidden border border-indigo-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                {/* Radial highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]" />
                
                <Zap className="w-5 h-5 fill-current relative z-10" />
                <span className="relative z-10">Deploy into Simulation</span>
                <Zap className="w-5 h-5 fill-current relative z-10" />
              </button>
            </motion.div>

          </div>

          {/* ─── RIGHT PANEL: 3D Spline Scene ─── */}
          <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
            {/* Vignette edges */}
            <div className="absolute inset-0 z-10 pointer-events-none"
              style={{ boxShadow: 'inset 80px 0 120px #020617, inset 0 0 80px rgba(2,6,23,0.5)' }}
            />
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
