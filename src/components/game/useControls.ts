import { createRef, useEffect, useState } from 'react';

// A simple global store to track input without triggering React re-renders in 3D canvas
export const inputStore = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

// Map keyboard events
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW': inputStore.forward = true; break;
      case 'ArrowDown':
      case 'KeyS': inputStore.backward = true; break;
      case 'ArrowLeft':
      case 'KeyA': inputStore.left = true; break;
      case 'ArrowRight':
      case 'KeyD': inputStore.right = true; break;
      case 'Space': inputStore.jump = true; break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW': inputStore.forward = false; break;
      case 'ArrowDown':
      case 'KeyS': inputStore.backward = false; break;
      case 'ArrowLeft':
      case 'KeyA': inputStore.left = false; break;
      case 'ArrowRight':
      case 'KeyD': inputStore.right = false; break;
      case 'Space': inputStore.jump = false; break;
    }
  });
}

// Hook to check if we are on mobile to show the joystick
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}
