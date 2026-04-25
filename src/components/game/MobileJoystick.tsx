import { useEffect, useRef, useState } from 'react';
import { inputStore } from './useControls';
import { ArrowUp } from 'lucide-react';

export default function MobileJoystick() {
  const leftPadRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const pad = leftPadRef.current;
    if (!pad) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchId.current !== null) return; // already active
      const touch = e.changedTouches[0];
      touchId.current = touch.identifier;
      const rect = pad.getBoundingClientRect();
      const ox = touch.clientX - rect.left;
      const oy = touch.clientY - rect.top;
      origin.current = { x: ox, y: oy };
      setActive(true);
      setKnobPos({ x: ox, y: oy });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId.current) {
          const rect = pad.getBoundingClientRect();
          const cx = t.clientX - rect.left;
          const cy = t.clientY - rect.top;

          // Vector from origin
          const dx = cx - origin.current.x;
          const dy = cy - origin.current.y;
          const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 40); // max radius 40px
          const angle = Math.atan2(dy, dx);

          const clampedX = origin.current.x + Math.cos(angle) * dist;
          const clampedY = origin.current.y + Math.sin(angle) * dist;

          setKnobPos({ x: clampedX, y: clampedY });

          // Update store (threshold 10px)
          inputStore.forward = dy < -10;
          inputStore.backward = dy > 10;
          inputStore.right = dx > 10;
          inputStore.left = dx < -10;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          touchId.current = null;
          setActive(false);
          inputStore.forward = false;
          inputStore.backward = false;
          inputStore.left = false;
          inputStore.right = false;
        }
      }
    };

    pad.addEventListener('touchstart', handleTouchStart);
    pad.addEventListener('touchmove', handleTouchMove);
    pad.addEventListener('touchend', handleTouchEnd);
    pad.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      pad.removeEventListener('touchstart', handleTouchStart);
      pad.removeEventListener('touchmove', handleTouchMove);
      pad.removeEventListener('touchend', handleTouchEnd);
      pad.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <>
      {/* Left half movement pad */}
      <div 
        ref={leftPadRef} 
        className="absolute bottom-0 left-0 w-1/2 h-1/2 z-40 touch-none"
      >
        {active && (
          <div 
            className="absolute w-20 h-20 rounded-full border-2 border-white/20 bg-white/5 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: origin.current.x, top: origin.current.y }}
          >
            <div 
              className="absolute w-10 h-10 rounded-full bg-white/40 backdrop-blur-md shadow-lg transition-transform"
              style={{
                left: knobPos.x - origin.current.x + 20, /* center in outer circle */
                top: knobPos.y - origin.current.y + 20
              }}
            />
          </div>
        )}
      </div>

      {/* Right side jump button */}
      <div className="absolute bottom-8 right-8 z-40">
        <button 
          onPointerDown={() => inputStore.jump = true}
          onPointerUp={() => inputStore.jump = false}
          onPointerCancel={() => inputStore.jump = false}
          className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center active:bg-white/30 transition-colors touch-none shadow-xl"
        >
          <ArrowUp className="w-8 h-8 text-white/80" />
        </button>
      </div>
    </>
  );
}
