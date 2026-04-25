import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import { Gem } from './Gem'
import { KnowledgeNodes } from './KnowledgeNodes'
import type { LevelBlueprint } from '../types'

interface SceneProps {
  blueprint: LevelBlueprint | null;
}

export function Scene({ blueprint }: SceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 bg-slate-950">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Gem />
        <KnowledgeNodes blueprint={blueprint} />
        <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
