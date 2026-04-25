import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateWorld } from '../utils/worldGenerator'
import { Sphere, Box, Tetrahedron, Html, Sparkles } from '@react-three/drei'
import type { LevelBlueprint } from '../types'
import { useGameStore } from '../store/useGameStore'

interface OrbitingNodeProps {
  nodeData: any;
}

function OrbitingNode({ nodeData }: OrbitingNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const setActiveNode = useGameStore(state => state.setActiveNode);
  const conqueredStatus = useGameStore(state => state.conqueredStatus);
  const status = conqueredStatus[nodeData.id];

  const derivedColor = status === 'correct' ? '#06b6d4' : status === 'wrong' ? '#ef4444' : nodeData.color;
  const isConquered = status === 'correct';
  
  const isLocked = nodeData.prerequisiteId && conqueredStatus[nodeData.prerequisiteId] !== 'correct';

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isLocked) {
      alert("Prerequisite not completed yet! Complete previous nodes first.");
      return;
    }
    setActiveNode(nodeData.id);
  };

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += nodeData.speed * 0.01;
      groupRef.current.rotation.x += nodeData.speed * 0.005;
    }
    if (meshRef.current) {
        meshRef.current.rotation.x += 0.01;
        meshRef.current.rotation.y += 0.01;
    }
  })

  return (
    <group ref={groupRef}>
      <group 
        position={nodeData.position}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isLocked ? 'not-allowed' : 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        onClick={handleClick}
        scale={isConquered ? 1.2 : 1}
      >
        {isConquered && <Sparkles count={50} scale={2} size={4} speed={2} opacity={0.8} color="#06b6d4" />}
        
        {nodeData.geometry === 'sphere' && <Sphere ref={meshRef} args={[nodeData.scale, 16, 16]}><meshStandardMaterial color={derivedColor} emissive={derivedColor} emissiveIntensity={isConquered ? 1 : 0.5} /></Sphere>}
        {nodeData.geometry === 'box' && <Box ref={meshRef} args={[nodeData.scale, nodeData.scale, nodeData.scale]}><meshStandardMaterial color={derivedColor} emissive={derivedColor} emissiveIntensity={isConquered ? 1 : 0.5} /></Box>}
        {nodeData.geometry === 'tetrahedron' && <Tetrahedron ref={meshRef} args={[nodeData.scale, 0]}><meshStandardMaterial color={derivedColor} emissive={derivedColor} emissiveIntensity={isConquered ? 1 : 0.5} /></Tetrahedron>}
        
        {hovered && !isConquered && (
          <Html center distanceFactor={10} zIndexRange={[100, 0]}>
            <div className="p-3 bg-slate-900/95 border border-violet-500/50 rounded-xl pointer-events-none shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-md w-48 text-center">
              <p className="text-violet-300 font-bold text-sm mb-1 pb-1 border-b border-violet-500/30">{nodeData.topic}</p>
              <p className={`text-xs w-full whitespace-normal break-words ${isLocked ? 'text-red-400' : 'text-slate-300'}`}>
                {isLocked ? 'Locked: Prerequisite required.' : status === 'wrong' ? 'Failed attempt recorded.' : 'Click to interface.'}
              </p>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

interface KnowledgeNodesProps {
  blueprint: LevelBlueprint | null;
}

const placeholderBlueprint: LevelBlueprint = {
  environment: 'Default',
  nodes: [
    { id: 'p1', topic: 'Upload Required', question: 'Drop a document to generate content.', options: [], correctAnswer: '', hint: '', difficulty: 2 },
    { id: 'p2', topic: 'Core Nodes', question: 'The system is awaiting AI Orchestration.', options: [], correctAnswer: '', hint: '', difficulty: 3, prerequisiteId: 'p1' },
    { id: 'p3', topic: 'Systems Online', question: 'Initialization sequence complete.', options: [], correctAnswer: '', hint: '', difficulty: 4, prerequisiteId: 'p2' }
  ]
};

export function KnowledgeNodes({ blueprint }: KnowledgeNodesProps) {
  const nodes = useMemo(() => generateWorld(blueprint || placeholderBlueprint), [blueprint])

  return (
    <>
      {nodes.map(n => <OrbitingNode key={n.id} nodeData={n} />)}
    </>
  )
}
