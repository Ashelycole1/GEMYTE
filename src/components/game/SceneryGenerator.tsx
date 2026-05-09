import { useMemo } from 'react';
import { RigidBody, CylinderCollider, CuboidCollider, HeightfieldCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface SceneryProps {
  environmentType: 'EGYPT' | 'CYBERPUNK' | 'FANTASY_FOREST' | 'MODERN_CITY' | 'DEFAULT' | string;
  themeColor: string;
}

// Grid resolution must match PlaneGeometry segments
const GRID = 48; // 48 segments = 49 vertices per side
const WORLD_SIZE = 800;

export default function SceneryGenerator({ environmentType, themeColor }: SceneryProps) {

  const { terrainGeom, heightData, sceneryData } = useMemo(() => {
    const noise2D = createNoise2D();

    // ── Helper: compute y height at any (x, z) using same noise ──
    const getHeight = (x: number, z: number) => {
      const dist = Math.sqrt(x * x + z * z);
      const flatten = Math.max(0, Math.min(1, (dist - 20) / 100));
      const noise = (noise2D(x / 250, z / 250) * 40) + (noise2D(x / 50, z / 50) * 5);
      return noise * flatten - 1;
    };

    // ── Visual terrain geometry ──
    const geom = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, GRID, GRID);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position;

    const colors: number[] = [];
    const colorObj = new THREE.Color();
    const roadColor = new THREE.Color('#262626');
    const grassColor = new THREE.Color('#4ade80');
    const rockColor = new THREE.Color('#6b7280');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getHeight(x, z);

      const roadCenterZ = Math.sin(x / 100) * 100;
      const distToRoad = Math.abs(z - roadCenterZ);

      if (distToRoad < 15) {
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

      pos.setY(i, y);
      colors.push(colorObj.r, colorObj.g, colorObj.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    // ── Heightfield data for Rapier physics (must match visual grid exactly) ──
    // HeightfieldCollider expects (nrows+1)*(ncols+1) values, row-major
    const verts = GRID + 1;
    const hData = new Float32Array(verts * verts);
    for (let r = 0; r < verts; r++) {
      for (let c = 0; c < verts; c++) {
        const x = (c / GRID - 0.5) * WORLD_SIZE;
        const z = (r / GRID - 0.5) * WORLD_SIZE;
        hData[r * verts + c] = getHeight(x, z);
      }
    }

    // ── Scenery placement (off road + off center) ──
    const props: any[] = [];
    const getPos = () => {
      let x = 0, z = 0;
      for (let attempt = 0; attempt < 50; attempt++) {
        x = (Math.random() - 0.5) * 600;
        z = (Math.random() - 0.5) * 600;
        const roadZ = Math.sin(x / 100) * 100;
        if (Math.sqrt(x * x + z * z) > 30 && Math.abs(z - roadZ) > 25) break;
      }
      const y = getHeight(x, z);
      return [x, y, z] as [number, number, number];
    };

    for (let i = 0; i < 25; i++) {
      const pos = getPos();
      props.push({ id: `palm-${i}`, type: 'palm', pos, height: 15 + Math.random() * 15 });
    }
    for (let i = 0; i < 45; i++) {
      const pos = getPos();
      props.push({ id: `tree-${i}`, type: 'broadleaf', pos, height: 8 + Math.random() * 10 });
    }
    for (let i = 0; i < 8; i++) {
      const pos = getPos();
      props.push({ id: `house-${i}`, type: 'luxury-house', pos: [pos[0], pos[1] + 2, pos[2]] as [number, number, number] });
    }

    return { terrainGeom: geom, heightData: hData, sceneryData: props };
  }, []);

  return (
    <>
      <fog attach="fog" args={['#cbd5e1', 40, 450]} />

      {/* ── Visual terrain ── */}
      <mesh receiveShadow geometry={terrainGeom}>
        <meshStandardMaterial vertexColors roughness={0.9} />
      </mesh>

      {/* ── Physics terrain: HeightfieldCollider matches visual mesh exactly ── */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <HeightfieldCollider
          args={[GRID, GRID, heightData, { x: WORLD_SIZE, y: 1, z: WORLD_SIZE }]}
        />
      </RigidBody>

      {/* ── Scenery objects ── */}
      {sceneryData.map((item) => {
        switch (item.type) {

          case 'palm':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos} colliders={false} restitution={0} friction={1}>
                <CylinderCollider args={[item.height / 2, 0.55]} position={[0, item.height / 2, 0]} />
                <mesh position={[0, item.height / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.3, 0.6, item.height, 8]} />
                  <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
                </mesh>
                <mesh position={[0, item.height, 0]}>
                  <sphereGeometry args={[0.8, 8, 8]} />
                  <meshStandardMaterial color="#22c55e" roughness={1} />
                </mesh>
                <mesh position={[0, item.height + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[3, 0.1, 0.2, 5]} />
                  <meshStandardMaterial color="#16a34a" />
                </mesh>
              </RigidBody>
            );

          case 'broadleaf':
            return (
              <RigidBody key={item.id} type="fixed" position={item.pos} colliders={false} restitution={0} friction={1}>
                <CylinderCollider args={[item.height / 2, 0.75]} position={[0, item.height / 2, 0]} />
                <CylinderCollider args={[2.0, 2.5]} position={[0, item.height, 0]} />
                <mesh position={[0, item.height / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.5, 0.8, item.height, 8]} />
                  <meshStandardMaterial color="#5c4033" />
                </mesh>
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
              <RigidBody key={item.id} type="fixed" position={item.pos} colliders={false} restitution={0} friction={1}>
                <CuboidCollider args={[7.5, 3.5, 0.4]} position={[0, 0, 5]} />
                <CuboidCollider args={[7.5, 3.5, 0.4]} position={[0, 0, -5]} />
                <CuboidCollider args={[0.4, 3.5, 5]} position={[7.5, 0, 0]} />
                <CuboidCollider args={[0.4, 3.5, 5]} position={[-7.5, 0, 0]} />
                <CuboidCollider args={[7.5, 0.5, 5]} position={[0, 3.5, 0]} />
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[15, 6, 10]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.2} />
                </mesh>
                <mesh position={[0, 3.2, 0]} castShadow>
                  <boxGeometry args={[16, 0.5, 11]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
                <mesh position={[0, 0, 5.1]}>
                  <planeGeometry args={[10, 4]} />
                  <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} />
                </mesh>
              </RigidBody>
            );
        }
      })}
    </>
  );
}
