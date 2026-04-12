'use client';

import { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadFormProps {
  onClose?: () => void;
  mobile?: boolean;
  engine?: ReturnType<typeof import("@/hooks/useGemyteEngine").useGemyteEngine>;
}

export default function UploadForm({ onClose, mobile = false, engine }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !url) return;

    setIsUploading(true);
    setStatus('idle');
    setMessage('');

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (url) formData.append('url', url);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setFile(null);
        setUrl('');
        
        if (engine && data.textContent) {
          setMessage("Processing with AI to construct physics...");
          engine.generateLevel(data.textContent).then(() => {
             setMessage("Level Generated! Physics active.");
             engine.startQuest();
          }).catch((err: any) => {
             console.error("Engine failure:", err);
             setMessage("Orb created. Physics sync failed.");
          });
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Upload failed');
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
    : 'w-80 rounded-3xl border border-white/10 p-6 shadow-2xl';

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
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Ingestion Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">Upload a syllabus to generate an orb</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleUpload} className="space-y-3">
        {/* Drop Zone */}
        <label
          className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-6"
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
            <p className="text-xs text-slate-500 mt-0.5">Cambridge · IB · AP syllabi</p>
          </div>
        </label>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">or</span>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* URL Input */}
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="url"
            placeholder="Paste syllabus link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading || (!file && !url)}
          className="w-full font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: 'white',
            boxShadow: '0 0 20px rgba(56,189,248,0.2)',
            minHeight: '48px', // touch-friendly
          }}>
          {isUploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            : 'Generate Knowledge Orb ✦'}
        </button>

        {/* Status */}
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
