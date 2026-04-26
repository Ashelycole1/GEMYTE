'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Html, Sky, Environment, SoftShadows } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';
import { useRouter } from 'next/navigation';
import { GameConfig, ContentNode } from '@/hooks/useGemyteEngine';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Custom Components
import AvatarPlayer from './game/AvatarPlayer';
import MobileJoystick from './game/MobileJoystick';
import { useIsMobile } from './game/useControls';
import StartInstructions from './game/StartInstructions';
import MiniRadar from './game/MiniRadar';
import SceneryGenerator from './game/SceneryGenerator';

// ── Physical Node Platform Component ──
function KnowledgePlatform({
  node,
  color,
  onTrigger,
  isCompleted,
}: {
  node: ContentNode;
  color: string;
  onTrigger: (node: ContentNode) => void;
  isCompleted: boolean;
}) {
  return (
    <RigidBody position={node.position} type="fixed" friction={1}>
      {/* Platform block */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[4, 1, 4]} />
        <meshStandardMaterial color={isCompleted ? '#10b981' : color} roughness={0.8} />
      </mesh>
      
      {/* Dirt bottom */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[3.8, 1, 3.8]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </mesh>

      {/* Sensor Zone (Triggers when player walks into it) */}
      <CuboidCollider 
        args={[2, 2, 2]} 
        position={[0, 1.5, 0]} 
        sensor 
        onIntersectionEnter={(payload) => {
          // If the player collider hits the sensor
          if (payload.other.rigidBodyObject?.name !== 'platform') {
            onTrigger(node);
          }
        }}
      />

      {/* Floating Hologram / Tree to mark node visually */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 3]} />
        <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={isCompleted ? 0 : 0.5} transparent opacity={0.6} />
      </mesh>

      {isCompleted && (
        <Html position={[0, 3.5, 0]} center>
          <div className="bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/50 flex items-center gap-2 text-emerald-200 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <CheckCircle className="w-3 h-3" /> Captured
          </div>
        </Html>
      )}
    </RigidBody>
  );
}

