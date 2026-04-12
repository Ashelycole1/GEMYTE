'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';

const ConstellationStar = ({ data, position }: { data: any, position: [number, number, number] }) => {
  const size = Math.max(0.5, data.xp / 1000);
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2} />
      </mesh>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {data.name}
      </Text>
      <Text
        position={[0, size + 0.1, 0]}
        fontSize={0.3}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {data.xp} XP
      </Text>
    </group>
  );
};

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) {
          // Add random colors and format name
          const formatted = data.leaderboard.map((u: any) => ({
            name: u.isCurrentUser ? 'You' : (u.display_name || 'Anonymous'),
            xp: u.xp,
            color: u.isCurrentUser ? '#6ee7b7' : ['#fef08a', '#93c5fd', '#fca5a5', '#c4b5fd'][Math.floor(Math.random() * 4)]
          }));
          setUsers(formatted);
        }
      })
      .catch(err => console.error("Failed to fetch leaderboard:", err));
  }, []);

  // Generate random positions for top stars
  const positions = useMemo(() => {
    return users.map((_, i) => [
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ] as [number, number, number]);
  }, [users]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950 font-[family-name:var(--font-geist-sans)]">
      {/* 3D Constellation */}
      <div className="w-full h-full absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
          <color attach="background" args={['#050b14']} />
          <ambientLight intensity={0.2} />
          <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
          
          {users.map((data, i) => (
            <ConstellationStar key={i} data={data} position={positions[i]} />
          ))}

          {/* Simple connections (lines) could go here to form the constellation pattern */}
          
          <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={true} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-6">
        <header className="flex justify-between items-center w-full pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bridge</span>
          </Link>
          
          <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-yellow-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold text-white tracking-widest">THE CONSTELLATION</h1>
          </div>
        </header>
      </div>
    </main>
  );
}
