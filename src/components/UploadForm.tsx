'use client';

import { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !url) return;

    setIsUploading(true);
    setMessage('');

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (url) formData.append('url', url);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Success: ${data.message}`);
        setFile(null);
        setUrl('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl w-full max-w-md">
      <h3 className="text-xl font-bold text-white mb-4">Ingestion Engine</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        
        {/* PDF Dropzone */}
        <div className="border-2 border-dashed border-blue-400/50 rounded-xl p-8 text-center hover:bg-blue-500/10 transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept="application/pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="flex flex-col items-center justify-center space-y-2 text-blue-200">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">
              {file ? file.name : "Drop Cambridge/IB PDF here"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="h-px bg-white/20 flex-1"></div>
          <span className="text-xs text-white/50 uppercase tracking-wider">OR</span>
          <div className="h-px bg-white/20 flex-1"></div>
        </div>

        {/* URL Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-5 w-5 text-blue-300/50" />
          </div>
          <input
            type="url"
            placeholder="Paste syllabus link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || (!file && !url)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Knowledge Orb'}
        </button>

        {message && (
          <div className="text-sm text-center mt-2 p-2 rounded bg-black/20 text-blue-200">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
