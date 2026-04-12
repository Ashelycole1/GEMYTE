'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, Html } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { GameConfig, ContentNode } from '@/hooks/useGemyteEngine';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// ── 3D Node Component ─────────────────────────────────────────────────────────
function KnowledgeNode({
  node,
  color,
  onInteract,
  isCompleted,
}: {
  node: ContentNode;
  color: string;
  onInteract: (node: ContentNode) => void;
  isCompleted: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh
        position={node.position}
        onClick={(e) => {
          e.stopPropagation();
          onInteract(node);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Core sphere */}
        <sphereGeometry args={[isCompleted ? 0.8 : 1.2, 32, 32]} />
        <meshStandardMaterial
          color={isCompleted ? '#10b981' : color}
          emissive={isCompleted ? '#10b981' : color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
        
        {/* Label floating above node */}
        <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div className={`transition-opacity duration-300 ${hovered || isCompleted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 shadow-xl whitespace-nowrap font-medium flex items-center gap-2">
              {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              Node {node.id}
            </div>
          </div>
        </Html>

        {/* Pulse effect if not completed */}
        {!isCompleted && hovered && (
          <mesh>
            <sphereGeometry args={[1.4, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
          </mesh>
        )}
      </mesh>
    </Float>
  );
}

// ── Main Game Component ───────────────────────────────────────────────────────
export default function WorldSpawner() {
  const router = useRouter();
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<number[]>([]);
  const [showBoss, setShowBoss] = useState(false);
  const [bossResult, setBossResult] = useState<'idle' | 'won' | 'lost'>('idle');

  // Load config
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gemyte_game_config');
      if (raw) setConfig(JSON.parse(raw));
    } catch {}
  }, []);

  if (!config) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#010714] text-white">
        <p className="mb-4">No world configured.</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 rounded-lg">Go Back</Link>
      </div>
    );
  }

  const handleNodeClick = (node: ContentNode) => {
    setSelectedNode(node);
    if (!completedNodes.includes(node.id)) {
      setCompletedNodes((prev) => {
        const next = [...prev, node.id];
        // Trigger boss fight if all nodes completed
        if (next.length === config.contentNodes.length) {
          setTimeout(() => setShowBoss(true), 2000);
        }
        return next;
      });
    }
  };

  const handleBossAnswer = (answer: string) => {
    if (answer === config.finalBossChallenge.correctAnswer) {
      setBossResult('won');
    } else {
      setBossResult('lost');
    }
  };

  const cNodes = config.contentNodes || [];
  const progress = cNodes.length === 0 ? 0 : (completedNodes.length / cNodes.length) * 100;

  return (
    <div className="w-full min-h-screen relative" style={{ backgroundColor: '#020617' }}>
      
      {/* ── UI Layer ────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex gap-4 items-center">
          <Link href="/" className="pointer-events-auto flex items-center gap-2 text-slate-400 hover:text-white bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm transition-all text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Exit World
          </Link>
          <div className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm px-4 py-1.5 rounded-lg">
            <h1 className="text-white font-bold text-sm tracking-wide">
              {config.worldMeta?.title || 'Unknown World'}
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-48 bg-slate-800 rounded-full h-3 border border-slate-700/50 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Node Info Panel ─────────────────────────────────────────────── */}
      {selectedNode && !showBoss && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-lg px-4">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-start mb-2">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Knowledge Extracted
              </span>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-white text-lg font-medium leading-relaxed">
              {selectedNode.fact}
            </p>
          </div>
        </div>
      )}

      {/* ── Final Boss Panel ────────────────────────────────────────────── */}
      {showBoss && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 pointer-events-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-xl w-full shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]">
            {bossResult === 'idle' ? (
              <>
                <h2 className="text-purple-400 text-sm font-bold uppercase tracking-widest mb-2 text-center">Final Challenge</h2>
                <h3 className="text-white text-xl font-medium mb-6 text-center leading-snug">
                  {config.finalBossChallenge.question}
                </h3>
                <div className="flex flex-col gap-3">
                  {config.finalBossChallenge.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleBossAnswer(opt)}
                      className="w-full text-left px-5 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 hover:border-purple-500 transition-all font-medium"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : bossResult === 'won' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">World Conquered!</h2>
                <p className="text-slate-400 mb-6">You've mastered this topic and earned full XP.</p>
                <button onClick={() => router.push('/')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <h2 className="text-2xl font-bold text-red-400 mb-2">Incorrect</h2>
                <p className="text-slate-400 mb-6">That wasn't the right answer. Review the nodes and try again.</p>
                <button onClick={() => { setBossResult('idle'); setShowBoss(false); setSelectedNode(null); }} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  Keep Studying
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3D Canvas ───────────────────────────────────────────────────── */}
      <Canvas camera={{ position: [0, 5, 12], fov: 60 }} className="absolute inset-0 z-0 cursor-crosshair">
        <fog attach="fog" args={['#020617', 5, 25]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} color={config.worldMeta?.themeColor || '#ffffff'} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        {cNodes.map((node) => (
          <KnowledgeNode
            key={node.id}
            node={node}
            color={config.worldMeta?.themeColor || '#3b82f6'}
            isCompleted={completedNodes.includes(node.id)}
            onInteract={handleNodeClick}
          />
        ))}

        <OrbitControls 
          enablePan={false} 
          minDistance={3} 
          maxDistance={20}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* Environment Base */}
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#020617" roughness={1} metalness={0} />
          <gridHelper args={[100, 20]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
        </mesh>
      </Canvas>
      
      {/* ── Instructions overlay (disappears on interaction) */}
      {completedNodes.length === 0 && !selectedNode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center animate-pulse">
          <p className="text-white/50 text-sm font-medium tracking-widest uppercase">Drag to Rotate · Click Orbs to Learn</p>
        </div>
      )}
    </div>
  );
}
