import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { inputStore } from './useControls';

export default function AvatarPlayer({ gender = 'male' }: { gender?: 'male'|'female' }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Generate face
  const faceTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffedd5'; // skin color
      ctx.fillRect(0, 0, 128, 128);
      
      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(40, 60, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(88, 60, 6, 0, Math.PI * 2); ctx.fill();
      
      if (gender === 'female') {
          // Female: Pink lips, eyeliner
          ctx.fillStyle = '#ec4899';
          ctx.beginPath(); ctx.arc(64, 85, 8, 0, Math.PI, false); ctx.fill();
          // Eyelashes
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(34, 55); ctx.lineTo(25, 45); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(94, 55); ctx.lineTo(103, 45); ctx.stroke();
      } else {
          // Male: Standard smile
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(64, 80, 12, 0, Math.PI, false); ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [gender]);

  const speed = 10;
  const jumpForce = 10;
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const { forward, backward, left, right, jump } = inputStore;
    const direction = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    state.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    const camRight = new THREE.Vector3().crossVectors(state.camera.up, camDir).normalize();

    if (forward) direction.add(camDir);
    if (backward) direction.sub(camDir);
    if (left) direction.add(camRight);
    if (right) direction.sub(camRight);

    if (direction.length() > 0) direction.normalize();

    const linvel = rb.linvel();
    rb.setLinvel({ x: direction.x * speed, y: linvel.y, z: direction.z * speed }, true);

    if (jump && Math.abs(linvel.y) < 0.1) {
      rb.setLinvel({ x: linvel.x, y: jumpForce, z: linvel.z }, true);
      inputStore.jump = false; 
    }

    if (direction.lengthSq() > 0.01 && groupRef.current) {
      const angle = Math.atan2(direction.x, direction.z);
      const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      groupRef.current.quaternion.slerp(targetQuat, 0.15);
    }

    // Walking Animation
    const isMoving = direction.lengthSq() > 0.1;
    const time = state.clock.getElapsedTime();
    const swingFactor = isMoving ? Math.sin(time * 15) * 0.9 : 0; 
    
    if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, swingFactor, 0.2);
    if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -swingFactor, 0.2);
    if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -swingFactor, 0.2);
    if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, swingFactor, 0.2);

    const pos = rb.translation();
    const desiredPos = new THREE.Vector3(pos.x, pos.y + 3, pos.z + 8);
    cameraPosition.current.lerp(desiredPos, 5 * delta);
    
    const desiredTarget = new THREE.Vector3(pos.x, pos.y + 1, pos.z);
    cameraTarget.current.lerp(desiredTarget, 10 * delta);

    state.camera.position.copy(cameraPosition.current);
    state.camera.lookAt(cameraTarget.current);
  });

  // Clothing Colors
  const shirtColor = gender === 'male' ? '#1e3a8a' : '#d946ef'; // Navy or Fuchsia
  const pantsColor = gender === 'male' ? '#1e293b' : '#312e81'; // Slate or Indigo
  const hairColor = gender === 'male' ? '#3f2c19' : '#171717';

  return (
    <RigidBody ref={rigidBodyRef} colliders={false} mass={1} type="dynamic" position={[0, 10, 0]} lockRotations enabledRotations={[false, false, false]} friction={0.5} restitution={0}>
      {/* Capsule: half-height=0.6, radius=0.4, centered at avatar's mid-body */}
      <CapsuleCollider args={[0.55, 0.38]} position={[0, 1.0, 0]} />
      
      <group ref={groupRef} position={[0, 0, 0]}>
        
        {/* Head — rotation aligns UV face center to local +Z (character forward) */}
        <mesh position={[0, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          {faceTexture ? (
             <meshStandardMaterial map={faceTexture} roughness={0.6} />
          ) : (
             <meshStandardMaterial color="#ffedd5" />
          )}
        </mesh>

        {/* Hair */}
        <mesh position={[0, 2.1, gender === 'female' ? -0.1 : 0]}>
           {gender === 'female' ? (
              <capsuleGeometry args={[0.37, 0.6, 16, 32]} />
           ) : (
              <sphereGeometry args={[0.36, 16, 16]} />
           )}
           <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>

        {/* Torso (Rounded Capsule) */}
        <mesh position={[0, 1.1, 0]}>
          <capsuleGeometry args={[gender === 'male' ? 0.35 : 0.28, 0.5, 16, 32]} />
          <meshStandardMaterial color={shirtColor} roughness={0.8} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[gender === 'male' ? 0.45 : 0.35, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.12, 0.5, 16, 16]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#ffedd5" />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[gender === 'male' ? -0.45 : -0.35, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.12, 0.5, 16, 16]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#ffedd5" />
          </mesh>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[0.2, 0.7, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.15, 0.5, 16, 16]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.7, 0.05]}>
            <boxGeometry args={[0.2, 0.15, 0.3]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[-0.2, 0.7, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.15, 0.5, 16, 16]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          <mesh position={[0, -0.7, 0.05]}>
            <boxGeometry args={[0.2, 0.15, 0.3]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>

      </group>
    </RigidBody>
  );
}
