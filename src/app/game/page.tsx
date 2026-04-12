'use client';

import dynamic from 'next/dynamic';

// Client-only — canvas won't run on the server
const FlappyGame = dynamic(() => import('@/components/FlappyGame'), { ssr: false });

export default function GamePage() {
  return <FlappyGame />;
}
