'use client';

import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import PhysicsBridge from "@/components/PhysicsBridge";
import UploadForm from "@/components/UploadForm";
import Link from "next/link";
import { Sparkles, Trophy, ArrowRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [xp, setXp] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);

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
      <PhysicsBridge />

      {/* Dark overlay gradient for text legibility */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(3,7,18,0.3) 40%, rgba(3,7,18,0.6) 100%)'
      }} />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col p-6 pointer-events-none">

        {/* ── NAV ── */}
        <header className="flex justify-between items-center w-full pointer-events-auto fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center float"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 20px rgba(56,189,248,0.4)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              GEM<span className="gradient-text">YTE</span>
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/leaderboard"
              className="glass glass-hover text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-full transition-all flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Leaderboard
            </Link>

            {!isLoaded ? (
              <div className="w-20 h-9 rounded-full glass animate-pulse" />
            ) : isSignedIn ? (
              <div className="glass flex items-center gap-3 px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-white">
                  {xp !== null ? xp.toLocaleString() : '…'} <span className="text-slate-400 font-normal">XP</span>
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
        </header>

        {/* ── HERO ── */}
        <div className="flex-1 flex flex-col items-start justify-center max-w-2xl pointer-events-auto" style={{ paddingLeft: '2rem' }}>

          {/* Badge */}
          <div className="badge-glow flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#38bdf8' }} />
            <span className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
              Powered by Gemini 2.5
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.08] mb-5 fade-in-up-delay-1">
            Your <span className="gradient-text">AI Brain</span><br />
            for Smarter<br />
            <span style={{ color: 'rgba(241,245,249,0.85)' }}>Learning.</span>
          </h1>

          {/* Sub */}
          <p className="text-base text-slate-400 leading-relaxed mb-8 max-w-md fade-in-up-delay-2">
            Upload any syllabus and watch it transform into living knowledge orbs. Ask questions, earn XP, and climb the Constellation.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 fade-in-up-delay-3">
            {isSignedIn ? (
              <button className="btn-primary text-sm" onClick={() => setShowUpload(v => !v)}>
                {showUpload ? 'Close Panel' : 'Upload Syllabus'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-primary text-sm">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            )}
            <Link href="/leaderboard" className="btn-ghost text-sm">
              View Constellation
            </Link>
          </div>
        </div>

        {/* ── UPLOAD PANEL (slide-in) ── */}
        {showUpload && isSignedIn && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-auto z-20 fade-in-up">
            <UploadForm onClose={() => setShowUpload(false)} />
          </div>
        )}

        {/* ── STATUS BAR ── */}
        <footer className="flex justify-between items-end pointer-events-auto fade-in-up-delay-3">
          <div className="badge-glow flex items-center gap-2 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-emerald-300 font-medium">Physics Engine Active</span>
          </div>
          {isSignedIn && (
            <div className="glass px-3 py-1.5 rounded-full">
              <span className="text-xs text-slate-400">
                Signed in as <span className="text-white font-medium">{user?.firstName || 'Scholar'}</span>
              </span>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}
