import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

export function Gem() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const conqueredStatus = useGameStore(state => state.conqueredStatus)
  const blueprint = useGameStore(state => state.blueprint)
  
  const isLevelComplete = blueprint && blueprint.nodes.length > 0 && 
    Object.values(conqueredStatus).filter(status => status === 'correct').length === blueprint.nodes.length

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
      
      const targetScale = isLevelComplete ? 2.5 : 1.5;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);

      const targetMaterial = meshRef.current.material as any;
      const targetColor = isLevelComplete ? new THREE.Color('#34d399') : new THREE.Color('#06b6d4');
      const targetEmissive = isLevelComplete ? new THREE.Color('#34d399') : new THREE.Color('#8b5cf6');
      
      if (targetMaterial.color && targetMaterial.color.lerp) {
        targetMaterial.color.lerp(targetColor, 0.05);
        targetMaterial.emissive.lerp(targetEmissive, 0.05);
      }
    }
  })

  return (
    <group>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.5, 0]} />
          <MeshDistortMaterial
            color="#06b6d4"
            emissive="#8b5cf6"
            emissiveIntensity={0.5}
            speed={3}
            distort={0.4}
            metalness={1}
            roughness={0.2}
          />
        </mesh>
      </Float>
      
      {isLevelComplete && (
        <pointLight color="#34d399" intensity={3} distance={10} visible={true} />
      )}
    </group>
  )
}
