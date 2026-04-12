'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────
interface GameConfig {
  questTitle: string;
  difficulty: string;
  bgColor: string;
  pipeColor: string;
  birdColor: string;
  topics: { title: string; question: string }[];
  xpReward: number;
}

interface Pipe {
  x: number;
  topH: number;
  gap: number;
  passed: boolean;
  isQuizPipe: boolean;
  topicIndex: number;
}

interface Bird {
  y: number;
  vy: number;
  angle: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 480;
const H = 640;
const BIRD_X = 90;
const BIRD_R = 18;
const PIPE_W = 68;
const PIPE_SPEED_BASE = 2.8;
const GRAVITY = 0.45;
const JUMP_VY = -9;
const PIPE_INTERVAL = 210; // frames between pipes

type GameState = 'idle' | 'playing' | 'paused' | 'dead' | 'win';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<GameState>('idle');
  const birdRef = useRef<Bird>({ y: H / 2, vy: 0, angle: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const totalAnswered = useRef(0);

  const [displayState, setDisplayState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [quizTopic, setQuizTopic] = useState<{ title: string; question: string } | null>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [xpEarned, setXpEarned] = useState(0);

  // Load config from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('gemyte_game_config');
    if (raw) {
      try {
        setConfig(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const pipeColor = config?.pipeColor || '#1e3a5f';
  const bgColor = config?.bgColor || '#030712';
  const birdColor = config?.birdColor || '#38bdf8';
  const pipeSpeed = config?.difficulty === 'Hard' ? 4.2 : config?.difficulty === 'Medium' ? 3.4 : PIPE_SPEED_BASE;

  // ─── Canvas draw ─────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const bird = birdRef.current;
    const pipes = pipesRef.current;
    const st = stateRef.current;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(1, '#0a0f1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + frameRef.current * 0.2) % W);
      const sy = ((i * 97)) % H;
      const r = (i % 3 === 0) ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground line
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, H - 60, W, 60);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 60);
    ctx.lineTo(W, H - 60);
    ctx.stroke();

    // Grid lines on ground
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let gx = (frameRef.current * pipeSpeed % 40); gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, H - 60);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }

    // Pipes
    for (const pipe of pipes) {
      const isQuiz = pipe.isQuizPipe;
      const pColor = isQuiz ? '#6366f1' : pipeColor;
      const capColor = isQuiz ? '#818cf8' : adjustColor(pipeColor, 40);

      // Top pipe
      ctx.fillStyle = pColor;
      roundRect(ctx, pipe.x, 0, PIPE_W, pipe.topH, [0, 0, 8, 8]);
      ctx.fillStyle = capColor;
      roundRect(ctx, pipe.x - 6, pipe.topH - 20, PIPE_W + 12, 20, [0, 0, 8, 8]);

      // Bottom pipe
      const botY = pipe.topH + pipe.gap;
      ctx.fillStyle = pColor;
      roundRect(ctx, pipe.x, botY, PIPE_W, H - botY - 60, [8, 8, 0, 0]);
      ctx.fillStyle = capColor;
      roundRect(ctx, pipe.x - 6, botY, PIPE_W + 12, 20, [8, 8, 0, 0]);

      // Quiz pipe glow + icon
      if (isQuiz) {
        ctx.save();
        ctx.strokeStyle = 'rgba(99,102,241,0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(pipe.x - 4, pipe.topH + 4, PIPE_W + 8, pipe.gap - 8);
        ctx.setLineDash([]);
        ctx.restore();

        // "?" icon in gap
        const midY = pipe.topH + pipe.gap / 2;
        ctx.fillStyle = 'rgba(99,102,241,0.9)';
        ctx.beginPath();
        ctx.arc(pipe.x + PIPE_W / 2, midY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', pipe.x + PIPE_W / 2, midY);
      }
    }

    // Bird
    ctx.save();
    ctx.translate(BIRD_X, bird.y);
    ctx.rotate(Math.min(Math.max(bird.angle, -0.6), 0.8));
    
    // Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = birdColor;
    
    // Body
    ctx.fillStyle = birdColor;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
    ctx.fill();

    // Inner shine
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-5, -6, BIRD_R * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(9, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wings - animated
    const wingY = Math.sin(frameRef.current * 0.3) * 6;
    ctx.fillStyle = adjustColor(birdColor, -30);
    ctx.beginPath();
    ctx.ellipse(-6, wingY, 12, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.fillText(String(scoreRef.current), W / 2, 18);
    ctx.shadowBlur = 0;

    // Progress dots (topics)
    if (config?.topics) {
      const total = config.topics.length;
      const dotW = 14;
      const totalW = total * (dotW + 6) - 6;
      const startX = W / 2 - totalW / 2;
      for (let i = 0; i < total; i++) {
        const done = completedTopics.includes(config.topics[i].title);
        ctx.beginPath();
        ctx.arc(startX + i * (dotW + 6), 65, dotW / 2, 0, Math.PI * 2);
        ctx.fillStyle = done ? '#34d399' : 'rgba(255,255,255,0.25)';
        ctx.fill();
      }
    }

    // Idle overlay
    if (st === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(config ? config.questTitle : 'GEMYTE Flappy', W / 2, H / 2 - 50);
      ctx.font = '18px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Press SPACE or tap to start', W / 2, H / 2 + 10);
      if (config) {
        ctx.fillStyle = '#6366f1';
        ctx.font = '14px system-ui';
        ctx.fillText(`${config.topics.length} Knowledge Checkpoints`, W / 2, H / 2 + 45);
      }
    }

    // Dead overlay
    if (st === 'dead') {
      ctx.fillStyle = 'rgba(220,38,38,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 38px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 50);
      ctx.font = '20px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Score: ${scoreRef.current}`, W / 2, H / 2);
      ctx.font = '16px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Press SPACE to restart', W / 2, H / 2 + 46);
    }
  }, [bgColor, birdColor, pipeColor, pipeSpeed, config, completedTopics]);

  // ─── Game loop ────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const st = stateRef.current;
    const bird = birdRef.current;
    const pipes = pipesRef.current;

    if (st === 'playing') {
      frameRef.current++;

      // Bird physics
      bird.vy += GRAVITY;
      bird.y += bird.vy;
      bird.angle = bird.vy * 0.06;

      // Spawn pipes
      if (frameRef.current % PIPE_INTERVAL === 20) {
        const gap = config?.difficulty === 'Hard' ? 160 : config?.difficulty === 'Medium' ? 185 : 210;
        const topH = 80 + Math.random() * (H - 60 - gap - 100);
        const topicCount = config?.topics.length ?? 0;
        const isQuiz = topicCount > 0 && totalAnswered.current < topicCount && Math.random() < 0.45;
        const topicIdx = totalAnswered.current;
        pipes.push({ x: W + 10, topH, gap, passed: false, isQuizPipe: isQuiz, topicIndex: topicIdx });
      }

      // Move pipes & detect scoring
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        if (!pipes[i].passed && pipes[i].x + PIPE_W < BIRD_X) {
          pipes[i].passed = true;
          scoreRef.current++;
          setScore(scoreRef.current);
        }
        if (pipes[i].x + PIPE_W < -20) pipes.splice(i, 1);
      }

      // Collision detection
      const bx = BIRD_X, by = bird.y;
      if (by + BIRD_R >= H - 60 || by - BIRD_R <= 0) {
        stateRef.current = 'dead';
        setDisplayState('dead');
      }
      for (const pipe of pipes) {
        if (bx + BIRD_R > pipe.x + 4 && bx - BIRD_R < pipe.x + PIPE_W - 4) {
          // In X range — check Y
          if (by - BIRD_R < pipe.topH || by + BIRD_R > pipe.topH + pipe.gap) {
            stateRef.current = 'dead';
            setDisplayState('dead');
          }
          // Quiz trigger — bird in the gap of a quiz pipe
          if (pipe.isQuizPipe && !pipe.passed &&
              by - BIRD_R >= pipe.topH && by + BIRD_R <= pipe.topH + pipe.gap) {
            const topics = config?.topics ?? [];
            if (topics[pipe.topicIndex]) {
              stateRef.current = 'paused';
              setDisplayState('paused');
              setQuizTopic(topics[pipe.topicIndex]);
              setQuizFeedback(null);
              setQuizAnswer('');
            }
          }
        }
      }
    }

    draw(ctx);
    animRef.current = requestAnimationFrame(loop);
  }, [draw, config, pipeSpeed]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [loop]);

  // ─── Input handler ────────────────────────────────────────────────────────
  const flap = useCallback(() => {
    const st = stateRef.current;
    if (st === 'idle') {
      stateRef.current = 'playing';
      setDisplayState('playing');
      birdRef.current = { y: H / 2, vy: JUMP_VY, angle: -0.4 };
      pipesRef.current = [];
      frameRef.current = 0;
      scoreRef.current = 0;
      setScore(0);
      totalAnswered.current = 0;
    } else if (st === 'playing') {
      birdRef.current.vy = JUMP_VY;
      birdRef.current.angle = -0.4;
    } else if (st === 'dead') {
      stateRef.current = 'idle';
      setDisplayState('idle');
      setCompletedTopics([]);
      setXpEarned(0);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  // ─── Quiz Submit ──────────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!quizTopic || !quizAnswer.trim()) return;
    setQuizLoading(true);
    try {
      const res = await fetch('/api/validate-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: quizAnswer, question: quizTopic.question, orbTitle: quizTopic.title }),
      });
      const data = await res.json();
      const ev = data.evaluation;
      if (ev) {
        setQuizFeedback({ text: ev.feedback, correct: ev.correct });
        if (ev.correct) {
          setCompletedTopics(prev => [...prev, quizTopic.title]);
          setXpEarned(prev => prev + (config?.xpReward ?? 50));
          totalAnswered.current++;
          setTimeout(() => {
            setQuizTopic(null);
            stateRef.current = 'playing';
            setDisplayState('playing');
            birdRef.current.vy = JUMP_VY; // Give a little lift when resuming
          }, 2000);
        }
      }
    } catch {
      setQuizFeedback({ text: "Couldn't reach the server. Try again!", correct: false });
    } finally {
      setQuizLoading(false);
    }
  };

  const skipQuiz = () => {
    setQuizTopic(null);
    stateRef.current = 'playing';
    setDisplayState('playing');
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center relative"
      style={{ background: '#010714' }}
    >
      {/* Nav bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-20">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to GEMYTE
        </Link>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          {config && (
            <span className="px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              {config.questTitle}
            </span>
          )}
          {xpEarned > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              +{xpEarned} XP earned
            </span>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative mt-14">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-2xl shadow-2xl border border-white/10 cursor-pointer"
          style={{ maxHeight: 'calc(100vh - 120px)', aspectRatio: `${W}/${H}`, objectFit: 'contain' }}
          onClick={displayState !== 'paused' ? flap : undefined}
        />

        {/* Not configured warning */}
        {!config && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/70 text-white text-center px-6 pointer-events-none">
            <p className="text-lg font-bold mb-2">No syllabus loaded yet!</p>
            <p className="text-sm text-slate-400">Go back to GEMYTE and generate a Knowledge Orb first.</p>
          </div>
        )}

        {/* Quiz Overlay */}
        {displayState === 'paused' && quizTopic && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur-sm px-6">
            <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Knowledge Checkpoint</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{quizTopic.title}</h3>
              <p className="text-slate-300 text-sm mb-4">{quizTopic.question}</p>

              {quizFeedback ? (
                <div className={`rounded-lg p-3 text-sm mb-3 ${quizFeedback.correct ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30' : 'bg-red-900/50 text-red-300 border border-red-500/30'}`}>
                  {quizFeedback.text}
                  {quizFeedback.correct && <p className="mt-1 font-semibold">✓ Resuming game…</p>}
                </div>
              ) : (
                <>
                  <textarea
                    value={quizAnswer}
                    onChange={e => setQuizAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                    autoFocus
                    className="w-full bg-black/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-indigo-400 mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitAnswer}
                      disabled={quizLoading || !quizAnswer.trim()}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Answer'}
                    </button>
                    <button
                      onClick={skipQuiz}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      {displayState === 'playing' && (
        <p className="mt-3 text-slate-600 text-xs">SPACE / ↑ or tap to flap &nbsp;·&nbsp; Fly through the ? gates to answer questions</p>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number[]) {
  const [tr, br, bl, tl] = r.length === 4 ? r : [r[0], r[0], r[0], r[0]];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
  ctx.fill();
}

function adjustColor(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch { return hex; }
}
