'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 480;
const H = 640;
const BIRD_X = 90;
const BIRD_R = 18;
const PIPE_W = 60;
const GRAVITY = 0.5;
const JUMP_VY = -10;
const PIPE_INTERVAL = 200;

// ─── Types ────────────────────────────────────────────────────────────────────
interface GameConfig {
  questTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
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
  topicIdx: number;
}

const DEFAULT_CONFIG: GameConfig = {
  questTitle: 'GEMYTE Demo',
  difficulty: 'Easy',
  bgColor: '#020c1b',
  pipeColor: '#0f4c81',
  birdColor: '#38bdf8',
  topics: [
    { title: 'Demo Checkpoint', question: 'What does GEMYTE stand for? (just type anything to continue)' },
  ],
  xpReward: 50,
};

type GameState = 'idle' | 'playing' | 'paused' | 'dead';

// ─── Component ────────────────────────────────────────────────────────────────
export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<GameState>('idle');
  const birdYRef = useRef(H / 2);
  const birdVYRef = useRef(0);
  const birdAngleRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const answeredRef = useRef(0);
  const configRef = useRef<GameConfig>(DEFAULT_CONFIG);

  const [state, setState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [quizTopic, setQuizTopic] = useState<{ title: string; question: string } | null>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [livesLeft, setLivesLeft] = useState(3);

  // Load config from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gemyte_game_config');
      if (raw) {
        const parsed: GameConfig = JSON.parse(raw);
        setConfig(parsed);
        configRef.current = parsed;
      }
    } catch {}
  }, []);

  const speedFor = (diff: string) => diff === 'Hard' ? 4.5 : diff === 'Medium' ? 3.5 : 3.0;
  const gapFor = (diff: string) => diff === 'Hard' ? 155 : diff === 'Medium' ? 180 : 210;

  // ─── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = configRef.current;
    const pipes = pipesRef.current;
    const frame = frameRef.current;
    const birdY = birdYRef.current;
    const birdAngle = birdAngleRef.current;
    const st = stateRef.current;
    const speed = speedFor(cfg.difficulty);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, cfg.bgColor);
    grad.addColorStop(1, '#000510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars (deterministic pseudo-random pattern)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 173 + frame * 0.15) % W;
      const sy = (i * 113) % (H - 80);
      const sr = i % 5 === 0 ? 1.5 : 0.7;
      ctx.globalAlpha = 0.3 + (i % 4) * 0.15;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Scrolling ground
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, H - 70, W, 4);
    // Ground grid lines
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    const offset = (frame * speed) % 50;
    for (let gx = -offset; gx < W; gx += 50) {
      ctx.beginPath(); ctx.moveTo(gx, H - 66); ctx.lineTo(gx, H); ctx.stroke();
    }

    // Pipes
    for (const pipe of pipes) {
      const isQ = pipe.isQuizPipe;
      const pColor = isQ ? '#4f46e5' : cfg.pipeColor;
      const capColor = isQ ? '#6366f1' : lighten(cfg.pipeColor, 30);

      // Top pipe body
      ctx.fillStyle = pColor;
      ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH - 22);
      // Top pipe cap
      ctx.fillStyle = capColor;
      ctx.fillRect(pipe.x - 8, pipe.topH - 22, PIPE_W + 16, 22);

      // Bottom pipe cap
      const botY = pipe.topH + pipe.gap;
      ctx.fillStyle = capColor;
      ctx.fillRect(pipe.x - 8, botY, PIPE_W + 16, 22);
      // Bottom pipe body
      ctx.fillStyle = pColor;
      ctx.fillRect(pipe.x, botY + 22, PIPE_W, H - botY - 22 - 70);

      // Highlight stripe on pipes
      ctx.fillStyle = `rgba(255,255,255,0.06)`;
      ctx.fillRect(pipe.x + 8, 0, 10, pipe.topH - 22);
      ctx.fillRect(pipe.x + 8, botY + 22, 10, H - botY - 22 - 70);

      // Quiz gate: dashed border + ? node
      if (isQ) {
        ctx.save();
        ctx.setLineDash([8, 5]);
        ctx.strokeStyle = 'rgba(99,102,241,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x - 2, pipe.topH + 2, PIPE_W + 4, pipe.gap - 4);
        ctx.setLineDash([]);

        // ? circle
        const midY = pipe.topH + pipe.gap / 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#6366f1';
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(pipe.x + PIPE_W / 2, midY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', pipe.x + PIPE_W / 2, midY);
        ctx.restore();
      }
    }

    // Bird
    ctx.save();
    ctx.translate(BIRD_X, birdY);
    ctx.rotate(Math.min(Math.max(birdAngle, -0.5), 1.0));

    // Glow halo
    ctx.shadowBlur = 24;
    ctx.shadowColor = cfg.birdColor;
    ctx.fillStyle = cfg.birdColor;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(-5, -6, BIRD_R * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0a0f1e';
    ctx.beginPath(); ctx.arc(8, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(9, -5.5, 2.2, 0, Math.PI * 2); ctx.fill();

    // Wing
    const wFlap = Math.sin(frame * 0.35) * 7;
    ctx.fillStyle = darken(cfg.birdColor, 25);
    ctx.beginPath();
    ctx.ellipse(-7, wFlap, 13, 7, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HUD - Score
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 40px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.fillText(String(scoreRef.current), W / 2, 14);
    ctx.shadowBlur = 0;

    // Topic progress dots
    const topics = cfg.topics;
    if (topics.length > 0) {
      const dotR = 6;
      const spacing = 20;
      const totalW = topics.length * spacing - (spacing - dotR * 2);
      let dx = W / 2 - totalW / 2 + dotR;
      ctx.textBaseline = 'alphabetic';
      for (let i = 0; i < topics.length; i++) {
        ctx.beginPath();
        ctx.arc(dx + i * spacing, 68, dotR, 0, Math.PI * 2);
        // done = green, current = glowing, future = dim
        if (i < answeredRef.current) {
          ctx.fillStyle = '#34d399';
        } else if (i === answeredRef.current) {
          ctx.fillStyle = '#6366f1';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
        }
        ctx.fill();
      }
    }

    // Idle overlay
    if (st === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);

      // Title card
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      roundRect2(ctx, W / 2 - 180, H / 2 - 120, 360, 200, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.questTitle, W / 2, H / 2 - 60);
      ctx.font = '15px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Tap or press SPACE to fly', W / 2, H / 2 - 20);
      if (topics.length) {
        ctx.font = '13px system-ui';
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`${topics.length} knowledge checkpoint${topics.length > 1 ? 's' : ''}`, W / 2, H / 2 + 18);
      }
      ctx.font = '12px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText('W / ↑ / SPACE = Flap', W / 2, H / 2 + 52);
    }

    // Dead overlay
    if (st === 'dead') {
      ctx.fillStyle = 'rgba(185,28,28,0.5)';
      ctx.fillRect(0, 0, W, H);

      roundRect2(ctx, W / 2 - 160, H / 2 - 100, 320, 180, 16);
      ctx.fillStyle = 'rgba(15,23,42,0.9)';
      ctx.fillRect(W / 2 - 160, H / 2 - 100, 320, 180);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.font = '20px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Score: ${scoreRef.current}`, W / 2, H / 2 + 4);
      ctx.font = '14px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('Tap or SPACE to play again', W / 2, H / 2 + 44);
    }
  }, [config]);

  // ─── Game Loop ────────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const cfg = configRef.current;
    const speed = speedFor(cfg.difficulty);
    const gap = gapFor(cfg.difficulty);

    if (stateRef.current === 'playing') {
      frameRef.current++;

      // Physics
      birdVYRef.current += GRAVITY;
      birdYRef.current += birdVYRef.current;
      birdAngleRef.current = birdVYRef.current * 0.055;

      // Spawn pipes
      if (frameRef.current % PIPE_INTERVAL === 1) {
        const topH = 80 + Math.random() * (H - 80 - 70 - gap - 40);
        const totalTopics = cfg.topics.length;
        const isQ = totalTopics > 0 && answeredRef.current < totalTopics && Math.random() < 0.5;
        pipesRef.current.push({
          x: W + PIPE_W,
          topH,
          gap,
          passed: false,
          isQuizPipe: isQ,
          topicIdx: answeredRef.current,
        });
      }

      // Scroll pipes
      for (let i = pipesRef.current.length - 1; i >= 0; i--) {
        const p = pipesRef.current[i];
        p.x -= speed;
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
          p.passed = true;
          scoreRef.current++;
          setScore(scoreRef.current);
        }
        if (p.x + PIPE_W < -20) pipesRef.current.splice(i, 1);
      }

      // Collision - floor/ceiling
      if (birdYRef.current + BIRD_R >= H - 70 || birdYRef.current - BIRD_R <= 0) {
        stateRef.current = 'dead';
        setState('dead');
      }

      // Collision - pipes & quiz
      const bx = BIRD_X, by = birdYRef.current;
      for (const pipe of pipesRef.current) {
        const inX = bx + BIRD_R > pipe.x + 6 && bx - BIRD_R < pipe.x + PIPE_W - 6;
        if (!inX) continue;

        const inGap = by - BIRD_R >= pipe.topH && by + BIRD_R <= pipe.topH + pipe.gap;

        if (!inGap) {
          stateRef.current = 'dead';
          setState('dead');
          break;
        }

        // Quiz trigger — inside the gap of a quiz pipe
        if (pipe.isQuizPipe && !pipe.passed && inGap) {
          const topics = cfg.topics;
          const topic = topics[pipe.topicIdx];
          if (topic && stateRef.current === 'playing') {
            stateRef.current = 'paused';
            setState('paused');
            setQuizTopic(topic);
            setQuizFeedback(null);
            setQuizAnswer('');
          }
        }
      }
    }

    draw();
    animRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameLoop]);

  // ─── Scale canvas to container ────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const maxH = window.innerHeight - 120;
      const scale = Math.min(1, maxH / H, container.clientWidth / W);
      canvas.style.width = `${W * scale}px`;
      canvas.style.height = `${H * scale}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ─── Input ────────────────────────────────────────────────────────────────
  const flap = useCallback(() => {
    if (stateRef.current === 'paused') return; // ignore flap during quiz
    if (stateRef.current === 'idle') {
      pipesRef.current = [];
      frameRef.current = 0;
      scoreRef.current = 0;
      answeredRef.current = 0;
      birdYRef.current = H / 2;
      birdVYRef.current = JUMP_VY;
      birdAngleRef.current = -0.4;
      stateRef.current = 'playing';
      setState('playing');
      setScore(0);
      setCompletedTopics([]);
      setXpEarned(0);
      setLivesLeft(3);
    } else if (stateRef.current === 'playing') {
      birdVYRef.current = JUMP_VY;
      birdAngleRef.current = -0.4;
    } else if (stateRef.current === 'dead') {
      stateRef.current = 'idle';
      setState('idle');
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  // ─── Quiz answer ──────────────────────────────────────────────────────────
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
          setCompletedTopics(t => [...t, quizTopic.title]);
          setXpEarned(x => x + (configRef.current.xpReward ?? 50));
          answeredRef.current++;
          setTimeout(() => {
            setQuizTopic(null);
            birdVYRef.current = JUMP_VY;
            stateRef.current = 'playing';
            setState('playing');
          }, 1800);
        }
      }
    } catch {
      setQuizFeedback({ text: "Network error — try again.", correct: false });
    }
    setQuizLoading(false);
  };

  const skipQuiz = () => {
    setQuizTopic(null);
    answeredRef.current++;
    birdVYRef.current = JUMP_VY;
    stateRef.current = 'playing';
    setState('playing');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-[#010714]">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-4 py-3 z-20 flex-shrink-0"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-700">
            {config.questTitle}
          </span>
          {xpEarned > 0 && (
            <span className="text-emerald-400 text-xs px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 font-semibold">
              +{xpEarned} XP
            </span>
          )}
        </div>
      </div>

      {/* Canvas wrapper */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center w-full px-2 py-2">
        <div className="relative" style={{ lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={state !== 'paused' ? flap : undefined}
            className="rounded-2xl shadow-2xl cursor-pointer block"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />

          {/* Quiz overlay — HTML on top of canvas */}
          {state === 'paused' && quizTopic && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
                 style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}>
              <div className="w-80 bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl"
                   onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse inline-block" />
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
                    Knowledge Checkpoint
                  </span>
                </div>
                <h3 className="text-white font-bold text-base mb-1">{quizTopic.title}</h3>
                <p className="text-slate-300 text-sm mb-3 leading-relaxed">{quizTopic.question}</p>

                {quizFeedback ? (
                  <div className={`rounded-xl p-3 text-sm ${quizFeedback.correct
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-900/40 text-red-300 border border-red-500/30'}`}>
                    {quizFeedback.text}
                    {quizFeedback.correct && <p className="mt-1 font-semibold text-emerald-400">✓ Resuming…</p>}
                  </div>
                ) : (
                  <>
                    <textarea
                      value={quizAnswer}
                      onChange={e => setQuizAnswer(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); }}}
                      placeholder="Type your answer…"
                      rows={3}
                      autoFocus
                      className="w-full bg-black/50 border border-slate-600/60 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-indigo-500 mb-3 placeholder-slate-600"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={submitAnswer}
                        disabled={quizLoading || !quizAnswer.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                        {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '⚡ Submit'}
                      </button>
                      <button
                        onClick={skipQuiz}
                        className="px-4 bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-all">
                        Skip
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="py-2 text-center">
        <p className="text-slate-700 text-xs">
          {state === 'idle'
            ? 'Tap the game OR press SPACE to start flying'
            : state === 'playing'
            ? 'SPACE / W / ↑ to flap  ·  Purple gates = knowledge quiz'
            : state === 'dead'
            ? 'Tap or SPACE to play again'
            : ''}
        </p>
      </div>
    </div>
  );
}

// ─── Canvas Helpers ───────────────────────────────────────────────────────────
function roundRect2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function lighten(hex: string, amount: number): string {
  return adjustHex(hex, amount);
}
function darken(hex: string, amount: number): string {
  return adjustHex(hex, -amount);
}
function adjustHex(hex: string, amount: number): string {
  try {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch { return hex; }
}
