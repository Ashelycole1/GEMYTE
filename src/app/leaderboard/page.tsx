'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import Link from 'next/link';
import { ArrowLeft, Trophy, Zap, Crown } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';

const COLORS = ['#fbbf24', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#fb923c'];

const ConstellationStar = ({ data, position }: { data: any; position: [number, number, number] }) => {
  const size = Math.max(0.3, Math.min(data.xp / 800, 2));
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2.5} />
      </mesh>
      <Text
        position={[0, size + 0.6, 0]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {data.name}
      </Text>
      <Text
        position={[0, size + 0.15, 0]}
        fontSize={0.28}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {data.xp.toLocaleString()} XP
      </Text>
    </group>
  );
};

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) {
          const formatted = data.leaderboard.map((u: any, i: number) => ({
            name: u.isCurrentUser ? 'You ✦' : (u.display_name || 'Scholar'),
            xp: u.xp,
            rank: u.rank,
            isCurrentUser: u.isCurrentUser,
            color: u.isCurrentUser ? '#34d399' : COLORS[i % COLORS.length],
          }));
          setUsers(formatted);
        }
      })
      .catch(err => console.error('Leaderboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const positions = useMemo(() =>
    users.map(() => [
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 10,
    ] as [number, number, number]),
    [users]
  );

  const top3 = users.slice(0, 3);

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: '#030712' }}>
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 22], fov: 50 }}>
          <color attach="background" args={['#030712']} />
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 0, 10]} intensity={1} color="#38bdf8" />
          <Stars radius={120} depth={60} count={5000} factor={3} saturation={0.3} fade speed={0.4} />
          {users.map((data, i) => (
            <ConstellationStar key={i} data={data} position={positions[i]} />
          ))}
          <OrbitControls autoRotate autoRotateSpeed={0.4} enableZoom enablePan={false} />
        </Canvas>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col p-6 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(3,7,18,0.75) 0%, transparent 35%, rgba(3,7,18,0.5) 100%)' }}>

        {/* Nav */}
        <header className="flex justify-between items-center w-full pointer-events-auto fade-in-up">
          <Link href="/"
            className="glass glass-hover flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-full transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Bridge
          </Link>

          <div className="glass flex items-center gap-3 px-5 py-2.5 rounded-2xl"
            style={{ boxShadow: '0 0 20px rgba(251,191,36,0.15)' }}>
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h1 className="text-base font-bold text-white tracking-widest uppercase">The Constellation</h1>
          </div>
        </header>

        {/* Top 3 leaderboard strip at bottom */}
        <div className="mt-auto pointer-events-auto">
          {loading ? (
            <div className="flex justify-center pb-6">
              <div className="glass px-6 py-3 rounded-2xl text-slate-400 text-sm animate-pulse">Loading Constellation…</div>
            </div>
          ) : top3.length > 0 ? (
            <div className="fade-in-up flex justify-center gap-3 pb-4">
              {top3.map((u, i) => (
                <div key={i}
                  className="glass glass-hover flex items-center gap-3 px-5 py-3 rounded-2xl cursor-default"
                  style={{ borderColor: i === 0 ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)' }}>
                  {i === 0 && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: u.color }} />
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{u.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-sky-400" />
                      {u.xp.toLocaleString()} XP
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 ml-1">#{u.rank}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center pb-6">
              <div className="glass px-6 py-4 rounded-2xl text-center max-w-xs">
                <p className="text-white font-semibold text-sm mb-1">The Constellation is empty</p>
                <p className="text-slate-400 text-xs">Sign in, upload a syllabus, and be the first star.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
