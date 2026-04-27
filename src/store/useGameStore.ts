import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LevelBlueprint, PlayerStats } from '../types';

interface GameState {
  blueprint: LevelBlueprint | null;
  activeNodeId: string | null;
  activeNodeStartTime: number | null;
  conqueredStatus: Record<string, 'correct' | 'wrong'>;
  score: number;
  playerStats: PlayerStats;
  victoryTrigger: number;
  
  setBlueprint: (bp: LevelBlueprint | null) => void;
  setActiveNode: (id: string | null) => void;
  setNodeStatus: (id: string, status: 'correct' | 'wrong') => void;
  triggerVictory: () => void;
  resetGame: () => void;
  syncWithBackend: () => Promise<void>;
}

const DEFAULT_PLAYER_STATS: PlayerStats = {
  knowledgeXP: 0,
  streakMultiplier: 1,
  unlockedSectors: []
};

// Replace with dynamic ID if auth is added
const PLAYER_ID = 'test_user';
const API_URL = 'http://localhost:8000';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      blueprint: null,
      activeNodeId: null,
      activeNodeStartTime: null,
      conqueredStatus: {},
      score: 0,
      playerStats: DEFAULT_PLAYER_STATS,
      victoryTrigger: 0,
      
      setBlueprint: (bp) => set({ blueprint: bp, conqueredStatus: {}, activeNodeId: null, activeNodeStartTime: null }),
      setActiveNode: (id) => set({ activeNodeId: id, activeNodeStartTime: id ? Date.now() : null }),
      triggerVictory: () => set((state) => ({ victoryTrigger: state.victoryTrigger + 1 })),
      setNodeStatus: (id, status) => {
        set((state) => {
          const isNewCorrect = status === 'correct' && state.conqueredStatus[id] !== 'correct';
          
          let updatedStats = { ...state.playerStats };
          let updatedScore = state.score;

          if (isNewCorrect) {
            // Time-based XP calculation
            const timeSpentMs = state.activeNodeStartTime ? Date.now() - state.activeNodeStartTime : 10000;
            const secondsSpent = Math.max(1, timeSpentMs / 1000);
            
            // Base XP is 100. Faster response gives a time multiplier (up to 2x for < 5s).
            const timeMultiplier = secondsSpent < 5 ? 2.0 : secondsSpent < 15 ? 1.5 : 1.0;
            
            const earnedXP = Math.floor(100 * timeMultiplier * updatedStats.streakMultiplier);
            
            updatedStats.knowledgeXP += earnedXP;
            updatedStats.streakMultiplier = Math.min(updatedStats.streakMultiplier + 0.1, 3.0); // Max streak is 3.0x
            updatedScore += earnedXP;
          } else if (status === 'wrong') {
            // Reset streak on wrong answer
            updatedStats.streakMultiplier = 1.0;
          }

          return { 
            conqueredStatus: { ...state.conqueredStatus, [id]: status },
            score: updatedScore,
            playerStats: updatedStats
          };
        });
        
        // Fire and forget sync to backend
        get().syncWithBackend().catch(console.error);
      },
      resetGame: () => set({ blueprint: null, activeNodeId: null, activeNodeStartTime: null, conqueredStatus: {}, score: 0, playerStats: DEFAULT_PLAYER_STATS }),
      syncWithBackend: async () => {
        try {
          const state = get();
          await fetch(`${API_URL}/stats/${PLAYER_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.playerStats)
          });
        } catch (error) {
          console.error("Failed to sync stats with backend:", error);
        }
      }
    }),
    {
      name: 'gemyte-storage', // key in local storage setup for persist middleware
      storage: createJSONStorage(() => localStorage),
    }
  )
);
