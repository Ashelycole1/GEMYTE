'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Html, Sky, Environment, SoftShadows, Float, useKeyboardControls } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, CylinderCollider, BallCollider } from '@react-three/rapier';
import { useRouter } from 'next/navigation';
import { useGemyteEngine, ContentNode } from '@/hooks/useGemyteEngine';
import { ArrowLeft, CheckCircle, Compass, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Custom Components
import AvatarPlayer from './game/AvatarPlayer';
import MobileJoystick from './game/MobileJoystick';
import { useIsMobile } from './game/useControls';
import StartInstructions from './game/StartInstructions';
import SceneryGenerator from './game/SceneryGenerator';
import * as THREE from 'three';

// ── Dimensional Portal Component ──
function DimensionalPortal({ onEnter, position }: { onEnter: () => void, position: [number, number, number] }) {
  return (
    <RigidBody position={position} type="fixed" sensor onIntersectionEnter={(p) => {
      if (p.other.rigidBodyObject?.name !== 'platform') onEnter();
    }}>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <mesh>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={2} wireframe />
        </mesh>
        {/* Core */}
        <mesh>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </Float>
      <Html position={[0, 3, 0]} center>
        <div className="bg-purple-600/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold animate-pulse whitespace-nowrap shadow-[0_0_20px_rgba(192,132,252,0.8)]">
          Enter Next Dimension
        </div>
      </Html>
      <BallCollider args={[2.5]} />
    </RigidBody>
  );
}

// ── Physical Node Platform Component ──
function KnowledgePlatform({
  node,
  color,
  onTrigger,
  isActiveNode,
}: {
  node: ContentNode;
  color: string;
  onTrigger: (node: ContentNode) => void;
  isActiveNode: boolean;
}) {
  return (
    <RigidBody position={node.position} type="fixed" friction={1}>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[4, 1, 4]} />
        <meshStandardMaterial color={isActiveNode ? '#38bdf8' : color} roughness={0.8} />
      </mesh>
      
      {/* Sensor Zone */}
      <CuboidCollider 
        args={[2, 2, 2]} 
        position={[0, 1.5, 0]} 
        sensor 
        onIntersectionEnter={(payload) => {
          if (payload.other.rigidBodyObject?.name !== 'platform' && isActiveNode) {
            onTrigger(node);
          }
        }}
      />

      {/* Floating Hologram */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 3]} />
        <meshStandardMaterial color={isActiveNode ? "#38bdf8" : "#94a3b8"} emissive={isActiveNode ? "#38bdf8" : "#000000"} emissiveIntensity={isActiveNode ? 1 : 0} transparent opacity={0.6} />
      </mesh>

      {/* The Guiding Light Beam (Only for the active node) */}
      {isActiveNode && (
        <mesh position={[0, 50, 0]}>
          <cylinderGeometry args={[0.2, 2, 100]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {isActiveNode && (
        <Html position={[0, 4, 0]} center>
          <div className="bg-sky-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-sky-500/50 flex items-center gap-2 text-sky-200 text-xs font-bold shadow-[0_0_15px_rgba(56,189,248,0.5)]">
             Active Target
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
  const engine = useGemyteEngine();
  
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [showBoss, setShowBoss] = useState(false);
  const [bossResult, setBossResult] = useState<'idle' | 'won' | 'lost'>('idle');
  const [showIntro, setShowIntro] = useState(true);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Game Mechanics State
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(4);
  const [gameOver, setGameOver] = useState(false);
  const [nodeResult, setNodeResult] = useState<'idle' | 'won' | 'lost'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);

  // Check for pending generation on mount
  useEffect(() => {
    const pendingText = localStorage.getItem('pending_gemyte_text');
    if (pendingText && engine.status === 'idle') {
      setIsGenerating(true);
      engine.generateLevel(pendingText).then((config) => {
         if (config) localStorage.setItem('gemyte_game_config', JSON.stringify(config));
         localStorage.removeItem('pending_gemyte_text');
         setIsGenerating(false);
      });
    } else if (engine.status === 'idle') {
      // Try to load existing config if no pending generation
      const raw = localStorage.getItem('gemyte_game_config');
      if (raw) {
         // Dirty hack: simulate generateLevel by pushing raw directly if engine supported it.
         // Since engine exposes generateLevel, we can't easily push raw. 
         // But the user might be reloading. Let's just rely on the fact that if they reload, 
         // they have to regenerate, OR we parse it and use it.
         // Actually, useGemyteEngine doesn't let us hydrate easily.
      }
    }
  }, [engine]);

  // Derived state for the current dimension's nodes
  const cNodes = engine.gameConfig?.contentNodes || [];
  
  // Calculate which node is the "active target"
  // The active target is the FIRST node in the entire array that is NOT in completedNodes.
  const activeNode = useMemo(() => {
    return cNodes.find(n => !engine.completedNodes.includes(n.id.toString()));
  }, [cNodes, engine.completedNodes]);

  // Determine if the current level is "cleared" (all nodes assigned to this level are done)
  // Level 1: nodes 0-2, Level 2: 3-5, Level 3: 6-8
  const levelNodesComplete = useMemo(() => {
    if (cNodes.length === 0) return false;
    
    // Fallback if AI didn't generate exactly 9 nodes: dynamically chunk them by 3
    const nodesPerLevel = Math.max(1, Math.floor(cNodes.length / 3));
    const startIndex = (currentLevel - 1) * nodesPerLevel;
    let endIndex = startIndex + nodesPerLevel;
    if (currentLevel === 3) endIndex = cNodes.length; // Final level gets the rest
    
    const requiredNodes = cNodes.slice(startIndex, endIndex);
    if (requiredNodes.length === 0) return true;

    return requiredNodes.every(n => engine.completedNodes.includes(n.id.toString()));
  }, [cNodes, engine.completedNodes, currentLevel]);

  // The nodes that actually belong to the current level and should be rendered
  const currentDimensionNodes = useMemo(() => {
    const nodesPerLevel = Math.max(1, Math.floor(cNodes.length / 3));
    const startIndex = (currentLevel - 1) * nodesPerLevel;
    let endIndex = startIndex + nodesPerLevel;
    if (currentLevel === 3) endIndex = cNodes.length;
    return cNodes.slice(startIndex, endIndex);
  }, [cNodes, currentLevel]);

  const handleNodeTrigger = (node: ContentNode) => {
    if (selectedNode?.id === node.id || showBoss || gameOver || isGenerating) return;
    if (engine.completedNodes.includes(node.id.toString())) return;
    setSelectedNode(node);
    setNodeResult('idle');
  };

  const handleNodeAnswer = (answer: string) => {
    if (!selectedNode) return;
    const isCorrect = selectedNode.correctAnswer ? answer === selectedNode.correctAnswer : true; 

    if (isCorrect) {
      setCoins(c => c + 1);
      setNodeResult('won');
      engine.markNodeComplete(selectedNode.id.toString());
      
      setTimeout(() => {
        setSelectedNode(null);
        setNodeResult('idle');
      }, 1500);
    } else {
      setNodeResult('lost');
      setLives(l => {
        const nextLives = l - 1;
        if (nextLives <= 0) setTimeout(() => setGameOver(true), 1500);
        return nextLives;
      });
      setTimeout(() => {
        setNodeResult('idle');
        setSelectedNode(null);
      }, 1500);
    }
  };

  const handleBossAnswer = (answer: string) => {
    const bossChallenge = engine.gameConfig.finalBossChallenge;
    if (answer === bossChallenge.correctAnswer) {
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

  const advanceLevel = () => {
    if (currentLevel < 3) {
      // Screen wipe visual effect could go here
      setCurrentLevel(l => l + 1);
    } else {
      setShowBoss(true);
    }
  };

  const themeColors = ['#4ade80', '#38bdf8', '#c084fc'];
  const levelNames = ['The Voxel Realm', 'The Neon City', 'The Shattered Ruins'];
  const currentTheme = themeColors[currentLevel - 1];

  return (
    <div className="w-screen h-screen absolute inset-0 overflow-hidden select-none bg-black">
      
      {/* ── UI Layer ── */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pointer-events-none">
        <div className="flex gap-4 items-center">
          <Link href="/" className="pointer-events-auto flex items-center gap-2 text-white hover:text-sky-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm transition-all text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Retreat
          </Link>
          <div className="bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Dimension {currentLevel}</span>
            <h1 className="text-white font-bold text-sm tracking-wide">
              {levelNames[currentLevel - 1]}
            </h1>
          </div>
        </div>

        {/* Progress & Stats */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {isGenerating ? (
             <div className="flex items-center gap-2 bg-sky-500/20 border border-sky-500/50 backdrop-blur-md px-4 py-2 rounded-full text-sky-200 text-sm font-bold shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                <Loader2 className="w-4 h-4 animate-spin" /> AI Generating Next Knowledge Nodes...
             </div>
          ) : (
             <div className="w-full md:w-64 bg-black/50 rounded-full h-4 border border-white/20 overflow-hidden backdrop-blur-md shadow-inner relative">
               <div 
                 className="h-full transition-all duration-1000 ease-out absolute left-0 top-0 bottom-0"
                 style={{ width: `${cNodes.length ? (engine.completedNodes.length / cNodes.length) * 100 : 0}%`, backgroundColor: currentTheme }}
               />
               <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-widest text-white/80 mix-blend-overlay uppercase">
                 Curriculum Progress
               </span>
             </div>
          )}

          {/* Stats: Coins and Lives */}
          <div className="flex items-center gap-4 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm pointer-events-auto">
            <div className="flex items-center gap-1 font-bold text-yellow-400">
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

      {/* ── Intro Instructions Modal ── */}
      {showIntro && (
        <StartInstructions 
          title="The Learning Dimensions" 
          nodeCount={9}
          onStart={(g) => { setGender(g as any); setShowIntro(false); }} 
        />
      )}

      {/* ── Node Info Panel ── */}
      {selectedNode && !showBoss && !gameOver && (
        <div className="absolute top-36 md:top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-lg px-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sky-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Knowledge Challenge
              </span>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-slate-400 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            {nodeResult === 'idle' ? (
              <>
                <p className="text-white text-lg font-medium leading-relaxed mb-4">
                  {selectedNode.fact}
                </p>
                {selectedNode.question && selectedNode.options ? (
                  <div className="mt-4">
                    <p className="font-bold text-sky-200 mb-3">{selectedNode.question}</p>
                    <div className="flex flex-col gap-2">
                      {selectedNode.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleNodeAnswer(opt)}
                          className="w-full text-left px-4 py-3 bg-white/5 hover:bg-sky-500/20 text-slate-200 hover:text-white rounded-xl border border-white/10 hover:border-sky-400 transition-all font-medium text-sm shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleNodeAnswer('legacy')} 
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white px-4 py-3 rounded-xl font-bold mt-2"
                  >
                    Collect Knowledge
                  </button>
                )}
              </>
            ) : nodeResult === 'won' ? (
              <div className="text-center py-6">
                <div className="text-green-400 text-5xl mb-2">✅</div>
                <h3 className="text-2xl font-bold text-white">Correct!</h3>
                <p className="text-slate-300 font-medium">+1 Coin</p>
              </div>
            ) : (
               <div className="text-center py-6">
                <div className="text-red-500 text-5xl mb-2">❌</div>
                <h3 className="text-2xl font-bold text-white">Incorrect</h3>
                <p className="text-slate-300 font-medium">-1 Life</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Game Over Panel ── */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className="bg-slate-900 border-4 border-red-500 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.6)] text-center animate-in zoom-in-95">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-black text-white mb-2">Game Over</h2>
            <p className="text-slate-400 mb-6 font-medium">You ran out of lives!</p>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
              >
                Restart Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Final Boss Panel ── */}
      {showBoss && engine.gameConfig?.finalBossChallenge && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xl px-4 pointer-events-auto">
          <div className="bg-slate-900 border-4 border-purple-500 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_100px_rgba(168,85,247,0.4)]">
            {bossResult === 'idle' ? (
              <>
                <h2 className="text-purple-400 text-sm font-black uppercase tracking-widest mb-3 text-center">The Final Trial</h2>
                <h3 className="text-white text-2xl font-bold mb-8 text-center leading-snug">
                  {engine.gameConfig.finalBossChallenge.question}
                </h3>
                <div className="flex flex-col gap-3">
                  {engine.gameConfig.finalBossChallenge.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleBossAnswer(opt)}
                      className="w-full text-left px-6 py-4 bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-white rounded-2xl border-2 border-white/10 hover:border-purple-400 transition-all font-semibold text-lg shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : bossResult === 'won' ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-500/50">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3">Campaign Conquered!</h2>
                <p className="text-slate-400 mb-8 text-lg">You are a master of this dimension.</p>
                <button onClick={() => router.push('/')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-3xl font-black text-red-500 mb-3">Incorrect</h2>
                <p className="text-slate-400 mb-8 text-lg">The Boss defeated you.</p>
                <button onClick={() => { setBossResult('idle'); setShowBoss(false); setSelectedNode(null); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-bold text-lg border border-white/10 shadow-lg transition-transform active:scale-95">
                  Retreat and Regroup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Virtual Joystick (Mobile Only) ── */}
      {isMobile && !showBoss && <MobileJoystick />}
      {!isMobile && !showIntro && !selectedNode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-10 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
          <p className="text-white text-sm font-bold tracking-widest uppercase">WASD to Move · SPACE to Jump · Find the Light</p>
        </div>
      )}

      {/* ── 3D Canvas ── */}
      <Canvas>
        {/* Dynamic sky based on level */}
        {currentLevel === 1 && <Sky sunPosition={[100, 20, 100]} />}
        {currentLevel === 2 && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
        {currentLevel === 3 && <Environment preset="night" />}
        
        <Physics gravity={[0, -20, 0]}>
          <SceneryGenerator 
            currentLevel={currentLevel} 
            themeColor={currentTheme} 
          />

          {/* Render Nodes for the current dimension */}
          {!isGenerating && currentDimensionNodes.map((node) => (
            <KnowledgePlatform
              key={node.id}
              node={node}
              color={currentTheme}
              isActiveNode={activeNode?.id === node.id}
              onTrigger={handleNodeTrigger}
            />
          ))}

          {/* Spawn the Portal or Boss if the level is clear */}
          {levelNodesComplete && !isGenerating && (
             currentLevel < 3 ? (
               <DimensionalPortal position={[0, 2, -340]} onEnter={advanceLevel} />
             ) : (
               // Final Boss Portal
               <DimensionalPortal position={[0, 2, -340]} onEnter={() => setShowBoss(true)} />
             )
          )}

          {/* The Player Avatar */}
          <AvatarPlayer key={currentLevel} gender={gender} isPaused={!!selectedNode || showIntro || showBoss || gameOver} />
        </Physics>
      </Canvas>
    </div>
  );
}
