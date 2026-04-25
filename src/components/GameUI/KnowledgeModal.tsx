import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function KnowledgeModal() {
  const { activeNodeId, blueprint, setActiveNode, setNodeStatus, conqueredStatus } = useGameStore();
  const [showHint, setShowHint] = useState(false);

  // Reset hint when a new node is selected
  useEffect(() => {
    setShowHint(false);
  }, [activeNodeId]);

  const activeNode = blueprint?.nodes.find(n => n.id === activeNodeId);

  const handleSelect = (option: string) => {
    if (!activeNode) return;
    const status = conqueredStatus[activeNode.id];
    if (status === 'correct') return; 
    
    if (option === activeNode.correctAnswer) {
      setNodeStatus(activeNode.id, 'correct');
      setTimeout(() => setActiveNode(null), 1500);
    } else {
      setNodeStatus(activeNode.id, 'wrong');
      setShowHint(true);
    }
  };

  return (
    <AnimatePresence>
      {activeNode && (
        <motion.div 
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <h2 className="text-cyan-400 font-bold flex items-center gap-2">
                <BrainCircuit size={20} />
                Knowledge Gate: {activeNode.topic}
              </h2>
              <button onClick={() => setActiveNode(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-lg text-slate-200 mb-6">{activeNode.question}</p>
              
              <div className="flex flex-col gap-3">
                {activeNode.options.map((opt, i) => {
                  return (
                    <button 
                      key={i}
                      onClick={() => handleSelect(opt)}
                      className="p-3 text-left rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-cyan-500 transition-colors text-slate-300"
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {showHint && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mt-6 p-4 rounded-lg bg-violet-950/30 border border-violet-500/30 text-violet-300 text-sm flex gap-3"
                >
                  <div className="pt-1"><BrainCircuit size={16} /></div>
                  <div>
                    <strong className="block mb-1">AI Pilot Hint:</strong>
                    {activeNode.hint}
                  </div>
                </motion.div>
              )}

              {conqueredStatus[activeNode.id] === 'correct' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="mt-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-center flex flex-col gap-2"
                >
                  <span className="font-bold text-lg">Gate Conquered!</span>
                  <span className="text-sm text-cyan-400">Knowledge Extracted & Streak Increased</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
