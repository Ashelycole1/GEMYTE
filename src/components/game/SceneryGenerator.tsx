import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Sparkles } from '@react-three/drei';

interface SceneryProps {
  environmentType: 'EGYPT' | 'CYBERPUNK' | 'FANTASY_FOREST' | 'MODERN_CITY' | 'DEFAULT' | string;
  themeColor: string;
}

export default function SceneryGenerator({ environmentType, themeColor }: SceneryProps) {
  
  // Deterministic seed generation based on world properties ensures the 
  // scatter stays exactly the same across re-renders without dropping FPS.
  const sceneryData = useMemo(() => {
    const props: any[] = [];
    
    // Helper to get random coord far from center (spawn)
    const getPos = () => {
      let x = 0, z = 0;
      // Force them to spawn away from the center (0,0) where the player starts
      while (Math.abs(x) < 20 && Math.abs(z) < 20) {
        x = (Math.random() - 0.5) * 800; // Spread across 800 units
        z = (Math.random() - 0.5) * 800;
      }
      return [x, z];
    };

    if (environmentType === 'EGYPT') {
      // Scatter Pyramids
      for (let i = 0; i < 40; i++) {
        const [x, z] = getPos();
        const height = 15 + Math.random() * 30; // Random heights up to 45
        const width = height * 1.5;
        props.push({ id: `pyr-${i}`, type: 'pyramid', pos: [x, 0, z], args: [width, height, 4] });
      }
      // Scatter some rocks/ruins
      for (let i = 0; i < 60; i++) {
        const [x, z] = getPos();
        props.push({ id: `rock-${i}`, type: 'rock', pos: [x, 0, z], scale: 1 + Math.random() * 4 });
      }

    } else if (environmentType === 'CYBERPUNK') {
      // Scatter Skyscrapers
      for (let i = 0; i < 70; i++) {
        const [x, z] = getPos();
        const height = 40 + Math.random() * 120;
        const width = 10 + Math.random() * 15;
        props.push({ id: `bldg-${i}`, type: 'skyscraper', pos: [x, height/2 - 2, z], args: [width, height, width] });
      }

    } else if (environmentType === 'FANTASY_FOREST') {
      // Dense magical forest
      for (let i = 0; i < 120; i++) {
        const [x, z] = getPos();
        const height = 5 + Math.random() * 10;
        props.push({ id: `tree-${i}`, type: 'fantasy-tree', pos: [x, 0, z], height });
      }
      // Massive crystals
      for (let i = 0; i < 20; i++) {
        const [x, z] = getPos();
        props.push({ id: `crystal-${i}`, type: 'crystal', pos: [x, 0, z], scale: 3 + Math.random() * 8 });
      }

    } else if (environmentType === 'MODERN_CITY') {
       // Regular concrete buildings
       for (let i = 0; i < 60; i++) {
        const [x, z] = getPos();
        const height = 20 + Math.random() * 50;
        const width = 15 + Math.random() * 20;
        props.push({ id: `citybldg-${i}`, type: 'city-building', pos: [x, height/2 - 2, z], args: [width, height, width] });
      }
    } else {
      // DEFAULT (Standard sparse nature) //
      for (let i = 0; i < 60; i++) {
        const [x, z] = getPos();
        props.push({ id: `deftree-${i}`, type: 'default-tree', pos: [x, 0, z] });
      }
    }

    return props;
  }, [environmentType]);

  // Determine atmospheric Fog color based on biome
  let fogColor = '#87CEEB'; // default sky blue
  if (environmentType === 'EGYPT') fogColor = '#fde047'; // Sandstorm yellow
  if (environmentType === 'CYBERPUNK') fogColor = '#0f172a'; // Deep night
  if (environmentType === 'FANTASY_FOREST') fogColor = '#3b0764'; // Deep mystical purple
  if (environmentType === 'MODERN_CITY') fogColor = '#94a3b8'; // Smog gray

  return (
    <>
      <fog attach="fog" args={[fogColor, 40, 350]} />

      {/* Cyberpunk & Fantasy get floating particles */}
      {(environmentType === 'CYBERPUNK' || environmentType === 'FANTASY_FOREST') && (
        <Sparkles count={500} scale={200} size={5} speed={0.4} opacity={0.6} color={themeColor} position={[0, 10, 0]} />
      )}

      {/* Primary Floor Layer (Hides the rigid body dirt beneath it) */}
      <mesh position={[0, -0.9, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color={
          environmentType === 'EGYPT' ? '#d2b48c' : 
          environmentType === 'CYBERPUNK' ? '#111827' :
          environmentType === 'FANTASY_FOREST' ? '#14532d' :
          environmentType === 'MODERN_CITY' ? '#4b5563' : '#4ade80'
        } roughness={1} />
      </mesh>

      {/* Render the calculated scenery primitives */}
      {sceneryData.map((item) => {
        
        switch(item.type) {
          case 'pyramid':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any} colliders="hull">
                <mesh castShadow receiveShadow>
                  {/* cone with 4 radial segments makes a perfect pyramid! */}
                  <coneGeometry args={item.args as any} />
                  <meshStandardMaterial color="#c29d59" roughness={0.9} />
                </mesh>
              </RigidBody>
            );

          case 'rock':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                <mesh castShadow receiveShadow position={[0, item.scale/2, 0]} scale={item.scale}>
                  <dodecahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color="#78716c" roughness={0.8} />
                </mesh>
              </RigidBody>
            );

          case 'skyscraper':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={item.args as any} />
                  <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} emissive={themeColor} emissiveIntensity={0.2} />
                  {/* Glowing edges via box helper or a glowing inner box */}
                </mesh>
                {/* Glowing neon top */}
                <mesh position={[0, (item.args[1] / 2) + 0.1, 0]}>
                  <boxGeometry args={[item.args[0]*0.8, 0.2, item.args[2]*0.8]} />
                  <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={2} />
                </mesh>
              </RigidBody>
            );

          case 'city-building':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={item.args as any} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.5} />
                </mesh>
                {/* Glass facade plane */}
                <mesh position={[0, 0, (item.args[2]/2) + 0.01]}>
                  <planeGeometry args={[item.args[0]*0.9, item.args[1]*0.9]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.9} />
                </mesh>
              </RigidBody>
            );

          case 'fantasy-tree':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                {/* Trunk */}
                <mesh position={[0, item.height/2, 0]} castShadow>
                  <cylinderGeometry args={[0.5, 0.8, item.height]} />
                  <meshStandardMaterial color="#451a03" />
                </mesh>
                {/* Mystical huge spherical leaves */}
                <mesh position={[0, item.height + 2, 0]} castShadow>
                  <dodecahedronGeometry args={[4, 1]} />
                  <meshStandardMaterial color="#a21caf" emissive="#c026d3" emissiveIntensity={0.2} roughness={1} />
                </mesh>
              </RigidBody>
            );

          case 'crystal':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any} colliders="hull">
                <mesh castShadow receiveShadow position={[0, item.scale, 0]} scale={[item.scale*0.5, item.scale, item.scale*0.5]}>
                  <octahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.8} opacity={0.8} transparent />
                </mesh>
              </RigidBody>
            );

          case 'default-tree': // The old tree we used to have inside WorldSpawner
          default:
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos as any}>
                <mesh position={[0, 2, 0]} castShadow>
                  <boxGeometry args={[1, 4, 1]} />
                  <meshStandardMaterial color="#5E4028" />
                </mesh>
                <mesh position={[0, 5, 0]} castShadow>
                  <boxGeometry args={[4, 4, 4]} />
                  <meshStandardMaterial color="#2E8B57" />
                </mesh>
              </RigidBody>
            );
        }
      })}
    </>
  );
}
