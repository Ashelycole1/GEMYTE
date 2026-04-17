import { useMemo, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Instance, Instances, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface SceneryProps {
  environmentType: 'EGYPT' | 'CYBERPUNK' | 'FANTASY_FOREST' | 'MODERN_CITY' | 'DEFAULT' | string;
  themeColor: string;
}

export default function SceneryGenerator({ environmentType, themeColor }: SceneryProps) {
  
  // Terrain setup with Simplex Noise
  const { terrainGeom, sceneryData } = useMemo(() => {
    // Topography Generation - Reduced vertex count dramatically to prevent Trimesh freezing
    const geom = new THREE.PlaneGeometry(800, 800, 48, 48); // much lower density for performance
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position;
    const noise2D = createNoise2D();

    const colors = [];
    const colorObj = new THREE.Color();
    const roadColor = new THREE.Color('#262626');
    const grassColor = new THREE.Color('#4ade80');
    const rockColor = new THREE.Color('#6b7280');

    for(let i=0; i<pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        let dist = Math.sqrt(x*x + z*z);
        let flatten = Math.max(0, Math.min(1, (dist - 20) / 100)); 
        
        let noise = (noise2D(x/250, z/250) * 40) + (noise2D(x/50, z/50) * 5);
        let y = noise * flatten;

        const roadCenterZ = Math.sin(x / 100) * 100;
        const distToRoad = Math.abs(z - roadCenterZ);

        if (distToRoad < 15) {
            y = (noise2D(x/250, roadCenterZ/250) * 40 * flatten);
            colorObj.copy(roadColor);
        } else if (distToRoad < 20) {
            colorObj.lerpColors(roadColor, grassColor, (distToRoad - 15) / 5);
        } else {
            if (y > 20) {
                 colorObj.lerpColors(grassColor, rockColor, Math.min(1, (y - 20) / 20));
            } else {
                 colorObj.copy(grassColor);
            }
        }

        pos.setY(i, y - 1);
        colors.push(colorObj.r, colorObj.g, colorObj.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const props: any[] = [];
    const getPos = () => {
      let x = 0, z = 0, dist = 0;
      while (true) {
        x = (Math.random() - 0.5) * 600;
        z = (Math.random() - 0.5) * 600;
        const roadZ = Math.sin(x/100) * 100;
        dist = Math.abs(z - roadZ);
        if (Math.sqrt(x*x+z*z) > 30 && dist > 25) break;
      }
      return [x, z];
    };

    // Reduced Palm Trees for performance
    for (let i=0; i<25; i++) {
        const [x,z] = getPos();
        let flatten = Math.max(0, Math.min(1, (Math.sqrt(x*x+z*z) - 20) / 100));
        let hy = (noise2D(x/250, z/250)*40 + noise2D(x/50,z/50)*5) * flatten - 1;
        props.push({ id:`palm-${i}`, type: 'palm', pos: [x, hy, z], height: 15 + Math.random()*15 });
    }

    // Reduced Broadleaf Trees for performance
    for (let i=0; i<45; i++) {
        const [x,z] = getPos();
        let flatten = Math.max(0, Math.min(1, (Math.sqrt(x*x+z*z) - 20) / 100));
        let hy = (noise2D(x/250, z/250)*40 + noise2D(x/50,z/50)*5) * flatten - 1;
        props.push({ id:`tree-${i}`, type: 'broadleaf', pos: [x, hy, z], height: 8 + Math.random()*10 });
    }

    // Houses
    for (let i=0; i<8; i++) {
        const [x,z] = getPos();
        let flatten = Math.max(0, Math.min(1, (Math.sqrt(x*x+z*z) - 20) / 100));
        let hy = (noise2D(x/250, z/250)*40 + noise2D(x/50,z/50)*5) * flatten - 1;
        props.push({ id:`house-${i}`, type: 'luxury-house', pos: [x, hy+2, z] });
    }

    // Cars
    for (let i=0; i<10; i++) {
        const x = (Math.random() - 0.5) * 600;
        const baseZ = Math.sin(x/100) * 100;
        const laneOffset = Math.random() > 0.5 ? 5 : -5;
        const z = baseZ + laneOffset;
        let angle = Math.atan(-Math.cos(x/100)); 
        if (laneOffset < 0) angle += Math.PI;

        let flatten = Math.max(0, Math.min(1, (Math.sqrt(x*x+z*z) - 20) / 100));
        let hy = (noise2D(x/250, baseZ/250)*40 * flatten) - 0.5;

        if (Math.abs(x) > 30) {
             props.push({ id:`car-${i}`, type: 'car', pos: [x, hy, z], rotation: [0, angle, 0] });
        }
    }

    return { terrainGeom: geom, sceneryData: props };
  }, []);

  let fogColor = '#cbd5e1';

  return (
    <>
      <fog attach="fog" args={[fogColor, 40, 450]} />

      {/* Realistic Terrain Visuals (Removed Rapier trimesh to prevent WASM GPU crash) */}
      <mesh receiveShadow geometry={terrainGeom}>
          <meshStandardMaterial vertexColors roughness={0.9} />
      </mesh>

      {/* Underlying dirt plane if camera falls below terrain */}
      <mesh position={[0,-20,0]} rotation={[-Math.PI/2,0,0]}>
         <planeGeometry args={[1000,1000]} />
         <meshBasicMaterial color="#3f2c19" />
      </mesh>

      {/* Render Scenery Objects */}
      {sceneryData.map((item) => {
        switch(item.type) {
          
          case 'palm':
             return (
               <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                  {/* Trunk */}
                  <mesh position={[0, item.height/2, 0]} castShadow>
                     <cylinderGeometry args={[0.3, 0.6, item.height, 8]} />
                     <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
                  </mesh>
                  {/* Palm Leaves Base */}
                  <mesh position={[0, item.height, 0]}>
                     <sphereGeometry args={[0.8, 8, 8]} />
                     <meshStandardMaterial color="#22c55e" roughness={1} />
                  </mesh>
                  {/* Canopy (star shape approximation) */}
                  <mesh position={[0, item.height + 0.5, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
                     <cylinderGeometry args={[3, 0.1, 0.2, 5]} />
                     <meshStandardMaterial color="#16a34a" />
                  </mesh>
               </RigidBody>
             );

          case 'broadleaf':
             return (
               <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                  <mesh position={[0, item.height/2, 0]} castShadow>
                     <cylinderGeometry args={[0.5, 0.8, item.height, 8]} />
                     <meshStandardMaterial color="#5c4033" />
                  </mesh>
                  {/* Multiple rounded foliage clumps */}
                  <mesh position={[0, item.height, 0]} castShadow>
                     <dodecahedronGeometry args={[2.5, 1]} />
                     <meshStandardMaterial color="#15803d" roughness={0.9} />
                  </mesh>
                  <mesh position={[1.5, item.height - 1, 1]} castShadow>
                     <dodecahedronGeometry args={[1.8, 1]} />
                     <meshStandardMaterial color="#16a34a" />
                  </mesh>
                  <mesh position={[-1.2, item.height - 0.5, -1.2]} castShadow>
                     <dodecahedronGeometry args={[2, 1]} />
                     <meshStandardMaterial color="#15803d" />
                  </mesh>
               </RigidBody>
             );

          case 'luxury-house':
             return (
               <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                  <mesh castShadow receiveShadow>
                     <boxGeometry args={[15, 6, 10]} />
                     <meshStandardMaterial color="#f8fafc" roughness={0.2} />
                  </mesh>
                  {/* Roof */}
                  <mesh position={[0, 3.2, 0]} castShadow>
                     <boxGeometry args={[16, 0.5, 11]} />
                     <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  {/* Giant glass window */}
                  <mesh position={[0, 0, 5.1]}>
                     <planeGeometry args={[10, 4]} />
                     <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} />
                  </mesh>
               </RigidBody>
             );

          case 'car':
             return (
                <RigidBody key={item.id} type="fixed" position={item.pos as any} rotation={item.rotation as any}>
                   {/* Chassis */}
                   <mesh position={[0, 1, 0]} castShadow>
                     <boxGeometry args={[2, 0.8, 4.5]} />
                     <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
                   </mesh>
                   {/* Cabin */}
                   <mesh position={[0, 1.7, -0.2]} castShadow>
                     <boxGeometry args={[1.8, 0.8, 2]} />
                     <meshStandardMaterial color="#000000" roughness={0.1} metalness={1} />
                   </mesh>
                   {/* Wheels */}
                   {[[-1, 0.5, 1.5], [1, 0.5, 1.5], [-1, 0.5, -1.5], [1, 0.5, -1.5]].map((wheelPos, wi) => (
                      <mesh key={wi} position={wheelPos as any} rotation={[0, 0, Math.PI/2]} castShadow>
                         <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
                         <meshStandardMaterial color="#1f2937" roughness={0.9} />
                      </mesh>
                   ))}
                </RigidBody>
             );
        }
      })}
    </>
  );
}
