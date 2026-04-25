import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileType, CheckCircle2, Terminal, Trophy } from 'lucide-react'
import { parseKnowledgePayload } from '../services/aiPilot'
import { useGameStore } from '../store/useGameStore'

export function Sidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'pilot' | 'rankings'>('pilot')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setBlueprint = useGameStore(state => state.setBlueprint)
  const score = useGameStore(state => state.score)
  const playerStats = useGameStore(state => state.playerStats)

  const logMessage = useCallback((msg: string) => {
    setLogs(prev => [...prev, msg])
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovered(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await startProcessing(e.dataTransfer.files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsHovered(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsHovered(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await startProcessing(e.target.files[0])
    }
  }

  const startProcessing = async (file: File) => {
    setStatus('processing')
    setLogs(['Initiating drag protocol...', 'Receiving payloads...'])
    
    try {
      const blueprint = await parseKnowledgePayload(file, logMessage);
      setBlueprint(blueprint);
    } catch (e) {
      logMessage('Error during extraction.');
    }
    
    setStatus('done')
  }

  const reset = () => {
    setStatus('idle')
    setLogs([])
  }

  // Generate Leaderboard
  const leaderboard = [
    { name: 'Alex K.', score: 1400 },
    { name: 'Deepmind Architect', score: 1200 },
    { name: 'You (Pilot)', score: score },
    { name: 'Sarah T.', score: 800 },
    { name: 'Jaxon R.', score: 500 },
  ].sort((a, b) => b.score - a.score);

  return (
    <motion.div 
      initial={{ x: -400 }}
      animate={{ x: 0 }}
      className="absolute top-0 left-0 h-full w-80 bg-slate-900/80 backdrop-blur-md border-r border-slate-800 shadow-2xl p-6 flex flex-col z-10 text-slate-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <span className="font-bold text-white text-sm">G</span>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 pb-1">
          Gemyte
        </h1>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('pilot')} 
          className={`font-bold pb-2 border-b-2 text-sm transition-colors ${activeTab === 'pilot' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('rankings')} 
          className={`font-bold pb-2 border-b-2 text-sm transition-colors ${activeTab === 'rankings' ? 'border-violet-400 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Global Rankings
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'rankings' && (
          <motion.div
            key="rankings"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="flex items-center gap-2 text-violet-400 mb-4 font-bold">
              <Trophy size={18} /> Social Leaderboard
            </div>
            {leaderboard.map((user, idx) => (
              <div key={idx} className={`p-3 rounded-lg mb-2 flex justify-between items-center shadow-lg ${user.name.includes('Pilot') ? 'bg-cyan-900/40 border border-cyan-500/50' : 'bg-slate-800/50 border border-slate-800'}`}>
                <span className={`font-bold flex items-center gap-2 ${user.name.includes('Pilot') ? 'text-cyan-300' : 'text-slate-300'}`}>
                  <span className="text-xs text-slate-500">#{idx + 1}</span> {user.name}
                </span>
                <span className="font-mono text-violet-300 text-sm bg-violet-950/50 px-2 py-0.5 rounded">{user.score} pt</span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'pilot' && status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-colors duration-300 cursor-pointer ${isHovered ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700 hover:border-violet-500/50'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="p-4 rounded-full bg-slate-800/50 mb-4 pointer-events-none text-cyan-400">
              <UploadCloud size={32} />
            </div>
            <h3 className="font-semibold text-lg mb-2 pointer-events-none">Deploy Knowledge</h3>
            <p className="text-slate-400 text-sm text-center pointer-events-none">
              Drag & drop PDFs or text files to begin ingestion.
            </p>
          </motion.div>
        )}

        {activeTab === 'pilot' && status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-center p-6 border border-cyan-500/30 bg-cyan-950/20 rounded-xl mb-4 relative overflow-hidden">
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              <FileType size={32} className="text-cyan-400 animate-pulse relative z-10" />
            </div>
            
            <div className="flex-1 bg-black/60 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-y-auto flex flex-col gap-2 relative">
                <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
                    <Terminal size={14} /> Agent Terminal
                </div>
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={i}
                  className="text-cyan-300 flex gap-2"
                >
                  <span className="text-violet-400">{'>'}</span> {log}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'pilot' && status === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 border border-violet-500/30 bg-violet-950/20 rounded-xl"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-4 text-violet-400"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <h3 className="font-bold text-lg mb-2 text-violet-300">Phase Complete</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Knowledge structures have been materialized in the orbital layout.
            </p>
            <button 
              onClick={reset}
              className="px-6 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity w-full shadow-[0_0_15px_rgba(139,92,246,0.3)] text-white"
            >
              Deploy Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Gamification Stats Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Knowledge XP:</span>
          <span className="font-bold text-cyan-400">{playerStats?.knowledgeXP || 0}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-slate-400">Streak:</span>
          <span className="font-bold text-violet-400">{playerStats?.streakMultiplier.toFixed(1) || '1.0'}x</span>
        </div>
      </div>
    </motion.div>
  )
}
