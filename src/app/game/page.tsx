'use client';

import dynamic from 'next/dynamic';

const WorldSpawner = dynamic(() => import('@/components/WorldSpawner'), { ssr: false });

export default function GamePage() {
  return <WorldSpawner />;
}
