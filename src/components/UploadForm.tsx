'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Loader2, X, CheckCircle2, AlertCircle, Type } from 'lucide-react';

interface UploadFormProps {
  onClose?: () => void;
  mobile?: boolean;
  engine?: ReturnType<typeof import("@/hooks/useGemyteEngine").useGemyteEngine>;
}

type TabType = 'file' | 'link' | 'prompt';

export default function UploadForm({ onClose, mobile = false, engine }: UploadFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [promptText, setPromptText] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'file' && !file) return;
    if (tab === 'link' && !url) return;
    if (tab === 'prompt' && !promptText) return;

    setIsUploading(true);
    setStatus('idle');
    setMessage('');

    const formData = new FormData();
    if (tab === 'file' && file) formData.append('file', file);
    if (tab === 'link' && url) formData.append('url', url);
    if (tab === 'prompt' && promptText) formData.append('prompt', promptText);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setFile(null);
        setUrl('');
        setPromptText('');
        
        if (engine && data.textContent) {
          setMessage('Analyzing content…');
          engine.generateLevel(data.textContent).then((config: any) => {
            if (config) {
              localStorage.setItem('gemyte_game_config', JSON.stringify(config));
              setMessage('Level ready! Launching 3D World…');
              setTimeout(() => router.push('/game'), 800);
            } else {
              setMessage('Engine failed to build level. Please try again.');
              setStatus('error');
            }
          }).catch((err: any) => {
            console.error('Engine failure:', err);
            setMessage('Analyzed. Could not build level.');
            setStatus('error');
          });
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Ingestion failed');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const panelClass = mobile
    ? 'w-full rounded-t-3xl border-t border-x border-white/10 p-5 pb-8'
    : 'w-[360px] rounded-3xl border border-white/10 p-6 shadow-2xl';

  return (
    <div
      className={`${panelClass}`}
      style={{
        background: 'rgba(3,7,18,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: mobile ? 'none' : '0 0 40px rgba(56,189,248,0.1)',
      }}>

      {/* Drag handle (mobile only) */}
      {mobile && (
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Ingestion Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">Build a physics world from any content.</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-xl p-1 mb-5">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === 'file' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <Upload className="w-3.5 h-3.5" /> File
        </button>
        <button
          type="button"
          onClick={() => setTab('link')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === 'link' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <LinkIcon className="w-3.5 h-3.5" /> Link
        </button>
        <button
          type="button"
          onClick={() => setTab('prompt')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === 'prompt' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <Type className="w-3.5 h-3.5" /> Prompt
        </button>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        
        {/* Render Form Inputs Based on Tab */}
        {tab === 'file' && (
          <label className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-6"
            style={{
              borderColor: file ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)',
              background: file ? 'rgba(56,189,248,0.05)' : 'rgba(255,255,255,0.02)',
            }}>
            <input
              type="file"
              accept="application/pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(56,189,248,0.1)' }}>
              <Upload className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-white truncate max-w-[200px]">
                {file ? file.name : 'Tap or drop PDF here'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Max 10MB</p>
            </div>
          </label>
        )}

        {tab === 'link' && (
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="url"
              placeholder="Paste a Wikipedia or article URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        )}

        {tab === 'prompt' && (
          <textarea
            placeholder="Type any learning topic, physics concept, or historical event to generate a world..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none h-28"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || (tab === 'file' && !file) || (tab === 'link' && !url) || (tab === 'prompt' && !promptText)}
          className="w-full font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: 'white',
            boxShadow: '0 0 20px rgba(56,189,248,0.2)',
            minHeight: '48px', // touch-friendly
          }}>
          {isUploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Igniting Engine…</>
            : 'Generate Knowledge Orb ✦'}
        </button>

        {/* Status Messages */}
        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-xl text-xs ${status === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
            style={{ background: status === 'success' ? 'rgba(52,211,153,0.08)' : 'rgba(252,165,165,0.08)' }}>
            {status === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
