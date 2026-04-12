'use client';

import { useState, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorldSettings {
  gravity: number;          // -9.8 to 0
  ambientColor: string;     // hex
  accentColor: string;      // hex
  timeLimit: number;        // seconds
  nodeCount: number;        // 3-8
  floatIntensity: number;   // 0.5 to 3
  emissiveIntensity: number;// 0.3 to 2
}

export interface NodeProperties {
  mass: number;
  friction: number;
  restitution: number;
  initialVelocity: [number, number, number];
}

export interface Gameplay {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questTitle: string;
  targetKnowledge: string[];
  xpReward: number;
  hintText: string;
}

export interface GameConfig {
  worldSettings: WorldSettings;
  nodeProperties: NodeProperties;
  gameplay: Gameplay;
  _meta?: { generatedAt: string; orbId: string | null; textLength: number };
}

export type EngineStatus = 'idle' | 'loading' | 'active' | 'error';

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: GameConfig = {
  worldSettings: {
    gravity: 0,
    ambientColor: '#020817',
    accentColor: '#3b82f6',
    timeLimit: 120,
    nodeCount: 3,
    floatIntensity: 1,
    emissiveIntensity: 0.4,
  },
  nodeProperties: {
    mass: 1,
    friction: 0.1,
    restitution: 0.8,
    initialVelocity: [0, 0, 0],
  },
  gameplay: {
    difficulty: 'Easy',
    questTitle: 'Explore the Knowledge Space',
    targetKnowledge: [],
    xpReward: 50,
    hintText: '',
  },
};

// ── Difficulty → physics profile ──────────────────────────────────────────────

const DIFFICULTY_PROFILES = {
  Easy:   { floatSpeed: 1.0, responseGlow: '#34d399', badge: '🟢' },
  Medium: { floatSpeed: 1.8, responseGlow: '#fbbf24', badge: '🟡' },
  Hard:   { floatSpeed: 2.8, responseGlow: '#f87171', badge: '🔴' },
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGemyteEngine() {
  const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [questActive, setQuestActive] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Generate level from text content ────────────────────────────────────
  const generateLevel = useCallback(async (text: string, orbId?: string) => {
    if (!text || text.length < 10) return;
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/generate-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, orbId }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Engine generation failed');

      const config: GameConfig = data.gameConfig;

      // Clamp values for safety
      config.worldSettings.gravity = Math.max(-9.8, Math.min(0, config.worldSettings.gravity));
      config.worldSettings.floatIntensity = Math.max(0.5, Math.min(3, config.worldSettings.floatIntensity));
      config.worldSettings.emissiveIntensity = Math.max(0.3, Math.min(2, config.worldSettings.emissiveIntensity));
      config.worldSettings.nodeCount = Math.max(3, Math.min(8, config.worldSettings.nodeCount));

      setGameConfig(config);
      setStatus('active');
      return config;
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, []);

  // ── Start timed quest session ────────────────────────────────────────────
  const startQuest = useCallback(() => {
    const duration = gameConfig.worldSettings.timeLimit;
    setQuestActive(true);
    setScore(0);
    setTimeLeft(duration);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          setQuestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gameConfig.worldSettings.timeLimit]);

  const endQuest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuestActive(false);
    setTimeLeft(null);
  }, []);

  // ── Validate student answer ──────────────────────────────────────────────
  const validateAnswer = useCallback(async (
    answer: string,
    question: string,
    orbTitle?: string
  ): Promise<{
    correct: boolean;
    score: number;
    feedback: string;
    xpAwarded: number;
    hint: string;
  } | null> => {
    try {
      const res = await fetch('/api/validate-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, question, orbTitle }),
      });
      const data = await res.json();
      if (data.evaluation) {
        if (data.evaluation.correct) setScore(s => s + data.evaluation.score);
        return data.evaluation;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ── Reset to defaults ────────────────────────────────────────────────────
  const resetEngine = useCallback(() => {
    endQuest();
    setGameConfig(DEFAULT_CONFIG);
    setStatus('idle');
    setError(null);
    setScore(0);
  }, [endQuest]);

  // ── Derived values for R3F/Rapier ────────────────────────────────────────
  const physicsGravity: [number, number, number] = [
    0,
    gameConfig.worldSettings.gravity,
    0,
  ];

  const difficultyProfile =
    DIFFICULTY_PROFILES[gameConfig.gameplay.difficulty] ?? DIFFICULTY_PROFILES.Easy;

  return {
    // State
    gameConfig,
    status,
    error,
    questActive,
    score,
    timeLeft,

    // Derived R3F values — wire directly into <Physics> and <Float>
    physicsGravity,
    ambientColor: gameConfig.worldSettings.ambientColor,
    accentColor: gameConfig.worldSettings.accentColor,
    floatIntensity: gameConfig.worldSettings.floatIntensity,
    emissiveIntensity: gameConfig.worldSettings.emissiveIntensity,
    difficultyProfile,

    // Actions
    generateLevel,
    startQuest,
    endQuest,
    validateAnswer,
    resetEngine,
  };
}
