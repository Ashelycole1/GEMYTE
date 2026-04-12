import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

const SPEED = 5;
const jumpForce = 4;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

// Define our keyboard map mapping names
export enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
}

export function Player() {
  const rigidBody = useRef<any>(null);
  const [, get] = useKeyboardControls();
  const { rapier, world } = useRapier();
  const [isHovering, setIsHovering] = useState(false);

  useFrame((state) => {
    if (!rigidBody.current) return;

    const velocity = rigidBody.current.linvel();
    const { forward, back, left, right, jump } = get();

    // Movement
    frontVector.set(0, 0, Number(back) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    
    // We compute the direction relative to the camera's rotation so WASD is always camera relative
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(state.camera.rotation);

    // Apply movement while preserving vertical velocity (gravity/falling)
    rigidBody.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

    // Jumping - basic raycast to check if grounded
    const playerPos = rigidBody.current.translation();
    
    // We attach the camera to the player position!
    // Offset camera slightly behind and above the player for third-person,
    // or put it directly inside the player for first person.
    // Let's do a pseudo first-person / closely attached camera.
    state.camera.position.set(playerPos.x, playerPos.y + 0.5, playerPos.z + 5);
    // state.camera.lookAt(playerPos.x, playerPos.y, playerPos.z); // Optional: look at character
    
    if (jump) {
        // basic debounce to prevent flying - we can refine this later
        if (Math.abs(velocity.y) < 0.1) {
            rigidBody.current.setLinvel({ x: velocity.x, y: jumpForce, z: velocity.z }, true);
        }
    }
  });

  return (
    <RigidBody
      ref={rigidBody}
      colliders={false}
      mass={1}
      type="dynamic"
      position={[0, 5, 0]}
      enabledRotations={[false, false, false]} // Don't let the player tip over
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      {/* Visual representation of the player */}
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 16]} />
        <meshStandardMaterial color="hotpink" roughness={0.2} metalness={0.8} />
      </mesh>
    </RigidBody>
  );
}
