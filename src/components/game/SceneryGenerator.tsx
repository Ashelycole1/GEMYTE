import { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Instances, Instance, Float } from '@react-three/drei';
import * as THREE from 'three';

interface SceneryProps {
  currentLevel: number;
  themeColor: string;
  onCollectCoin: () => void;
}

// ── Interactive Coin Component ──
function Coin({ position, onCollect }: { position: [number, number, number], onCollect: () => void }) {
  const [collected, setCollected] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += delta * 3;
    }
  });

  if (collected) return null;

  return (
    <RigidBody position={position} type="fixed" sensor onIntersectionEnter={(p) => {
        if (p.other.rigidBodyObject?.name === 'avatar' && !collected) {
            setCollected(true);
            onCollect();
        }
    }}>
        <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
           <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
           <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} emissive="#d97706" emissiveIntensity={0.5} />
        </mesh>
    </RigidBody>
  );
}

// ── Moving Train Component ──
function MovingTrain({ initialZ, lane }: { initialZ: number, lane: number }) {
    const rbRef = useRef<any>(null);
    const xPos = lane * 4;

    useFrame(() => {
        if (rbRef.current) {
            // Force constant velocity towards the player
            rbRef.current.setLinvel({ x: 0, y: 0, z: 25 }, true);
        }
    });

    return (
        <RigidBody ref={rbRef} name="obstacle" type="kinematicVelocity" position={[xPos, 2, initialZ]} colliders="cuboid" friction={0}>
            {/* Train Body */}
            <mesh>
                <boxGeometry args={[3.8, 4, 15]} />
                <meshStandardMaterial color="#ef4444" roughness={0.5} metalness={0.6} />
            </mesh>
            {/* Train Windows */}
            <mesh position={[0, 0.5, 7.51]}>
                <boxGeometry args={[3, 1.5, 0.1]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
        </RigidBody>
    );
}

export default function SceneryGenerator({ currentLevel, themeColor, onCollectCoin }: SceneryProps) {
  
  // ── Track Data Generation ──
  const { stationaryTrains, movingTrains, coinPos, hurdles, barriers } = useMemo(() => {
    const stationaryTrains: { z: number, lane: number, hasRamp: boolean, color: string }[] = [];
    const movingTrains: { z: number, lane: number }[] = [];
    const coinPos: { z: number, lane: number, y: number }[] = [];
    const hurdles: { z: number, lane: number }[] = []; // Low barriers to jump over
    const barriers: { z: number, lane: number }[] = []; // High barriers to slide under

    const trainColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

    for (let z = 0; z >= -450; z -= 40) {
        // Randomly pick a feature for this row
        const featureType = Math.random();
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

        if (featureType > 0.8) {
            // Stationary Train
            const hasRamp = Math.random() > 0.5;
            stationaryTrains.push({ 
                z, lane, hasRamp, 
                color: trainColors[Math.floor(Math.random() * trainColors.length)] 
            });
            // Coins on top if ramp
            if (hasRamp) {
                for (let c = 0; c < 3; c++) coinPos.push({ z: z + (c * 4), lane, y: 5 });
            }
        } else if (featureType > 0.6) {
            // Moving Train
            movingTrains.push({ z: z - 100, lane });
        } else if (featureType > 0.4) {
            // High Barrier (Slide)
            barriers.push({ z, lane });
        } else if (featureType > 0.2) {
            // Low Hurdle (Jump)
            hurdles.push({ z, lane });
        }

        // Generate a line of 3-5 coins in a random empty lane
        const coinLane = Math.floor(Math.random() * 3) - 1;
        for (let c = 0; c < 5; c++) {
            coinPos.push({ z: z - (c * 2) - 10, lane: coinLane, y: 1 });
        }
    }

    return { stationaryTrains, movingTrains, coinPos, hurdles, barriers };
  }, [currentLevel]);


  // Shared Physics Floor to prevent falling
  const PhysicsFloor = () => (
    <RigidBody type="fixed" friction={0}>
       <mesh position={[0, -1, -250]}>
         <boxGeometry args={[40, 2, 800]} />
         <meshBasicMaterial visible={false} />
       </mesh>
    </RigidBody>
  );

  return (
    <group>
      <PhysicsFloor />
      <ambientLight intensity={0.8} />
      <directionalLight position={[50, 100, 50]} intensity={2} castShadow />
      
      {/* Dynamic fog based on level */}
      <fog attach="fog" args={[currentLevel === 1 ? '#bae6fd' : currentLevel === 2 ? '#0f172a' : '#1c1917', 50, 200]} />

      {/* ── Environment Rendering ── */}
      <RigidBody type="fixed" colliders={false}>
          {/* Ground Base */}
          <mesh position={[0, -0.1, -250]} receiveShadow>
              <boxGeometry args={[40, 0.2, 800]} />
              <meshStandardMaterial color={currentLevel === 1 ? '#84cc16' : currentLevel === 2 ? '#334155' : '#292524'} roughness={0.9} />
          </mesh>

          {/* Gravel Track Bed */}
          <mesh position={[0, -0.05, -250]} receiveShadow>
              <boxGeometry args={[14, 0.1, 800]} />
              <meshStandardMaterial color="#57534e" roughness={1} />
          </mesh>
          
          {/* Authentic Train Tracks (Ties and Rails) */}
          <Instances limit={2000} castShadow receiveShadow>
              <boxGeometry args={[12, 0.1, 0.4]} /> {/* Wooden Tie */}
              <meshStandardMaterial color="#451a03" roughness={1} />
              {Array.from({ length: 400 }).map((_, i) => (
                  <Instance key={`tie-${i}`} position={[0, 0.05, 50 - (i * 2)]} />
              ))}
          </Instances>

          <Instances limit={6}>
              <boxGeometry args={[0.2, 0.2, 800]} /> {/* Metal Rail */}
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              <Instance position={[-5, 0.1, -250]} />
              <Instance position={[-3, 0.1, -250]} />
              <Instance position={[-1, 0.1, -250]} />
              <Instance position={[1, 0.1, -250]} />
              <Instance position={[3, 0.1, -250]} />
              <Instance position={[5, 0.1, -250]} />
          </Instances>
      </RigidBody>

      {/* ── Side Scenery (Walls / Trees) ── */}
      <RigidBody type="fixed" colliders={false}>
          <Instances limit={100}>
              <boxGeometry args={[2, 10, 20]} />
              <meshStandardMaterial color={currentLevel === 1 ? '#fb923c' : currentLevel === 2 ? themeColor : '#44403c'} roughness={0.8} />
              {Array.from({ length: 40 }).map((_, i) => (
                  <group key={i}>
                      <Instance position={[-15, 5, 50 - i*20]} />
                      <Instance position={[15, 5, 50 - i*20]} />
                  </group>
              ))}
          </Instances>
      </RigidBody>

      {/* ── Obstacles ── */}
      {/* Stationary Trains */}
      {stationaryTrains.map((t, i) => (
          <RigidBody key={`train-${i}`} name="obstacle" type="fixed" position={[t.lane * 4, 2, t.z]} colliders="cuboid" friction={0}>
              <mesh castShadow receiveShadow>
                  <boxGeometry args={[3.8, 4, 15]} />
                  <meshStandardMaterial color={t.color} roughness={0.4} metalness={0.2} />
              </mesh>
              {/* Optional Ramp at the front of the train (positive Z side) */}
              {t.hasRamp && (
                  <mesh position={[0, -1, 12]} rotation={[-Math.PI / 6, 0, 0]}>
                      <boxGeometry args={[3.8, 0.5, 10]} />
                      <meshStandardMaterial color="#475569" />
                  </mesh>
              )}
          </RigidBody>
      ))}

      {/* Low Hurdles (Jump over) */}
      {hurdles.map((h, i) => (
          <RigidBody key={`hurdle-${i}`} name="obstacle" type="fixed" position={[h.lane * 4, 0.5, h.z]} colliders="cuboid">
              <mesh castShadow>
                  <boxGeometry args={[3.8, 1, 0.5]} />
                  <meshStandardMaterial color="#dc2626" /> {/* Red and white striped normally, red for now */}
              </mesh>
          </RigidBody>
      ))}

      {/* High Barriers (Slide under) */}
      {barriers.map((b, i) => (
          <RigidBody key={`barrier-${i}`} name="obstacle" type="fixed" position={[b.lane * 4, 2, b.z]}>
              {/* Posts */}
              <mesh position={[-1.8, -0.5, 0]}><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
              <mesh position={[1.8, -0.5, 0]}><boxGeometry args={[0.2, 3, 0.2]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
              {/* Sign overhead */}
              <mesh position={[0, 1.2, 0]}><boxGeometry args={[4, 1, 0.2]} /><meshStandardMaterial color="#facc15" /></mesh>
              {/* Collider for the sign only */}
          </RigidBody>
      ))}

      {/* ── Moving Trains ── */}
      {movingTrains.map((mt, i) => (
          <MovingTrain key={`mt-${i}`} initialZ={mt.z} lane={mt.lane} />
      ))}

      {/* ── Coins ── */}
      {coinPos.map((c, i) => (
          <Coin key={`coin-${i}`} position={[c.lane * 4, c.y, c.z]} onCollect={onCollectCoin} />
      ))}

    </group>
  );
}
