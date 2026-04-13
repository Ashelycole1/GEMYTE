'use client';

import { useState, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorldMeta {
  title: string;
  themeColor: string;
  sky: string;
}

export interface ContentNode {
  id: number;
  position: [number, number, number];
  fact: string;
  interactionType: 'click' | 'scan';
}

export interface BossChallenge {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GameConfig {
  worldMeta: WorldMeta;
  contentNodes: ContentNode[];
  finalBossChallenge: BossChallenge;
  _meta?: { generatedAt: string; orbId: string | null; textLength: number };
}

export type EngineStatus = 'idle' | 'loading' | 'active' | 'error';

// ── Defaults ──────────

const DEFAULT_CONFIG: GameConfig = {
  worldMeta: {
    title: 'Explore Knowledge',
    themeColor: '#3b82f6',
    sky: 'Night',
  },
  contentNodes: [],
  finalBossChallenge: {
    question: '',
    options: [],
    correctAnswer: '',
  },
};


// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGemyteEngine() {
  const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [questActive, setQuestActive] = useState(false);
  const [score, setScore] = useState(0);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Generate level from text content ────────────────────────────────────
  const generateLevel = useCallback(async (text: string, orbId?: string) => {
    if (!text) return;
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

      // Sanitize and scatter nodes across the open world
      if (Array.isArray(config.contentNodes)) {
         config.contentNodes = config.contentNodes.map((n, i) => {
            const rawPos = n.position || [Math.random() * 10 - 5, Math.random() * 3 + 1, Math.random() * -10];
            // Multiply X and Z by 15, keep Y relatively stable to the ground
            const scaledPos: [number, number, number] = [
              rawPos[0] * 15,
              Math.max(rawPos[1], 1), // Don't let it sink below ground
              rawPos[2] * 15
            ];
            return {
              ...n,
              id: n.id || i,
              position: scaledPos
            };
         });
      }

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
    setQuestActive(true);
    setScore(0);
    setTimeLeft(120); // default 2 mins

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
  }, []);

  const endQuest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuestActive(false);
    setTimeLeft(null);
  }, []);

  const markNodeComplete = useCallback((nodeId: string) => {
    setCompletedNodes(prev => {
      if (!prev.includes(nodeId)) return [...prev, nodeId];
      return prev;
    });
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
        if (data.evaluation.correct) setScore(s => s + (data.evaluation.xpAwarded || 10));
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
    setCompletedNodes([]);
  }, [endQuest]);

  return {
    gameConfig,
    status,
    error,
    questActive,
    score,
    timeLeft,
    completedNodes,
    themeColor: gameConfig.worldMeta.themeColor,
    generateLevel,
    startQuest,
    endQuest,
    validateAnswer,
    markNodeComplete,
    resetEngine,
  };
}
