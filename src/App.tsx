import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ArrowRight, ShieldCheck } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Scene } from './components/Scene'
import { KnowledgeModal } from './components/GameUI/KnowledgeModal'
import { useGameStore } from './store/useGameStore'

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="relative z-20 flex flex-col items-center justify-center min-h-screen text-white bg-slate-950/80 backdrop-blur-md px-6 text-center pointer-events-auto"
  >
    <motion.div 
      initial={{ y: -20, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
      className="mb-8 p-1 rounded-[2rem] shadow-2xl shadow-cyan-500/30 overflow-hidden border border-cyan-500/30 bg-slate-900"
    >
      <img src="/gemyte-logo.jpeg" alt="Gemyte Logo" className="w-40 h-40 object-cover rounded-full" />
    </motion.div>
    
    <h1 className="text-6xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">
      GEMYTE
    </h1>
    <p className="text-xl text-slate-400 max-w-lg mb-10 font-light">
      Master your academic syllabus through AI-driven 3D exploration. 
      Upload. Play. Dominate.
    </p>

    <button 
      onClick={onStart}
      className="group relative flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 transition-all rounded-full font-bold text-slate-950 overflow-hidden shadow-[0_0_20px_#06b6d4]"
    >
      <span className="relative z-10">LAUNCH PILOT MISSION</span>
      <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
      <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform" />
    </button>
  </motion.div>
);

function App() {
  const blueprint = useGameStore(state => state.blueprint)
  const [view, setView] = useState<'landing' | 'app'>('landing');

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans">
      
      {/* 3D Engine Layer (Always behind UI) */}
      <Scene blueprint={blueprint} />

      {/* UI Overlays */}
      <AnimatePresence>
        {view === 'landing' ? (
          <LandingPage onStart={() => setView('app')} />
        ) : (
          <motion.div 
            initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="absolute inset-0 z-30 pointer-events-none"
          >
            <div className="pointer-events-auto">
              <Sidebar />
            </div>
            
            <div className="pointer-events-auto">
              <KnowledgeModal />
            </div>
            
            {/* Success Toast (Small, not blocking) */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 right-10 p-4 bg-cyan-950/40 border border-cyan-500/50 backdrop-blur-md rounded-2xl flex items-center gap-3 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tighter">System Status</p>
                <p className="text-sm font-light">Phase 4 Sync Complete</p>
              </div>
            </motion.div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
