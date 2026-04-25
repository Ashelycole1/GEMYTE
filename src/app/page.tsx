'use client';

import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import PhysicsBridge from "@/components/PhysicsBridge";
import UploadForm from "@/components/UploadForm";
import Link from "next/link";
import { Sparkles, Trophy, ArrowRight, Zap, Menu, X, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useGemyteEngine } from "@/hooks/useGemyteEngine";
import LevelSelect from "@/components/Onboarding/LevelSelect";
import DisciplineSelect from "@/components/Onboarding/DisciplineSelect";
import SystemOverview from "@/components/SystemOverview";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [xp, setXp] = useState<number | null>(null);
  const [workflowStep, setWorkflowStep] = useState<'hero' | 'level' | 'discipline' | 'upload'>('hero');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const engine = useGemyteEngine();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('onboarding') === 'true') {
        setWorkflowStep('level');
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.profile?.xp !== undefined) setXp(data.profile.xp);
        })
        .catch(err => console.error("Failed to fetch XP:", err));
    }
  }, [isSignedIn]);

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: '#030712' }}>
      {/* 3D Background */}
      <PhysicsBridge engine={engine} />

      {/* Gradient overlay for legibility */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(to bottom, rgba(3,7,18,0.85) 0%, rgba(3,7,18,0.25) 50%, rgba(3,7,18,0.75) 100%)'
      }} />

      {/* Full UI layer */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">

        {/* ── NAV ── */}
        <header className="pointer-events-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center float"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 18px rgba(56,189,248,0.4)' }}>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-black text-white tracking-tight">
              GEM<span className="gradient-text">YTE</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/leaderboard"
              className="glass glass-hover text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-full flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Leaderboard
            </Link>

            {!isLoaded ? (
              <div className="w-20 h-9 rounded-full glass animate-pulse" />
            ) : isSignedIn ? (
              <div className="glass flex items-center gap-3 px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-white">
                  {xp !== null ? xp.toLocaleString() : '…'}{' '}
                  <span className="text-slate-400 font-normal">XP</span>
                </span>
                <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <UserButton />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-primary text-sm">Sign In</button>
              </SignInButton>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden glass p-2 rounded-xl text-slate-300"
            onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto sm:hidden mx-4 mb-2 glass rounded-2xl p-4 flex flex-col gap-3 fade-in-up">
            <Link href="/leaderboard"
              className="flex items-center gap-2 text-sm text-slate-300 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}>
              <Trophy className="w-4 h-4 text-yellow-400" />
              Leaderboard
            </Link>
            {isSignedIn ? (
              <div className="flex items-center gap-3 py-2">
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-sm text-white font-semibold">
                  {xp !== null ? xp.toLocaleString() : '…'} XP
                </span>
                <div className="ml-auto"><UserButton /></div>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-primary text-sm w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        )}

        {/* ── HERO ── */}
        {workflowStep === 'hero' && (
        <div className="pointer-events-auto flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 max-w-3xl">
          {/* Badge */}
          <div className="badge-glow inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 self-start fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#38bdf8' }} />
            <span className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
              Powered by Gemini 2.5
            </span>
          </div>

          {/* Headline — fluid sizing */}
          <h1 className="font-black text-white leading-[1.06] mb-4 fade-in-up-delay-1"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 4.5rem)' }}>
            Your <span className="gradient-text">AI Brain</span><br />
            for Smarter<br />
            <span style={{ color: 'rgba(241,245,249,0.8)' }}>Learning.</span>
          </h1>

          {/* Sub */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-7 max-w-md fade-in-up-delay-2">
            Grow smarter with flexible AI solutions. Upload your syllabus, build Knowledge Orbs, and conquer STEM through gamified cognitive challenges.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 fade-in-up-delay-3">
            {isSignedIn ? (
              <>
                <button
                  className="btn-primary text-sm"
                  onClick={() => setWorkflowStep('level')}>
                  Initialize Engine
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link href="/leaderboard" className="btn-ghost text-sm text-center justify-center">
                  View Constellation
                </Link>
              </>
            ) : (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/?onboarding=true">
                  <button className="btn-primary text-sm w-full sm:w-auto justify-center">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </button>
                </SignInButton>
                <Link href="/leaderboard" className="btn-ghost text-sm text-center justify-center">
                  View Constellation
                </Link>
              </>
            )}
          </div>
        </div>
        )}

        {/* ── ONBOARDING / LEVEL SELECT ── */}
        {workflowStep === 'level' && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm overflow-y-auto pointer-events-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="min-h-full flex flex-col justify-center items-center py-20 px-4">
              <LevelSelect 
                selectedId={selectedLevel} 
                onSelect={(id) => {
                  setSelectedLevel(id);
                  setWorkflowStep('discipline');
                }}
                onBack={() => setWorkflowStep('hero')} 
              />
            </div>
          </div>
        )}

        {/* ── ONBOARDING / DISCIPLINE SELECT ── */}
        {workflowStep === 'discipline' && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm overflow-y-auto pointer-events-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="min-h-full flex flex-col justify-center items-center py-20 px-4">
              <DisciplineSelect 
                selectedLevel={selectedLevel!}
                selectedIds={selectedDisciplines}
                toggleDiscipline={(id) => {
                  setSelectedDisciplines(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                }}
                onBack={() => setWorkflowStep('level')}
                onEnterHub={() => setWorkflowStep('upload')}
              />
            </div>
          </div>
        )}

        {/* ── UPLOAD PANEL ── */}
        {workflowStep === 'upload' && isSignedIn && (
          <>
            <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm" onClick={() => setWorkflowStep('hero')} />
            {/* Mobile: full-width bottom sheet */}
            <div className="pointer-events-auto sm:hidden absolute bottom-0 left-0 right-0 z-30 fade-in-up">
              <UploadForm onClose={() => setWorkflowStep('hero')} mobile engine={engine} />
            </div>
            {/* Desktop: floating panel right */}
            <div className="pointer-events-auto hidden lg:flex absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 fade-in-up gap-[100px] items-center">
              <SystemOverview />
              <UploadForm onClose={() => setWorkflowStep('hero')} engine={engine} />
            </div>
          </>
        )}

        {/* ── STATUS FOOTER ── */}
        <footer className="pointer-events-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 fade-in-up-delay-3">
          <div className="flex flex-col gap-2">
            <div className="badge-glow flex items-center gap-2 px-3 py-1.5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${engine.status === "active" ? "bg-emerald-400 pulse-dot" : "bg-sky-400 pulse-dot"}`} />
              <span className={`text-xs font-medium ${engine.status === "active" ? "text-emerald-300" : "text-sky-300"}`}>
                {engine.status === "active" ? "AI Engine Active" : "Physics Engine Active"}
              </span>
            </div>
            
            {engine.questActive && engine.timeLeft !== null && (
              <div className="badge-glow flex items-center gap-2 px-3 py-1.5 rounded-full mt-1 border-yellow-500/30">
                <Timer className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-300 flex font-medium">Session: {Math.floor(engine.timeLeft / 60)}:{(engine.timeLeft % 60).toString().padStart(2, "0")}</span>
              </div>
            )}
          </div>
          
          {isSignedIn && (
            <div className="glass px-3 py-1.5 rounded-full">
              <span className="text-xs text-slate-400">
                Signed in as{' '}
                <span className="text-white font-medium">{user?.firstName || 'Scholar'}</span>
              </span>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}
