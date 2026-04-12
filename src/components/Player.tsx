import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

const JUMP_FORCE = 6;

export function Player({ isPaused }: { isPaused: boolean }) {
  const rigidBody = useRef<any>(null);
  const [, get] = useKeyboardControls();
  
  // Track last jump to prevent spamming
  const lastJumpTime = useRef(0);

  useFrame((state) => {
    if (!rigidBody.current || isPaused) {
      if (rigidBody.current && isPaused) {
         // Pause the physics velocities while answering questions
         rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
         // Keep gravity from pulling
         rigidBody.current.setGravityScale(0, true);
      }
      return;
    }
    
    // Resume gravity if unpaused
    rigidBody.current.setGravityScale(1, true);

    const { jump } = get();
    const velocity = rigidBody.current.linvel();
    const now = state.clock.getElapsedTime();

    // Flap mechanic
    if (jump && now - lastJumpTime.current > 0.3) {
        lastJumpTime.current = now;
        // Reset current vertical velocity and apply jump force upwards
        rigidBody.current.setLinvel({ x: 0, y: JUMP_FORCE, z: 0 }, true);
    }
    
    // Camera remains somewhat static but follows player slightly on Y to keep them framed
    const playerPos = rigidBody.current.translation();
    state.camera.position.lerp(new THREE.Vector3(0, Math.max(2, playerPos.y), 15), 0.1);
    state.camera.lookAt(0, Math.max(2, playerPos.y), 0);
  });

  return (
    <RigidBody
      ref={rigidBody}
      colliders={false}
      mass={1}
      type="dynamic"
      position={[0, 5, 0]}
      restitution={0.2}
      // Lock X and Z axes, only allow Y movement
      enabledTranslations={[false, true, false]}
      enabledRotations={[false, false, false]} 
    >
      <BallCollider args={[0.6]} />
      {/* Visual representation of the Flappy Avatar */}
      <mesh castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
    </RigidBody>
  );
}
