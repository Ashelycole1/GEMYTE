'use client';

import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import PhysicsBridge from "@/components/PhysicsBridge";
import UploadForm from "@/components/UploadForm";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      // Fetch XP on load and upsert profile if missing
      fetch('/api/profile', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.profile?.xp !== undefined) {
            setXp(data.profile.xp);
          }
        })
        .catch(err => console.error("Failed to fetch XP:", err));
    }
  }, [isSignedIn]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950 font-[family-name:var(--font-geist-sans)]">
      {/* 3D Background - Physics Bridge */}
      <PhysicsBridge />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-6">
        
        {/* Header */}
        <header className="flex justify-between items-center w-full pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-xl backdrop-blur-md border border-blue-500/30">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              GEMYTE <span className="text-blue-400 font-light text-xl">| AI Engine</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="text-sm font-semibold text-blue-300 hover:text-white transition-colors bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-md">
              Leaderboard
            </Link>
            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
            ) : isSignedIn ? (
              <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-sm text-blue-200">
                  XP: <strong className="text-white">{xp !== null ? xp.toLocaleString() : '...'}</strong>
                </span>
                <div className="w-px h-4 bg-white/20"></div>
                <UserButton />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all text-sm font-semibold">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-start mt-10 pointer-events-auto">
          {isSignedIn ? (
            <UploadForm />
          ) : (
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to GEMYTE</h2>
              <p className="text-blue-200/80 mb-6 leading-relaxed">
                The zero-gravity logic engine for international schools. Sign in to upload syllabi, interact with the Knowledge Orbs, and climb the Constellation.
              </p>
              <SignInButton mode="modal">
                <button className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl transition-all font-semibold w-full">
                  Get Started
                </button>
              </SignInButton>
            </div>
          )}
        </div>

        {/* Footer / Status */}
        <footer className="w-full flex justify-between items-end pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <span className="text-xs text-blue-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Physics Engine Active
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
