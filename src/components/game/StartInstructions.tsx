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

  const words = title.split(' ');
  const lastWord = words.slice(-1)[0];
  const firstWords = words.slice(0, -1).join(' ');

  return (
    <AnimatePresence>
      <motion.div
        key="start-screen"
        className="absolute inset-0 z-[100] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f0c29 50%, #020617 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(99,102,241,0.7)" />

        {/* ══════════════════════════════════════════
            LAYOUT: fills 100% width & height, no scroll
        ══════════════════════════════════════════ */}
        <div className="w-full h-full flex flex-col lg:flex-row">

          {/* ── LEFT CONTENT PANEL ── */}
          <div className="
            relative z-10 flex flex-col justify-center
            w-full lg:w-[52%] h-full
            px-5 sm:px-8 md:px-12 lg:px-14
            py-4 sm:py-6
            overflow-hidden
          ">

            {/* Mission Active badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex items-center gap-2 mb-3 sm:mb-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-indigo-300 text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase">Mission Active</span>
              </div>
            </motion.div>

            {/* Title — scales fluidly */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mb-3 sm:mb-4"
            >
              <h1 className="font-black tracking-tight uppercase leading-[0.9] text-[clamp(2rem,5.5vw,4rem)]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                  {firstWords}
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
                  {lastWord}
                </span>
              </h1>

              {/* Knowledge Tier */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-500 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-semibold">Knowledge Tier</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-4 h-1 rounded-full ${i <= 3 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Mission Cards — compact, no scroll */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col gap-2 mb-3 sm:mb-4"
            >
              {/* Card 1 */}
              <div className="flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                </div>
                <p className="text-slate-300 text-[11px] sm:text-xs leading-snug">
                  You've entered a <span className="text-white font-semibold">live knowledge simulation</span>. Scattered learning nodes await recovery across the terrain.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl bg-amber-400/[0.07] border border-amber-400/20 backdrop-blur-sm">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
                <p className="text-amber-200/80 text-[11px] sm:text-xs leading-snug font-medium">
                  <span className="text-amber-300 font-bold">Objective: </span>
                  Use WASD or Joystick. Recover{' '}
                  <span className="text-amber-300 font-black">{nodeCount}</span>{' '}
                  beacons to unlock the Final Sequence.
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl bg-emerald-400/[0.05] border border-emerald-400/20 backdrop-blur-sm">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
                <p className="text-slate-300 text-[11px] sm:text-xs leading-snug">
                  Each beacon unlocks a <span className="text-emerald-300 font-semibold">Concept Module</span>. Master all to earn XP and rise through Scholar Ranks.
                </p>
              </div>
            </motion.div>

            {/* Agent Selector */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mb-3 sm:mb-4"
            >
              <span className="text-slate-500 text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase mb-2 block">
                Select Agent Profile
              </span>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 text-xs sm:text-sm font-bold tracking-widest uppercase ${
                    gender === 'male'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.3)]'
                      : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70 bg-white/[0.02]'
                  }`}
                >
                  <User className={`w-3.5 h-3.5 ${gender === 'male' ? 'text-indigo-400' : ''}`} />
                  Agent M
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 text-xs sm:text-sm font-bold tracking-widest uppercase ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-500/20 text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.3)]'
                      : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70 bg-white/[0.02]'
                  }`}
                >
                  <User className={`w-3.5 h-3.5 ${gender === 'female' ? 'text-pink-400' : ''}`} />
                  Agent F
                </button>
              </div>
            </motion.div>

            {/* GLOWING LAUNCH BUTTON */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5, type: 'spring', stiffness: 180 }}
            >
              <button
                onClick={() => onStart(gender)}
                className="glow-ring relative w-full group flex items-center justify-center gap-3 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white font-black tracking-[0.2em] uppercase text-sm sm:text-base overflow-hidden border border-indigo-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                <Zap className="w-4 h-4 fill-current relative z-10" />
                <span className="relative z-10">Deploy into Simulation</span>
                <Zap className="w-4 h-4 fill-current relative z-10" />
              </button>
            </motion.div>

          </div>

          {/* ── RIGHT PANEL: 3D Spline (desktop/tablet only) ── */}
          <div className="hidden lg:flex flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ boxShadow: 'inset 100px 0 140px #020617, inset 0 80px 80px rgba(2,6,23,0.4), inset 0 -80px 80px rgba(2,6,23,0.4)' }}
            />
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>

          {/* ── MOBILE / TABLET: Subtle 3D robot behind content ── */}
          <div
            className="lg:hidden absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{ maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 75%)' }}
          >
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full scale-110"
            />
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
