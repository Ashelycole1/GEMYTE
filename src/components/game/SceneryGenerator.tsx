import { useMemo, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Sparkles, useTexture, Float } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface SceneryProps {
  currentLevel: number; // 1 = Voxel, 2 = Urban, 3 = Ruins
  themeColor: string;
}

export default function SceneryGenerator({ currentLevel, themeColor }: SceneryProps) {
  const noise2D = createNoise2D();

  // ── LEVEL 1: THE VOXEL REALM (Minecraft) ──
  const voxelData = useMemo(() => {
    if (currentLevel !== 1) return [];
    const blocks: { pos: [number, number, number], type: 'grass' | 'dirt' | 'wood' | 'leaves' }[] = [];
    
    // Generate a chunky platform
    for (let x = -20; x <= 20; x += 2) {
      for (let z = -20; z <= 20; z += 2) {
        let yBase = Math.floor(noise2D(x/15, z/15) * 2) * 2;
        // Surface
        blocks.push({ pos: [x, yBase, z], type: 'grass' });
        // Underground
        blocks.push({ pos: [x, yBase - 2, z], type: 'dirt' });
        blocks.push({ pos: [x, yBase - 4, z], type: 'dirt' });
        
        // Random trees
        if (Math.random() > 0.95 && yBase >= 0 && x*x + z*z > 25) {
          blocks.push({ pos: [x, yBase + 2, z], type: 'wood' });
          blocks.push({ pos: [x, yBase + 4, z], type: 'wood' });
          blocks.push({ pos: [x, yBase + 6, z], type: 'wood' });
          
          // Canopy
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

  // ── LEVEL 2: THE NEON GRID (Urban/GTA) ──
  const urbanData = useMemo(() => {
    if (currentLevel !== 2) return { buildings: [], cars: [] };
    const buildings: { pos: [number, number, number], scale: [number, number, number], isNeon: boolean }[] = [];
    const cars: { pos: [number, number, number], rotation: [number, number, number] }[] = [];
    
    // City blocks
    for (let i = 0; i < 40; i++) {
       let x = (Math.random() - 0.5) * 80;
       let z = (Math.random() - 0.5) * 80;
       // Leave a crossroad open in the center
       if (Math.abs(x) < 8 || Math.abs(z) < 8) continue; 
       
       let height = 10 + Math.random() * 40;
       buildings.push({
         pos: [x, height/2, z],
         scale: [6 + Math.random()*4, height, 6 + Math.random()*4],
         isNeon: Math.random() > 0.7
       });
    }

    // Cars on the road
    for (let i = 0; i < 15; i++) {
        let zPos = (Math.random() - 0.5) * 80;
        let isXAxis = Math.random() > 0.5;
        if (isXAxis) {
            cars.push({ pos: [(Math.random()-0.5)*80, 0.5, 4], rotation: [0, 0, 0] });
        } else {
            cars.push({ pos: [-4, 0.5, (Math.random()-0.5)*80], rotation: [0, Math.PI/2, 0] });
        }
    }
    return { buildings, cars };
  }, [currentLevel]);

  // ── LEVEL 3: THE SHATTERED RUINS (Elden Ring) ──
  const ruinsData = useMemo(() => {
    if (currentLevel !== 3) return { terrainGeom: null, pillars: [] };
    
    const geom = new THREE.PlaneGeometry(150, 150, 64, 64);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position;
    const colors = [];
    const colorObj = new THREE.Color();
    
    for(let i=0; i<pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        
        let dist = Math.sqrt(x*x + z*z);
        let flatten = Math.max(0, Math.min(1, (dist - 10) / 40)); 
        
        // Jagged, dark noise
        let noise = (noise2D(x/30, z/30) * 15) + (noise2D(x/10, z/10) * 3);
        let y = noise * flatten;

        pos.setY(i, y - 1);
        
        // Dark, ashen colors
        if (y > 5) colorObj.set('#1c1917'); // dark stone
        else colorObj.set('#292524'); // ashen dirt
        
        colors.push(colorObj.r, colorObj.g, colorObj.b);
    }
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const pillars: { pos: [number, number, number], rot: [number, number, number], broken: boolean }[] = [];
    for(let i=0; i<30; i++) {
        let x = (Math.random() - 0.5) * 100;
        let z = (Math.random() - 0.5) * 100;
        if (x*x + z*z < 100) continue; // Keep center clear
        
        let flatten = Math.max(0, Math.min(1, (Math.sqrt(x*x+z*z) - 10) / 40));
        let hy = ((noise2D(x/30, z/30) * 15) + (noise2D(x/10, z/10) * 3)) * flatten;
        
        pillars.push({
            pos: [x, hy + (Math.random()*10), z],
            rot: [Math.random()*0.4 - 0.2, Math.random()*Math.PI, Math.random()*0.4 - 0.2],
            broken: Math.random() > 0.5
        });
    }

    return { terrainGeom: geom, pillars };
  }, [currentLevel]);


  // ── RENDER ──
  
  if (currentLevel === 1) {
    return (
      <group>
        <fog attach="fog" args={['#87CEEB', 20, 80]} />
        <RigidBody type="fixed" friction={1}>
           {/* Invisible floor safety net */}
           <mesh position={[0,-10,0]}><boxGeometry args={[200,1,200]}/><meshBasicMaterial visible={false}/></mesh>
           
           {/* Instanced rendering for performance would be better, but standard maps are okay for < 2000 blocks */}
           {voxelData.map((b, i) => (
              <mesh key={i} position={b.pos} castShadow receiveShadow>
                 <boxGeometry args={[2, 2, 2]} />
                 <meshStandardMaterial 
                   color={b.type === 'grass' ? '#4ade80' : b.type === 'dirt' ? '#78350f' : b.type === 'wood' ? '#8b5a2b' : '#22c55e'} 
                   roughness={1}
                 />
              </mesh>
           ))}
        </RigidBody>
      </group>
    );
  }

  if (currentLevel === 2) {
    return (
      <group>
        <fog attach="fog" args={['#020617', 10, 100]} />
        <ambientLight intensity={0.5} />
        
        <RigidBody type="fixed" friction={1}>
           {/* Flat Asphalt Floor */}
           <mesh position={[0, -0.5, 0]} receiveShadow>
              <boxGeometry args={[200, 1, 200]} />
              <meshStandardMaterial color="#171717" roughness={0.8} />
           </mesh>

           {/* Road Markings */}
           <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[200, 2]} />
              <meshBasicMaterial color="#facc15" />
           </mesh>
           <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, Math.PI/2]}>
              <planeGeometry args={[200, 2]} />
              <meshBasicMaterial color="#facc15" />
           </mesh>

           {/* Buildings */}
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

           {/* Cars */}
           {urbanData.cars.map((c, i) => (
             <group key={`car-${i}`} position={c.pos} rotation={c.rotation}>
                 <mesh position={[0, 0.5, 0]} castShadow>
                    <boxGeometry args={[2, 1, 4]} />
                    <meshStandardMaterial color={Math.random() > 0.5 ? '#b91c1c' : '#ffffff'} roughness={0.2} metalness={0.8} />
                 </mesh>
             </group>
           ))}
        </RigidBody>
      </group>
    );
  }

  if (currentLevel === 3) {
    return (
      <group>
        <fog attach="fog" args={['#1c1917', 5, 80]} />
        {/* Ominous red/purple lighting */}
        <directionalLight position={[50, 20, -50]} intensity={2} color="#9f1239" castShadow />
        <ambientLight intensity={0.2} color="#4c1d95" />

        <RigidBody type="fixed" colliders="trimesh" friction={1.5}>
          {ruinsData.terrainGeom && (
             <mesh receiveShadow geometry={ruinsData.terrainGeom}>
                <meshStandardMaterial vertexColors roughness={1} />
             </mesh>
          )}
        </RigidBody>

        <RigidBody type="fixed">
           {ruinsData.pillars.map((p, i) => (
              <Float key={i} speed={0} floatIntensity={0} rotationIntensity={0}>
                 <mesh position={p.pos} rotation={p.rot} castShadow receiveShadow>
                    <cylinderGeometry args={[1.5, 2, p.broken ? 8 : 20, 8]} />
                    <meshStandardMaterial color="#292524" roughness={1} />
                 </mesh>
              </Float>
           ))}
        </RigidBody>

        {/* Floating Embers */}
        <Sparkles count={200} scale={100} size={15} speed={0.4} opacity={0.6} color="#fb923c" />
      </group>
    );
  }

  return null;
}
