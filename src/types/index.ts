export interface NodeData {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  position?: [number, number, number];
  difficulty: number;
  prerequisiteId?: string; // ID of the node that must be completed first
}

export interface PlayerStats {
  knowledgeXP: number;
  streakMultiplier: number;
  unlockedSectors: string[];
}

export interface LevelBlueprint {
  environment: string;
  nodes: NodeData[];
}
