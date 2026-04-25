'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls, Html, Stars, Float } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { useState, Suspense, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Player } from './Player';

const SCROLL_SPEED = 6;

// --- KINEMATIC KNOWLEDGE ORB ---
// Slides to the left constantly. If clicked, it pauses the game to ask a question.
const KnowledgeOrb = ({ 
  initialPosition, 
  color, 
  title, 
  engine, 
  isCompleted, 
  isPaused, 
  setGamePaused 
}: { 
  initialPosition: [number, number, number], 
  color: string, 
  title: string, 
  engine?: any, 
  isCompleted?: boolean,
  isPaused: boolean,
  setGamePaused: (v: boolean) => void
}) => {
  const ref = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoreFlash, setScoreFlash] = useState<string | null>(null);

  // Keep track of the X position accurately
  const curX = useRef(initialPosition[0]);

  useFrame((state, delta) => {
    if (!ref.current || isPaused) return;
    curX.current -= SCROLL_SPEED * delta;
    
    // Loop around to infinity for visual continuous gameplay if missed
    if (curX.current < -15 && !isCompleted) {
        curX.current = 40; 
    }
    
    ref.current.setNextKinematicTranslation({
      x: curX.current,
      y: initialPosition[1] + Math.sin(state.clock.elapsedTime * 2) * 0.5, // gentle bobbing
      z: initialPosition[2]
    });
  });

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || isCompleted) return;
    setLoading(true);
    
    try {
      if (engine && engine.questActive) {
        const result = await engine.validateAnswer(query, "What can you tell me about the specific topic?", title);
        if (result) {
           setResponse(result.feedback + (result.hint ? " Hint: " + result.hint : ""));
           if (result.correct) {
             setScoreFlash(`+${result.score} XP! Correct!`);
             setTimeout(() => {
                 setScoreFlash(null);
                 setClicked(false);
                 setGamePaused(false); // Resume game!
             }, 3000);
             if (engine.markNodeComplete) engine.markNodeComplete(title);
           }
        } else {
           setResponse("Engine failed to validate answer. Try again.");
        }
      }
    } catch (err) {
      setResponse("Observation disturbed. Failed to query.");
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  const handleOrbClick = (e: any) => {
    e.stopPropagation();
    if (!isCompleted) {
      setClicked(true);
      setGamePaused(true); // Pause everything while answering
    }
  };

  return (
    <RigidBody ref={ref} type="kinematicPosition" colliders="ball" position={initialPosition}>
        <mesh 
          onPointerOver={() => { if (!isCompleted) setHovered(true); }} 
          onPointerOut={() => setHovered(false)}
          onClick={handleOrbClick}
        >
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial 
            color={isCompleted ? '#10b981' : color} 
            emissive={isCompleted ? '#10b981' : color} 
            emissiveIntensity={isCompleted ? 0.2 : hovered ? 1 : 0.6} 
            roughness={0.2}
            metalness={0.8}
            wireframe={!isCompleted && hovered}
          />
          
          {/* Internal core */}
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          
          {/* HTML Panel */}
          {clicked && (
            <Html center distanceFactor={15} zIndexRange={[100, 0]}>
              <div className="w-80 p-4 bg-slate-900/95 backdrop-blur-md border border-sky-500/50 rounded-xl shadow-2xl text-white pointer-events-auto relative mt-32">
                {scoreFlash && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                    {scoreFlash}
                  </div>
                )}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-lg text-sky-400">{title}</h4>
                  <button onClick={() => { setClicked(false); setGamePaused(false); }} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="h-40 overflow-y-auto mb-3 text-sm text-gray-300 p-2 bg-black/40 rounded border border-white/5">
                  {response ? response : `Quest Checkpoint: Tell me a fact about ${title} to cross!`}
                </div>
                <form onSubmit={askQuestion} className="flex gap-2">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="..."
                    autoFocus
                    className="flex-1 bg-black/60 border border-sky-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400"
                  />
                  <button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-500 px-3 py-2 rounded-lg font-bold">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </Html>
          )}
        </mesh>
    </RigidBody>
  );
};

