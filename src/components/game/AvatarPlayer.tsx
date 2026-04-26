import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { inputStore } from './useControls';

export default function AvatarPlayer({ gender = 'male', isPaused = false }: { gender?: 'male'|'female', isPaused?: boolean }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Load realistic textures safely without suspending Canvas
  const [shirtTex, setShirtTex] = useState<THREE.Texture | null>(null);
  const [jeansTex, setJeansTex] = useState<THREE.Texture | null>(null);

  // Runner Mechanics State
  const laneRef = useRef(0); // -1 (left), 0 (center), 1 (right)
  const [targetX, setTargetX] = useState(0);
  const jumpForce = 15;
  const forwardSpeed = 25; // Constant forward speed
  const laneWidth = 4;
  
  // Track previous inputs to detect taps
  const prevInputRef = useRef({ left: false, right: false, jump: false });

  useMemo(() => {
    if (typeof window !== 'undefined') {
      const loader = new THREE.TextureLoader();
      loader.load('/textures/shirt.png', (tex) => {
         tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
         tex.repeat.set(2, 2);
         setShirtTex(tex);
      });
      loader.load('/textures/jeans.png', (tex) => {
         tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
         tex.repeat.set(3, 3);
         setJeansTex(tex);
      });
    }
  }, []);

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
          ctx.fillStyle = '#ec4899';
          ctx.beginPath(); ctx.arc(64, 85, 8, 0, Math.PI, false); ctx.fill();
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(34, 55); ctx.lineTo(25, 45); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(94, 55); ctx.lineTo(103, 45); ctx.stroke();
      } else {
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(64, 80, 12, 0, Math.PI, false); ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [gender]);

  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const { left, right, jump } = inputStore;
    const prev = prevInputRef.current;

    // Detect taps for lane switching
    if (left && !prev.left) {
        laneRef.current = Math.max(-1, laneRef.current - 1);
        setTargetX(laneRef.current * laneWidth);
    }
    if (right && !prev.right) {
        laneRef.current = Math.min(1, laneRef.current + 1);
        setTargetX(laneRef.current * laneWidth);
    }

    const pos = rb.translation();
    const linvel = rb.linvel();

    // Process Jump
    if (jump && !prev.jump && Math.abs(linvel.y) < 0.1 && pos.y < 2) {
      rb.setLinvel({ x: linvel.x, y: jumpForce, z: linvel.z }, true);
    }

    // Save inputs for next frame
    prevInputRef.current = { left, right, jump };

    // Apply Runner Velocities
    // Snap X smoothly using velocity
    const diffX = targetX - pos.x;
    const velX = isPaused ? 0 : diffX * 15; // spring constant
    const currentSpeed = isPaused ? 0 : forwardSpeed;

    rb.setLinvel({ x: velX, y: linvel.y, z: -currentSpeed }, true);

    // Keep the avatar facing strictly forward
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.PI; // Face negative Z
    }

    // Running Animation
    const time = state.clock.getElapsedTime();
    const swingFactor = isPaused ? 0 : Math.sin(time * 20) * 1.2; 
    
    if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, swingFactor, 0.5);
    if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -swingFactor, 0.5);
    if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -swingFactor, 0.5);
    if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, swingFactor, 0.5);

    // Camera locks behind the player on the Z axis, but smoothly interpolates X to follow the lane subtly
    const desiredPos = new THREE.Vector3(pos.x * 0.5, pos.y + 4, pos.z + 12);
    cameraPosition.current.lerp(desiredPos, 8 * delta);
    
    const desiredTarget = new THREE.Vector3(pos.x * 0.8, pos.y + 1, pos.z - 10);
    cameraTarget.current.lerp(desiredTarget, 10 * delta);

    state.camera.position.copy(cameraPosition.current);
    state.camera.lookAt(cameraTarget.current);
  });

  const shirtColor = gender === 'male' ? '#1e3a8a' : '#d946ef';
  const pantsColor = gender === 'male' ? '#1e293b' : '#312e81';
  const hairColor = gender === 'male' ? '#3f2c19' : '#171717';

  return (
    <RigidBody ref={rigidBodyRef} name="platform" colliders={false} mass={1} type="dynamic" position={[0, 10, 0]} lockRotations enabledRotations={[false, false, false]} friction={0}>
      <CapsuleCollider args={[0.6, 0.4]} position={[0, 1, 0]} />
      
      <group ref={groupRef} position={[0, 0, 0]}>
        {/* Head */}
        <mesh position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          {faceTexture ? <meshStandardMaterial map={faceTexture} roughness={0.6} /> : <meshStandardMaterial color="#ffedd5" />}
        </mesh>
        {/* Hair */}
        <mesh position={[0, 2.1, gender === 'female' ? -0.1 : 0]}>
           {gender === 'female' ? <capsuleGeometry args={[0.37, 0.6, 16, 32]} /> : <sphereGeometry args={[0.36, 16, 16]} />}
           <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.1, 0]}>
          <capsuleGeometry args={[gender === 'male' ? 0.35 : 0.28, 0.5, 16, 32]} />
          {shirtTex ? <meshStandardMaterial map={shirtTex} color={shirtColor} roughness={0.9} /> : <meshStandardMaterial color={shirtColor} roughness={0.8} />}
        </mesh>
        {/* Left Arm */}
        <group ref={leftArmRef} position={[gender === 'male' ? 0.45 : 0.35, 1.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.12, 0.5, 16, 16]} />
            {shirtTex ? <meshStandardMaterial map={shirtTex} color={shirtColor} /> : <meshStandardMaterial color={shirtColor} />}
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
            {shirtTex ? <meshStandardMaterial map={shirtTex} color={shirtColor} /> : <meshStandardMaterial color={shirtColor} />}
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
            {jeansTex ? <meshStandardMaterial map={jeansTex} color={gender === 'female' ? '#6366f1' : '#ffffff'} roughness={1} /> : <meshStandardMaterial color={pantsColor} />}
          </mesh>
          <mesh position={[0, -0.7, 0.05]}><boxGeometry args={[0.2, 0.15, 0.3]} /><meshStandardMaterial color="#171717" roughness={0.8} /></mesh>
        </group>
        {/* Right Leg */}
        <group ref={rightLegRef} position={[-0.2, 0.7, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.15, 0.5, 16, 16]} />
            {jeansTex ? <meshStandardMaterial map={jeansTex} color={gender === 'female' ? '#6366f1' : '#ffffff'} roughness={1} /> : <meshStandardMaterial color={pantsColor} />}
          </mesh>
          <mesh position={[0, -0.7, 0.05]}><boxGeometry args={[0.2, 0.15, 0.3]} /><meshStandardMaterial color="#171717" roughness={0.8} /></mesh>
        </group>
      </group>
    </RigidBody>
  );
}
