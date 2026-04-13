import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { inputStore } from './useControls';

export default function AvatarPlayer() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Generate a classic smiling face texture proceduraly
  const faceTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fde047'; // yellow base
      ctx.fillRect(0, 0, 128, 128);
      
      ctx.fillStyle = '#000000'; // black eyes and mouth
      // Left eye
      ctx.beginPath(); ctx.arc(40, 50, 8, 0, Math.PI * 2); ctx.fill();
      // Right eye
      ctx.beginPath(); ctx.arc(88, 50, 8, 0, Math.PI * 2); ctx.fill();
      // Simple smile
      ctx.beginPath();
      ctx.arc(64, 75, 25, 0, Math.PI, false); // top of smile
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  const speed = 8;
  const jumpForce = 10;
  
  // Smoothing values
  const currentVel = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const { forward, backward, left, right, jump } = inputStore;

    // Movement vector
    const direction = new THREE.Vector3();
    
    // Get camera's look direction and flatten y
    const camDir = new THREE.Vector3();
    state.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    // Right vector relative to camera
    const camRight = new THREE.Vector3().crossVectors(state.camera.up, camDir).normalize();

    if (forward) direction.add(camDir);
    if (backward) direction.sub(camDir);
    if (left) direction.add(camRight);
    if (right) direction.sub(camRight);

    if (direction.length() > 0) {
      direction.normalize();
    }

    // Apply horizontal velocity
    const linvel = rb.linvel();
    rb.setLinvel({
      x: direction.x * speed,
      y: linvel.y,
      z: direction.z * speed
    }, true);

    // Jump
    if (jump && Math.abs(linvel.y) < 0.1) {
      rb.setLinvel({ x: linvel.x, y: jumpForce, z: linvel.z }, true);
      // Wait a bit before allowing another jump store processing
      inputStore.jump = false; 
    }

    // Rotate character visually towards movement
    if (direction.lengthSq() > 0.01 && groupRef.current) {
      const angle = Math.atan2(direction.x, direction.z);
      // Smoothly slerp rotation
      const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      groupRef.current.quaternion.slerp(targetQuat, 0.15);
    }

    // --- Procedural Walking Animation (Limb Swinging) ---
    const isMoving = direction.lengthSq() > 0.1;
    const time = state.clock.getElapsedTime();
    const swingFactor = isMoving ? Math.sin(time * 12) * 0.8 : 0; // 12 determines stride speed
    
    // Lerp arms and legs to the target swing angle
    if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, swingFactor, 0.2);
    if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -swingFactor, 0.2);
    
    if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -swingFactor, 0.2);
    if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, swingFactor, 0.2);


    // --- Custom Third-Person Camera Follow ---
    const pos = rb.translation();
    const playerPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    // Ideal camera offset relative to player
    const offset = new THREE.Vector3();
    
    // If no direct movement, just hover back. If moving, follow behind smoothly.
    // We use a fixed lag behind camera to allow orbit-like feel, but strictly following.
    // For simplicity, a smooth trailing camera:
    const desiredPos = new THREE.Vector3(pos.x, pos.y + 3, pos.z + 8);
    cameraPosition.current.lerp(desiredPos, 5 * delta);
    
    const desiredTarget = new THREE.Vector3(pos.x, pos.y + 1, pos.z);
    cameraTarget.current.lerp(desiredTarget, 10 * delta);

    state.camera.position.copy(cameraPosition.current);
    state.camera.lookAt(cameraTarget.current);
  });

  return (
    <RigidBody ref={rigidBodyRef} colliders={false} mass={1} type="dynamic" position={[0, 5, 0]} lockRotations enabledRotations={[false, false, false]}>
      {/* Physics body */}
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
      
      {/* Visual Model */}
      <group ref={groupRef} position={[0, 0, 0]}>
        
        {/* Head */}
        <mesh ref={headRef} position={[0, 1.8, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          {/* Apply face texture to front (z axis), yellow to others */}
          {faceTexture ? (
            <>
              <meshStandardMaterial attach="material-0" color="#fde047" /> {/* right */}
              <meshStandardMaterial attach="material-1" color="#fde047" /> {/* left */}
              <meshStandardMaterial attach="material-2" color="#fde047" /> {/* top */}
              <meshStandardMaterial attach="material-3" color="#fde047" /> {/* bottom */}
              <meshStandardMaterial attach="material-4" map={faceTexture} /> {/* front */}
              <meshStandardMaterial attach="material-5" color="#fde047" /> {/* back */}
            </>
          ) : (
            <meshStandardMaterial color="#fde047" />
          )}
        </mesh>

        {/* Torso (Shirt) */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.4]} />
          <meshStandardMaterial color="#ef4444" /> {/* Red Shirt */}
        </mesh>

        {/* Left Arm Hub */}
        <group ref={leftArmRef} position={[0.55, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.3, 0.8, 0.3]} />
            <meshStandardMaterial color="#ef4444" /> {/* Shirt Sleeve */}
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
            <meshStandardMaterial color="#fde047" /> {/* Hand */}
          </mesh>
        </group>

        {/* Right Arm Hub */}
        <group ref={rightArmRef} position={[-0.55, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.3, 0.8, 0.3]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
            <meshStandardMaterial color="#fde047" />
          </mesh>
        </group>

        {/* Left Leg Hub */}
        <group ref={leftLegRef} position={[0.2, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.35, 0.7, 0.35]} />
            <meshStandardMaterial color="#1d4ed8" /> {/* Blue Pants */}
          </mesh>
        </group>

        {/* Right Leg Hub */}
        <group ref={rightLegRef} position={[-0.2, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.35, 0.7, 0.35]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
        </group>

      </group>
    </RigidBody>
  );
}