// --- FLAPPY PIPES OBSTACLE ---
const Pipe = ({ position, invert, isPaused }: { position: [number, number, number], invert?: boolean, isPaused: boolean }) => {
  const ref = useRef<any>(null);
  const curX = useRef(position[0]);
  
  useFrame((_, delta) => {
    if (!ref.current || isPaused) return;
    curX.current -= SCROLL_SPEED * delta;
    if (curX.current < -20) {
       curX.current = 40; // Loop pipes infinitely
    }
    ref.current.setNextKinematicTranslation({ x: curX.current, y: position[1], z: position[2] });
  });

  return (
    <RigidBody ref={ref} type="kinematicPosition" position={position} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 20, 4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.8} />
      </mesh>
      {/* Pipe cap/lip for detail */}
      <mesh position={[0, invert ? -10.2 : 10.2, 0]}>
         <boxGeometry args={[3.5, 0.5, 4.5]} />
         <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.8} />
      </mesh>
    </RigidBody>
  );
};

export default function PhysicsBridge({ engine }: { engine?: any }) {
  const [orbs, setOrbs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetch('/api/orbs')
      .then(res => res.json())
      .then(data => { if (data.orbs) setOrbs(data.orbs); })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#020817]">
      <KeyboardControls map={[{ name: 'jump', keys: ['Space', 'ArrowUp', 'KeyW'] }]}>
        <Canvas camera={{ position: [0, 5, 20], fov: 50 }}>
          <color attach="background" args={[engine?.ambientColor || '#030712']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} color={engine?.accentColor || '#38bdf8'} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <fog attach="fog" args={[engine?.ambientColor || '#030712', 15, 40]} />

          <Suspense fallback={null}>
            {/* The bird falls quite fast, gravity ~ -15 is good for Flappy style */}
            <Physics gravity={[0, -18, 0]}>
              
              {/* Player Avatar */}
              <Player isPaused={isPaused} />

              {/* Ground and Ceiling bounds (death traps in standard flappy bird, bouncy here) */}
              <RigidBody type="fixed" position={[0, -2, 0]} restitution={0.4}>
                <mesh receiveShadow>
                  <boxGeometry args={[100, 1, 10]} />
                  <meshStandardMaterial color="#020617" />
                </mesh>
              </RigidBody>
              
              <RigidBody type="fixed" position={[0, 15, 0]}>
                <mesh><boxGeometry args={[100, 1, 10]} /><meshBasicMaterial visible={false}/></mesh>
              </RigidBody>

              {/* Spawn Pipes & Content */}
              {engine?.status === 'active' ? (
                <>
                  {/* Flappy Pipes looping in background/foreground. */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const topY = Math.random() * 5 + 10;
                    const botY = topY - 26; // Roughly 6 unit gap between them
                    return (
                      <group key={`pipe-${i}`}>
                        <Pipe position={[10 + i * 12, topY, 0]} isPaused={isPaused} invert />
                        <Pipe position={[10 + i * 12, botY, 0]} isPaused={isPaused} />
                      </group>
                    )
                  })}

                  {/* Spawn Knowledge Nodes between some pipes */}
                  {engine?.gameConfig?.gameplay?.targetKnowledge?.map((topic: string, i: number) => (
                    <KnowledgeOrb 
                      key={`quest-${i}`} 
                      initialPosition={[16 + i * 18, 5 + Math.random() * 4, 0]} 
                      color={['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#34d399'][i % 5]} 
                      title={topic} 
                      engine={engine}
                      isCompleted={engine.completedNodes?.includes(topic)}
                      isPaused={isPaused}
                      setGamePaused={setIsPaused}
                    />
                  ))}
                </>
              ) : (
                /* Default "Waiting Screen" floating orbs (not moving side to side) */
                <>
                  <KnowledgeOrb initialPosition={[-5, 4, 0]} color="#3b82f6" title="Idle State" isPaused={true} setGamePaused={() => {}} />
                  <KnowledgeOrb initialPosition={[5, 6, 0]} color="#10b981" title="Upload a Document" isPaused={true} setGamePaused={() => {}} />
                </>
              )}
            </Physics>
          </Suspense>
          
          {/* Instructional Text in 3D */}
          {!isPaused && (
             <Html center position={[0, -0.5, 0]} className="pointer-events-none opacity-30 text-white font-bold tracking-widest uppercase">
               Press SPACE to Flap
             </Html>
          )}

        </Canvas>
      </KeyboardControls>
    </div>
  );
}
