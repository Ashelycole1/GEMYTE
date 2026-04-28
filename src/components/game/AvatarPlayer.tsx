import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { inputStore } from './useControls';
import { sfx } from '../../utils/audio';
import { useGameStore } from '../../store/useGameStore';

// XP Tier thresholds → color progression
function getAuraForXP(xp: number): { color: string; emissive: string; intensity: number } {
  if (xp >= 4000) return { color: '#f97316', emissive: '#dc2626', intensity: 2.0 }; // Master – Orange/Red
  if (xp >= 1500) return { color: '#f59e0b', emissive: '#d97706', intensity: 1.5 }; // Expert – Gold
  if (xp >= 500)  return { color: '#8b5cf6', emissive: '#7c3aed', intensity: 1.2 }; // Apprentice – Violet
  return { color: '#06b6d4', emissive: '#0891b2', intensity: 0.8 };               // Novice – Cyan
}

export default function AvatarPlayer({ gender = 'male', isPaused = false }: { gender?: 'male'|'female', isPaused?: boolean }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const playerStats = useGameStore(state => state.playerStats);
  const aura = useMemo(() => getAuraForXP(playerStats.knowledgeXP), [playerStats.knowledgeXP]);

  // Runner Mechanics State
  const laneRef = useRef(0); // -1 (left), 0 (center), 1 (right)
  const [targetX, setTargetX] = useState(0);
  const jumpForce = 16;
  const forwardSpeed = 30; // High speed
  const laneWidth = 4;
  
  // Track previous inputs to detect taps
  const prevInputRef = useRef({ left: false, right: false, jump: false });
  const isSlidingRef = useRef(false);
  const slideTimerRef = useRef(0);

  const victoryTrigger = useGameStore(state => state.victoryTrigger);
  const prevVictoryTrigger = useRef(victoryTrigger);
  const isVictoriousRef = useRef(false);
  const victoryTimerRef = useRef(0);

  // Initialize Audio
  useEffect(() => {
    const handleInit = () => sfx.init();
    window.addEventListener('keydown', handleInit, { once: true });
    window.addEventListener('pointerdown', handleInit, { once: true });
    return () => {
      window.removeEventListener('keydown', handleInit);
      window.removeEventListener('pointerdown', handleInit);
    };
  }, []);

  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (victoryTrigger > prevVictoryTrigger.current) {
       isVictoriousRef.current = true;
       victoryTimerRef.current = 1.5; // celebrate for 1.5s
       if (rigidBodyRef.current) {
          rigidBodyRef.current.setLinvel({ x: 0, y: jumpForce, z: 0 }, true);
       }
    }
    prevVictoryTrigger.current = victoryTrigger;
  }, [victoryTrigger]);

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const { left, right, jump, backward } = inputStore;
    const prev = prevInputRef.current;

    // Detect taps for lane switching
    if (left && !prev.left && !isPaused) {
        laneRef.current = Math.max(-1, laneRef.current - 1);
        setTargetX(laneRef.current * laneWidth);
    }
    if (right && !prev.right && !isPaused) {
        laneRef.current = Math.min(1, laneRef.current + 1);
        setTargetX(laneRef.current * laneWidth);
    }

    const pos = rb.translation();
    const linvel = rb.linvel();

    // Process Jump
    if (jump && !prev.jump && Math.abs(linvel.y) < 0.1 && pos.y < 2 && !isPaused) {
      rb.setLinvel({ x: linvel.x, y: jumpForce, z: linvel.z }, true);
      sfx.playJump();
    }

    // Process Slide
    if (backward && !isPaused) {
       if (!isSlidingRef.current) {
         isSlidingRef.current = true;
         slideTimerRef.current = 1.0; // slide for 1 second
         // Plunge downward instantly if in the air
         if (pos.y > 1) {
            rb.setLinvel({ x: linvel.x, y: -20, z: linvel.z }, true);
         }
       }
    }

    if (isSlidingRef.current) {
       slideTimerRef.current -= delta;
       if (slideTimerRef.current <= 0) {
           isSlidingRef.current = false;
       }
    }

    if (isVictoriousRef.current) {
       victoryTimerRef.current -= delta;
       if (victoryTimerRef.current <= 0) {
           isVictoriousRef.current = false;
       }
    }

    // Save inputs for next frame
    prevInputRef.current = { left, right, jump };

    // Apply Runner Velocities
    const diffX = targetX - pos.x;
    const velX = isPaused ? 0 : diffX * 15; // spring constant
    const currentSpeed = isPaused ? 0 : forwardSpeed;

    rb.setLinvel({ x: velX, y: rb.linvel().y, z: -currentSpeed }, true);

    // Visual Updates
    if (groupRef.current) {
      // Slide Animation
      if (isVictoriousRef.current) {
         groupRef.current.rotation.y += 10 * delta; // spin rapidly
         groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * delta);
         groupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 10 * delta);
         groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 10 * delta);
      } else if (isSlidingRef.current) {
         groupRef.current.rotation.y = Math.PI;
         groupRef.current.scale.set(1, 0.4, 1);
         groupRef.current.position.y = -0.5;
         groupRef.current.rotation.x = Math.PI / 2;
      } else {
         groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * delta);
         groupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 10 * delta);
         groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 10 * delta);
         // smoothly rotate back to facing forward
         let targetRotY = Math.PI;
         // Handle wrapping around Math.PI so it doesn't spin the wrong way
         while (groupRef.current.rotation.y > Math.PI * 2) groupRef.current.rotation.y -= Math.PI * 2;
         groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 10 * delta);
      }
    }

    // Running Animation
    const time = state.clock.getElapsedTime();
    const swingFactor = (isPaused || isSlidingRef.current || isVictoriousRef.current) ? 0 : Math.sin(time * 25) * 1.2; 
    
    if (leftArmRef.current) leftArmRef.current.rotation.x = isVictoriousRef.current ? Math.PI - 0.5 : THREE.MathUtils.lerp(leftArmRef.current.rotation.x, swingFactor, 0.5);
    if (rightArmRef.current) rightArmRef.current.rotation.x = isVictoriousRef.current ? Math.PI - 0.5 : THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -swingFactor, 0.5);
    if (leftLegRef.current) leftLegRef.current.rotation.x = isVictoriousRef.current ? 0 : THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -swingFactor, 0.5);
    if (rightLegRef.current) rightLegRef.current.rotation.x = isVictoriousRef.current ? 0 : THREE.MathUtils.lerp(rightLegRef.current.rotation.x, swingFactor, 0.5);

    // Camera locks behind the player on the Z axis
    const desiredPos = new THREE.Vector3(pos.x * 0.5, pos.y + 4, pos.z + 12);
    cameraPosition.current.lerp(desiredPos, 8 * delta);
    
    const desiredTarget = new THREE.Vector3(pos.x * 0.8, pos.y + 1, pos.z - 10);
    cameraTarget.current.lerp(desiredTarget, 10 * delta);

    state.camera.position.copy(cameraPosition.current);
    state.camera.lookAt(cameraTarget.current);
  });

  const hoodieColor = gender === 'male' ? '#ef4444' : '#a855f7'; // Bright Red or Purple
  const pantsColor = '#1e40af'; // Blue jeans
  const skinColor = '#fcd34d'; // Stylized tan skin
  const shoeColor = '#ffffff';

  return (
    <RigidBody 
       ref={rigidBodyRef} 
       name="avatar" 
       colliders={false} 
       mass={1} 
       type="dynamic" 
       position={[0, 10, 0]} 
       lockRotations 
       enabledRotations={[false, false, false]} 
       friction={0}
       onCollisionEnter={(p) => {
          if (p.other.rigidBodyObject?.name === 'obstacle') {
              sfx.playCrash();
              // Bounce back
              if (rigidBodyRef.current) {
                  rigidBodyRef.current.setLinvel({ x: 0, y: 10, z: 20 }, true);
              }
          }
       }}
    >
      <CapsuleCollider args={[0.5, 0.4]} position={[0, 1, 0]} />
      
      <group ref={groupRef} position={[0, 0, 0]}>
        
        {/* Head (Stylized Cartoon) */}
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial 
            color={skinColor} 
            roughness={0.4} 
            emissive={aura.emissive} 
            emissiveIntensity={aura.intensity * 0.2} 
          />
        </mesh>
        
        {/* Baseball Cap */}
        <mesh position={[0, 2.2, 0.1]}>
           <boxGeometry args={[0.62, 0.2, 0.62]} />
           <meshStandardMaterial color="#2563eb" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.2, -0.3]}>
           <boxGeometry args={[0.62, 0.05, 0.4]} />
           <meshStandardMaterial color="#2563eb" roughness={0.7} />
        </mesh>

        {/* Eyes/Goggles */}
        <mesh position={[0.15, 1.95, -0.31]}>
           <boxGeometry args={[0.15, 0.15, 0.05]} />
           <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.15, 1.95, -0.31]}>
           <boxGeometry args={[0.15, 0.15, 0.05]} />
           <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Torso (Hoodie) */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.7, 0.9, 0.5]} />
          <meshStandardMaterial color={hoodieColor} roughness={0.8} />
        </mesh>

        {/* Hoodie Pocket */}
        <mesh position={[0, 0.9, -0.26]}>
           <boxGeometry args={[0.4, 0.3, 0.05]} />
           <meshStandardMaterial color={hoodieColor} roughness={0.9} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[0.45, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.25, 0.6, 0.25]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color={hoodieColor} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[-0.45, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
             <boxGeometry args={[0.25, 0.6, 0.25]} />
             <meshStandardMaterial color={skinColor} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color={hoodieColor} />
          </mesh>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[0.2, 0.7, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.25, 0.5, 0.25]} />
            <meshStandardMaterial color={pantsColor} roughness={1} />
          </mesh>
          {/* Big Cartoon Shoe */}
          <mesh position={[0, -0.6, -0.1]}>
            <boxGeometry args={[0.35, 0.25, 0.5]} />
            <meshStandardMaterial color={shoeColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[-0.2, 0.7, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.25, 0.5, 0.25]} />
            <meshStandardMaterial color={pantsColor} roughness={1} />
          </mesh>
          <mesh position={[0, -0.6, -0.1]}>
            <boxGeometry args={[0.35, 0.25, 0.5]} />
            <meshStandardMaterial color={shoeColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Knowledge Aura Light */}
        <pointLight 
          position={[0, 1.5, 0]} 
          color={aura.color} 
          intensity={aura.intensity * 2} 
          distance={8} 
          decay={2}
        />
        {/* Knowledge Aura Mesh */}
        <mesh position={[0, 1.2, 0]}>
           <sphereGeometry args={[1.6, 32, 32]} />
           <meshBasicMaterial 
             color={aura.color} 
             transparent 
             opacity={0.15 * aura.intensity} 
             depthWrite={false} 
             blending={THREE.AdditiveBlending}
           />
        </mesh>
      </group>
    </RigidBody>
  );
}
