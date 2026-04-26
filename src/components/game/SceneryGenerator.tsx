import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Sparkles, Float, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface SceneryProps {
  currentLevel: number;
  themeColor: string;
}

export default function SceneryGenerator({ currentLevel, themeColor }: SceneryProps) {
  const noise2D = createNoise2D();

  // ── LEVEL 1: THE VOXEL TRACK ──
  const voxelData = useMemo(() => {
    if (currentLevel !== 1) return [];
    const blocks: { pos: [number, number, number], type: 'grass' | 'dirt' | 'wood' | 'leaves' }[] = [];
    
    // Generate a linear track from Z = 50 down to Z = -450
    for (let z = 50; z >= -450; z -= 2) {
      // Width of the playable track is x from -6 to 6
      for (let x = -10; x <= 10; x += 2) {
        
        const isTrack = x >= -6 && x <= 6;
        // Shift yBase down by 1 so a [2,2,2] block's top is exactly at y=0 (matches physics floor)
        let yBase = isTrack ? -1 : Math.floor(noise2D(x/15, z/15) * 2) * 2 + 1;

        // Surface
        blocks.push({ pos: [x, yBase, z], type: 'grass' });
        // Depth
        blocks.push({ pos: [x, yBase - 2, z], type: 'dirt' });
        if (!isTrack) blocks.push({ pos: [x, yBase - 4, z], type: 'dirt' });
        
        // Random trees on the borders
        if (!isTrack && Math.random() > 0.95 && yBase >= 0) {
          blocks.push({ pos: [x, yBase + 2, z], type: 'wood' });
          blocks.push({ pos: [x, yBase + 4, z], type: 'wood' });
          blocks.push({ pos: [x, yBase + 6, z], type: 'wood' });
          
          for (let tx = -2; tx <= 2; tx+=2) {
            for (let tz = -2; tz <= 2; tz+=2) {
               blocks.push({ pos: [x+tx, yBase+6, z+tz], type: 'leaves' });
               if (tx === 0 && tz === 0) blocks.push({ pos: [x, yBase+8, z], type: 'leaves' });
            }
          }
        }
      }
    }
    return blocks;
  }, [currentLevel]);

  // ── LEVEL 2: THE NEON HIGHWAY ──
  const urbanData = useMemo(() => {
    if (currentLevel !== 2) return { buildings: [] };
    const buildings: { pos: [number, number, number], scale: [number, number, number], isNeon: boolean }[] = [];
    
    // Buildings on the side of the highway
    for (let z = 50; z >= -450; z -= 20) {
       // Left side
       if (Math.random() > 0.3) {
           let height = 20 + Math.random() * 60;
           buildings.push({
             pos: [-15 - Math.random() * 10, height/2, z + (Math.random() * 10 - 5)],
             scale: [8 + Math.random()*6, height, 8 + Math.random()*6],
             isNeon: Math.random() > 0.5
           });
       }
       // Right side
       if (Math.random() > 0.3) {
           let height = 20 + Math.random() * 60;
           buildings.push({
             pos: [15 + Math.random() * 10, height/2, z + (Math.random() * 10 - 5)],
             scale: [8 + Math.random()*6, height, 8 + Math.random()*6],
             isNeon: Math.random() > 0.5
           });
       }
    }

    return { buildings };
  }, [currentLevel]);

  // ── LEVEL 3: THE SHATTERED BRIDGE ──
  const ruinsData = useMemo(() => {
    if (currentLevel !== 3) return { terrainGeom: null, pillars: [] };
    
    // A long bridge
    const geom = new THREE.PlaneGeometry(30, 500, 32, 256);
    geom.rotateX(-Math.PI / 2);
    // Center it roughly around Z = -200
    geom.translate(0, 0, -200);

    const pos = geom.attributes.position;
    const colors = [];
    const colorObj = new THREE.Color();
    
    for(let i=0; i<pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        
        let isTrack = Math.abs(x) < 6;
        let noise = isTrack ? 0 : (noise2D(x/20, z/20) * 5);
        let y = noise;

        pos.setY(i, y);
        
        if (y > 2) colorObj.set('#1c1917'); 
        else colorObj.set('#292524');
        
        colors.push(colorObj.r, colorObj.g, colorObj.b);
    }
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const pillars: { pos: [number, number, number], rot: [number, number, number], broken: boolean }[] = [];
    for(let z = 50; z >= -450; z -= 15) {
        if (Math.random() > 0.7) continue;
        let x = Math.random() > 0.5 ? -12 : 12; // Side of the bridge
        
        pillars.push({
            pos: [x, Math.random()*5, z],
            rot: [Math.random()*0.4 - 0.2, Math.random()*Math.PI, Math.random()*0.4 - 0.2],
            broken: Math.random() > 0.5
        });
    }

    return { terrainGeom: geom, pillars };
  }, [currentLevel]);

  // Shared Physics Floor to prevent falling
  const PhysicsFloor = () => (
    <RigidBody type="fixed" friction={0}>
       <mesh position={[0, -1, -200]}>
         <boxGeometry args={[40, 2, 600]} />
         <meshBasicMaterial visible={false} />
       </mesh>
    </RigidBody>
  );

  // ── RENDER ──
  if (currentLevel === 1) {
    return (
      <group>
        <fog attach="fog" args={['#87CEEB', 20, 150]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 50, 50]} intensity={1.5} castShadow />
        
        <PhysicsFloor />

        <RigidBody type="fixed" colliders={false}>
           <Instances limit={15000} castShadow receiveShadow>
             <boxGeometry args={[2, 2, 2]} />
             <meshStandardMaterial roughness={1} />
             {voxelData.map((b, i) => (
                <Instance 
                  key={i} 
                  position={b.pos} 
                  color={b.type === 'grass' ? '#4ade80' : b.type === 'dirt' ? '#78350f' : b.type === 'wood' ? '#8b5a2b' : '#22c55e'} 
                />
             ))}
           </Instances>
        </RigidBody>
      </group>
    );
  }

  if (currentLevel === 2) {
    return (
      <group>
        <fog attach="fog" args={['#020617', 10, 150]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[-50, 50, -50]} intensity={0.5} castShadow />

        <PhysicsFloor />

        {/* Flat Asphalt Highway */}
        <mesh position={[0, -0.1, -200]} receiveShadow>
            <boxGeometry args={[24, 0.2, 600]} />
            <meshStandardMaterial color="#171717" roughness={0.8} />
        </mesh>

        {/* Lane Dividers */}
        <Instances limit={100}>
           <planeGeometry args={[0.5, 4]} />
           <meshBasicMaterial color="#facc15" />
           {Array.from({ length: 60 }).map((_, i) => (
              <group key={i}>
                <Instance position={[-2, 0.05, 50 - i*10]} rotation={[-Math.PI/2, 0, 0]} />
                <Instance position={[2, 0.05, 50 - i*10]} rotation={[-Math.PI/2, 0, 0]} />
              </group>
           ))}
        </Instances>

        <RigidBody type="fixed" colliders={false}>
           {urbanData.buildings.map((b, i) => (
             <mesh key={i} position={b.pos} castShadow receiveShadow>
                <boxGeometry args={b.scale} />
                <meshStandardMaterial 
                  color={b.isNeon ? themeColor : '#0f172a'} 
                  emissive={b.isNeon ? themeColor : '#000000'} 
                  emissiveIntensity={b.isNeon ? 0.8 : 0}
                  metalness={0.8} 
                  roughness={0.2} 
                />
             </mesh>
           ))}
        </RigidBody>
      </group>
    );
  }

  if (currentLevel === 3) {
    return (
      <group>
        <fog attach="fog" args={['#1c1917', 5, 120]} />
        <directionalLight position={[50, 20, -50]} intensity={2} color="#9f1239" castShadow />
        <ambientLight intensity={0.2} color="#4c1d95" />

        <PhysicsFloor />

        <RigidBody type="fixed" colliders={false}>
          {ruinsData.terrainGeom && (
             <mesh receiveShadow geometry={ruinsData.terrainGeom}>
                <meshStandardMaterial vertexColors roughness={1} />
             </mesh>
          )}
           {ruinsData.pillars.map((p, i) => (
              <Float key={i} speed={0} floatIntensity={0} rotationIntensity={0}>
                 <mesh position={p.pos} rotation={p.rot} castShadow receiveShadow>
                    <cylinderGeometry args={[1.5, 2, p.broken ? 8 : 20, 8]} />
                    <meshStandardMaterial color="#292524" roughness={1} />
                 </mesh>
              </Float>
           ))}
        </RigidBody>

        <Sparkles count={400} scale={[40, 20, 400]} position={[0, 10, -200]} size={15} speed={0.4} opacity={0.6} color="#fb923c" />
      </group>
    );
  }

  return null;
}
