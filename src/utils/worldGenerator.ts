import type { LevelBlueprint } from '../types';

export function generateWorld(blueprint: LevelBlueprint | null) {
  if (!blueprint) return [];
  
  return blueprint.nodes.map((node) => {
    // Generate random spherical coordinates for orbit
    const radius = 3 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Scale derived from difficulty
    const scale = 0.2 + (node.difficulty * 0.1);

    const geometries = ['box', 'sphere', 'tetrahedron'] as const;
    const randomGeo = geometries[Math.floor(Math.random() * geometries.length)];
    const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      ...node,
      position: [x, y, z] as [number, number, number],
      speed: 0.2 + Math.random() * 0.5,
      scale,
      geometry: randomGeo,
      color: randomColor
    };
  });
}
