'use client';

import { Canvas } from '@react-three/fiber';
import { KeyboardControls, OrbitControls, Html, Stars, Float } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { useState, Suspense, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Player } from './Player';

const KnowledgeOrb = ({ position, color, title, engine, isCompleted }: { position: [number, number, number], color: string, title: string, engine?: any, isCompleted?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoreFlash, setScoreFlash] = useState<string | null>(null);

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || isCompleted) return;
    setLoading(true);
    
    try {
      if (engine && engine.questActive) {
        // Quest Mode: Validate answer instead of just chatting
        const result = await engine.validateAnswer(query, "What can you tell me about the specific topic?", title);
        if (result) {
           setResponse(result.feedback + (result.hint ? " Hint: " + result.hint : ""));
           if (result.correct) {
             setScoreFlash(`+${result.score} XP! Correct!`);
             setTimeout(() => setScoreFlash(null), 3000);
             if (engine.markNodeComplete) engine.markNodeComplete(title);
           }
        } else {
           setResponse("Engine failed to validate answer. Try again.");
        }
      } else {
        // Normal Mode: Chat
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query })
        });
        const data = await res.json();
        setResponse(data.response);
      }
    } catch (err) {
      setResponse("Observation disturbed. Failed to query.");
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  return (
    <RigidBody colliders="ball" restitution={0.8} friction={0.1} linearDamping={0.5} position={position}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh 
          onPointerOver={() => { if (!isCompleted) setHovered(true); }} 
          onPointerOut={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); if (!isCompleted) setClicked(!clicked); }}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color={isCompleted ? '#10b981' : color} 
            emissive={isCompleted ? '#10b981' : color} 
            emissiveIntensity={isCompleted ? 0.2 : hovered ? (engine?.emissiveIntensity || 0.8) + 0.5 : (engine?.emissiveIntensity || 0.4)} 
            roughness={0.2}
            metalness={0.8}
          />
          
          {/* HTML Panel that opens when clicked */}
          {clicked && (
            <Html center distanceFactor={10} zIndexRange={[100, 0]}>
              <div className="w-80 p-4 bg-slate-900/90 backdrop-blur-lg border border-blue-500/30 rounded-xl shadow-2xl text-white pointer-events-auto relative">
                
                {scoreFlash && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white px-3 py-1 rounded-full font-bold whitespace-nowrap animate-bounce">
                    {scoreFlash}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-lg text-blue-300">{title}</h4>
                  <button onClick={() => setClicked(false)} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div className="h-40 overflow-y-auto mb-3 text-sm text-gray-300 bg-black/30 p-3 rounded-lg no-scrollbar">
                  {response ? response : (engine?.questActive ? "Quest Active! Provide a summary of your knowledge." : "I am the AI representation of this module. Ask me anything!")}
                </div>

                <form onSubmit={askQuestion} className="flex gap-2">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about this module..."
                    className="flex-1 bg-black/50 border border-blue-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </Html>
          )}
        </mesh>
      </Float>
    </RigidBody>
  );
};

export default function PhysicsBridge({ engine }: { engine?: any }) {
  const [orbs, setOrbs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orbs')
      .then(res => res.json())
      .then(data => {
        if (data.orbs) {
          setOrbs(data.orbs);
        }
      })
      .catch(err => console.error("Failed to fetch orbs:", err));
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
          { name: 'back', keys: ['ArrowDown', 'KeyS'] },
          { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
          { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          { name: 'jump', keys: ['Space'] },
        ]}
      >
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          <color attach="background" args={[engine?.ambientColor || '#020817']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow color={engine?.accentColor || '#ffffff'} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* Add a subtle fog to blend the grid into the horizon */}
          <fog attach="fog" args={[engine?.ambientColor || '#020817', 10, 50]} />

          <Suspense fallback={null}>
            <Physics gravity={engine?.physicsGravity || [0, -9.81, 0]}>
              {/* The Player Avatar */}
              <Player />

              {/* The Ground Plane Map */}
              <RigidBody type="fixed" position={[0, -0.5, 0]}>
                <mesh receiveShadow>
                  <boxGeometry args={[100, 1, 100]} />
                  <meshStandardMaterial color="#0f172a" roughness={1} />
                </mesh>
                {/* Decorative Grid on the floor */}
                <gridHelper args={[100, 100, '#1e293b', '#0f172a']} position={[0, 0.51, 0]} />
              </RigidBody>

              {/* Game Engine Active: Spawn Quest Monuments (Orbs) */}
              {engine?.status === 'active' ? (
                engine.gameConfig.gameplay.targetKnowledge.map((topic: string, i: number) => {
                  const colors = ['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#34d399'];
                  const isCompleted = engine.completedNodes?.includes(topic);
                  
                  return (
                    // Spread them out in a path or semi-circle on the ground
                    <KnowledgeOrb 
                      key={`quest-${i}`} 
                      position={[
                        (i - 2) * 8, 
                        3, 
                        -10 - (i * 2)
                      ]} 
                      color={colors[i % colors.length]} 
                      title={topic} 
                      engine={engine}
                      isCompleted={isCompleted}
                    />
                  );
                })
              ) : orbs.length > 0 ? (
                /* Database Orbs */
                orbs.map((orb, i) => (
                  <KnowledgeOrb 
                    key={orb.id} 
                    position={[
                      (Math.random() - 0.5) * 20, 
                      3, 
                      (Math.random() - 0.5) * 20 - 5
                    ]} 
                    color={orb.color} 
                    title={orb.title} 
                    engine={engine}
                  />
                ))
              ) : (
                // Default Orbs for unauthenticated or first-time
                <>
                  <KnowledgeOrb position={[-5, 2, -5]} color="#3b82f6" title="Cambridge Biology" engine={engine} />
                  <KnowledgeOrb position={[0, 2, -8]} color="#8b5cf6" title="IB Physics" engine={engine} />
                  <KnowledgeOrb position={[5, 2, -5]} color="#10b981" title="History of Uganda" engine={engine} />
                </>
              )}
            </Physics>
          </Suspense>
          
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
