'use client';

import { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadFormProps {
  onClose?: () => void;
}

export default function UploadForm({ onClose }: UploadFormProps) {
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

  return (
    <div className="glass rounded-3xl p-6 w-80 shadow-2xl" style={{ boxShadow: '0 0 40px rgba(56,189,248,0.1)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Ingestion Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">Upload a syllabus to generate an orb</p>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleUpload} className="space-y-3">
        {/* Drop Zone */}
        <label className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-8"
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
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {file ? file.name : 'Drop PDF here'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Cambridge · IB · AP syllabi</p>
          </div>
        </label>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">or</span>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* URL Input */}
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="url"
            placeholder="Paste syllabus link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading || (!file && !url)}
          className="w-full font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: 'white',
            boxShadow: '0 0 20px rgba(56,189,248,0.2)',
          }}>
          {isUploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            'Generate Knowledge Orb ✦'
          )}
        </button>

        {/* Status message */}
        {message && (
          <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${status === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
            style={{ background: status === 'success' ? 'rgba(52,211,153,0.08)' : 'rgba(252,165,165,0.08)' }}>
            {status === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