// ── Main Game Component ──
export default function WorldSpawner() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<number[]>([]);
  const [showBoss, setShowBoss] = useState(false);
  const [bossResult, setBossResult] = useState<'idle' | 'won' | 'lost'>('idle');
  const [showIntro, setShowIntro] = useState(true);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Game Mechanics State
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(4);
  const [gameOver, setGameOver] = useState(false);
  const [nodeResult, setNodeResult] = useState<'idle' | 'won' | 'lost'>('idle');

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

  const handleNodeTrigger = (node: ContentNode) => {
    if (selectedNode?.id === node.id || showBoss || gameOver) return; // Debounce
    if (completedNodes.includes(node.id)) return;
    setSelectedNode(node);
    setNodeResult('idle');
  };

  const handleNodeAnswer = (answer: string) => {
    if (!selectedNode) return;
    
    const isCorrect = selectedNode.correctAnswer 
      ? answer === selectedNode.correctAnswer 
      : true; 

    if (isCorrect) {
      setCoins(c => c + 1);
      setNodeResult('won');
      
      setCompletedNodes((prev) => {
        if (prev.includes(selectedNode.id)) return prev;
        const next = [...prev, selectedNode.id];
        if (config && next.length === config.contentNodes.length) {
          setTimeout(() => setShowBoss(true), 2000);
        }
        return next;
      });
      
      setTimeout(() => {
        setSelectedNode(null);
        setNodeResult('idle');
      }, 1500);
    } else {
      setNodeResult('lost');
      setLives(l => {
        const nextLives = l - 1;
        if (nextLives <= 0) {
          setTimeout(() => setGameOver(true), 1500);
        }
        return nextLives;
      });
      
      setTimeout(() => {
        setNodeResult('idle');
        setSelectedNode(null);
      }, 1500);
    }
  };

  const handleBossAnswer = (answer: string) => {
    if (answer === config.finalBossChallenge.correctAnswer) {
      setBossResult('won');
      setCoins(c => c + 5);
    } else {
      setBossResult('lost');
      setLives(l => {
        const next = l - 1;
        if (next <= 0) setTimeout(() => setGameOver(true), 1500);
        return next;
      });
    }
  };

  const cNodes = config.contentNodes || [];
  const progress = cNodes.length === 0 ? 0 : (completedNodes.length / cNodes.length) * 100;

  return (
    <div className="w-screen h-screen absolute inset-0 overflow-hidden select-none" style={{ backgroundColor: '#87CEEB' }}>
      
      {/* ── UI Layer ── */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pointer-events-none">
        <div className="flex gap-4 items-center">
          <Link href="/" className="pointer-events-auto flex items-center gap-2 text-slate-800 hover:text-black bg-white/50 px-3 py-1.5 rounded-lg border border-white/50 backdrop-blur-sm transition-all text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Exit
          </Link>
          <div className="bg-white/80 border border-white/50 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm">
            <h1 className="text-slate-900 font-bold text-sm tracking-wide">
              {config.worldMeta?.title || 'Unknown World'}
            </h1>
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Progress Bar */}
          <div className="w-full md:w-64 bg-slate-200/50 rounded-full h-4 border border-white/50 overflow-hidden backdrop-blur-md shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stats: Coins and Lives */}
          <div className="flex items-center gap-4 bg-white/80 border border-white/50 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm pointer-events-auto">
            <div className="flex items-center gap-1 font-bold text-yellow-600">
              <span className="text-lg leading-none">🪙</span> {coins}
            </div>
            <div className="flex items-center gap-1 text-red-500 text-lg leading-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={i < lives ? "opacity-100" : "opacity-20 grayscale"}>❤️</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Optional: MiniMap Radar ── */}
      {!showIntro && !showBoss && (
        <MiniRadar nodes={cNodes} completedIds={completedNodes} />
      )}

      {/* ── Intro Instructions Modal ── */}
      {showIntro && (
        <StartInstructions 
          title={config.worldMeta?.title || 'Unknown World'} 
          nodeCount={cNodes.length}
          onStart={(g) => { setGender(g as any); setShowIntro(false); }} 
        />
      )}

      {/* ── Node Info Panel ── */}
      {selectedNode && !showBoss && !gameOver && (
        <div className="absolute top-36 md:top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-lg px-4">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Knowledge Challenge
              </span>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-slate-400 hover:text-slate-800 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            {nodeResult === 'idle' ? (
              <>
                <p className="text-slate-800 text-lg font-medium leading-relaxed mb-4">
                  {selectedNode.fact}
                </p>
                {selectedNode.question && selectedNode.options ? (
                  <div className="mt-4">
                    <p className="font-bold text-slate-900 mb-3">{selectedNode.question}</p>
                    <div className="flex flex-col gap-2">
                      {selectedNode.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleNodeAnswer(opt)}
                          className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-800 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all font-medium text-sm shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleNodeAnswer('legacy')} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold mt-2"
                  >
                    Collect Knowledge
                  </button>
                )}
              </>
            ) : nodeResult === 'won' ? (
              <div className="text-center py-6">
                <div className="text-green-500 text-5xl mb-2">✅</div>
                <h3 className="text-2xl font-bold text-slate-900">Correct!</h3>
                <p className="text-slate-600 font-medium">+1 Coin</p>
              </div>
            ) : (
               <div className="text-center py-6">
                <div className="text-red-500 text-5xl mb-2">❌</div>
                <h3 className="text-2xl font-bold text-slate-900">Incorrect</h3>
                <p className="text-slate-600 font-medium">-1 Life</p>
              </div>
            )}
            
            {nodeResult === 'idle' && (
              <div className="mt-4 text-xs text-slate-500 font-medium text-center">Answer correctly to earn coins!</div>
            )}
          </div>
        </div>
      )}

      {/* ── Game Over Panel ── */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className="bg-white border-4 border-red-500 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.6)] text-center animate-in zoom-in-95">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Game Over</h2>
            <p className="text-slate-600 mb-6 font-medium">You ran out of lives!</p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setLives(4);
                  setCoins(0);
                  setCompletedNodes([]);
                  setGameOver(false);
                  setShowBoss(false);
                  setSelectedNode(null);
                  setBossResult('idle');
                }} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
              >
                Try Again
              </button>
              <Link href="/" className="flex-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center">
                Exit
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Final Boss Panel ── */}
      {showBoss && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-4 pointer-events-auto">
          <div className="bg-white border-4 border-indigo-500 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(99,102,241,0.6)]">
            {bossResult === 'idle' ? (
              <>
                <h2 className="text-indigo-600 text-sm font-black uppercase tracking-widest mb-3 text-center">Final Boss Sequence</h2>
                <h3 className="text-slate-900 text-2xl font-bold mb-8 text-center leading-snug">
                  {config.finalBossChallenge.question}
                </h3>
                <div className="flex flex-col gap-3">
                  {config.finalBossChallenge.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleBossAnswer(opt)}
                      className="w-full text-left px-6 py-4 bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 transition-all font-semibold text-lg shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : bossResult === 'won' ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">World Conquered!</h2>
                <p className="text-slate-600 mb-8 text-lg">You've mastered this dimension.</p>
                <button onClick={() => router.push('/')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-3xl font-black text-red-500 mb-3">Incorrect</h2>
                <p className="text-slate-600 mb-8 text-lg">That wasn't right. The boss blocked your attack.</p>
                <button onClick={() => { setBossResult('idle'); setShowBoss(false); setSelectedNode(null); }} className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                  Retreat and Keep Studying
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Virtual Joystick (Mobile Only) ── */}
      {isMobile && !showBoss && <MobileJoystick />}
      {!isMobile && completedNodes.length === 0 && !selectedNode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-10 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
          <p className="text-white text-sm font-bold tracking-widest uppercase">Use WASD to Move · SPACE to Jump</p>
        </div>
      )}

      {/* ── 3D Canvas ── */}
      <Canvas>
        {/* Environment map for realistic PBR reflections instead of plastic flat lighting */}
        <Environment preset={config.worldMeta?.sky === 'Night' ? 'night' : 'sunset'} />
        
        <Sky sunPosition={config.worldMeta?.sky === 'Night' ? [0, -100, 0] : [100, 20, 100]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[-50, 50, -50]} intensity={1.5} color={config.worldMeta?.themeColor || '#ffffff'}>
          <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
        </directionalLight>
        
        <Physics gravity={[0, -20, 0]}>
          {/* Scenery Generation Layer */}
          <SceneryGenerator 
            themeColor={config.worldMeta?.themeColor || '#3b82f6'} 
            environmentType={config.worldMeta?.environmentType || 'DEFAULT'} 
          />

          {/* Invisible rigid body floor to catch players (graphics are handled in SceneryGenerator) */}
          <RigidBody type="fixed" friction={1}>
            {/* The actual physics floor the player walks on */}
            <CuboidCollider position={[0, -1, 0]} args={[500, 1, 500]} />
            
            {/* Base underground dirt (for visual depth if they fall off the edge) */}
            <mesh position={[0, -5, 0]}>
              <boxGeometry args={[1000, 6, 1000]} />
              <meshStandardMaterial color="#78350f" /> 
            </mesh>

            {/* Invisible boundaries to prevent falling off the world */}
            <CuboidCollider position={[0, 50, -500]} args={[500, 100, 1]} />
            <CuboidCollider position={[0, 50, 500]} args={[500, 100, 1]} />
            <CuboidCollider position={[-500, 50, 0]} args={[1, 100, 500]} />
            <CuboidCollider position={[500, 50, 0]} args={[1, 100, 500]} />
          </RigidBody>

          {/* Procedural Knowledge Platforms */}
          {cNodes.map((node) => (
            <KnowledgePlatform
              key={node.id}
              node={node}
              color={config.worldMeta?.themeColor || '#3b82f6'}
              isCompleted={completedNodes.includes(node.id)}
              onTrigger={handleNodeTrigger}
            />
          ))}

          {/* The Player Avatar */}
          <AvatarPlayer gender={gender} />
        </Physics>
      </Canvas>
    </div>
  );
}
