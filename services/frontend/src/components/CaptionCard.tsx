import Image from 'next/image';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import type { Caption, PendingUpload, UploadStatus } from '@/lib/types';

interface CaptionCardProps {
  item: Caption | PendingUpload;
  isPending?: boolean;
}

function StatusBadge({ status }: { status: UploadStatus | 'done' }) {
  if (status === 'done') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  }
  if (status === 'uploading') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Uploading
      </span>
    );
  }
  if (status === 'processing') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
      Error
    </span>
  );
}

function getImageSrc(imagePath: string): string {
  // Extract just the filename from a path like /app/uploads/abc123.jpg
  const filename = imagePath.split(/[/\\]/).pop() ?? imagePath;
  return `/api/images/${filename}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CaptionCard({ item, isPending = false }: CaptionCardProps) {
  const isCaption = !isPending;
  const caption = isCaption ? (item as Caption) : null;
  const pending = !isCaption ? (item as PendingUpload) : null;

  const imageSrc = caption
    ? getImageSrc(caption.image_path)
    : pending?.preview ?? '';

  const captionText = caption?.caption ?? null;
  const status: UploadStatus | 'done' = caption ? 'done' : (pending?.status ?? 'processing');
  const timestamp = caption?.created_at ?? null;
  const filename = caption
    ? caption.image_path.split(/[/\\]/).pop() ?? 'image'
    : pending?.filename ?? 'image';

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-700 animate-slide-up">
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={captionText ?? 'Uploading...'}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={pending !== null}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Clock className="h-8 w-8 text-slate-600" />
          </div>
        )}

        {/* Status overlay for pending items */}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <span className="text-xs font-medium text-slate-300">
                {status === 'uploading' ? 'Uploading…' : 'AI is captioning…'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="truncate text-xs text-slate-500" title={filename}>{filename}</p>
          <StatusBadge status={status} />
        </div>

        {captionText ? (
          <p className="flex-1 text-sm leading-relaxed text-slate-200">{captionText}</p>
        ) : (
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-slate-800" />
          </div>
        )}

        {timestamp && (
          <p className="mt-3 text-xs text-slate-500">{formatDate(timestamp)}</p>
        )}
      </div>
    </div>
  );
}
