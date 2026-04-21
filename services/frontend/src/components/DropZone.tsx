'use client';

import { useCallback, useState } from 'react';
// We import FileRejection to satisfy TypeScript
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, ImagePlus, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
}

const ACCEPTED_TYPES = { 
  'image/jpeg': ['.jpg', '.jpeg'], 
  'image/png': ['.png'], 
  'image/webp': ['.webp'] 
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function DropZone({ onUpload, uploading }: DropZoneProps) {
  const [rejected, setRejected] = useState<string[]>([]); 

  const onDrop = useCallback(
    (accepted: File[], fileRejections: FileRejection[]) => {
      setRejected([]);
      
      if (fileRejections.length > 0) {
        // Now TypeScript is happy because we are using the library's own type
        setRejected(fileRejections.map((r) => `${r.file.name}: ${r.errors[0]?.message}`));
      }
      
      if (accepted.length > 0) {
        onUpload(accepted);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 5,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
            : uploading
              ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed opacity-60'
              : 'border-slate-700 bg-slate-900/50 hover:border-indigo-500/60 hover:bg-indigo-500/5'
        }`}
      >
        <input {...getInputProps()} />

        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          isDragActive ? 'bg-indigo-500/20' : 'bg-slate-800 group-hover:bg-indigo-500/10'
        }`}>
          {isDragActive ? (
            <ImagePlus className="h-7 w-7 text-indigo-400" />
          ) : (
            <Upload className="h-7 w-7 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          )}
        </div>

        {isDragActive ? (
          <p className="text-base font-semibold text-indigo-400">Drop images here</p>
        ) : (
          <>
            <p className="text-base font-semibold text-slate-200">
              Drag & drop images here
            </p>
            <p className="mt-1.5 text-sm text-slate-400">
              or <span className="text-indigo-400 group-hover:text-indigo-300 transition">browse files</span>
            </p>
          </>
        )}

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
          <span>JPG, PNG, WEBP</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Max 10 MB</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Up to 5 files</span>
        </div>
      </div>

      {rejected.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 space-y-1">
          {rejected.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}