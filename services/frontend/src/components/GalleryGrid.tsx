'use client';

import { useEffect, useRef, useState } from 'react';
import { Images, RefreshCw } from 'lucide-react';
import CaptionCard from './CaptionCard';
import type { Caption, PendingUpload } from '@/lib/types';
import { metadata } from '@/lib/api';

interface GalleryGridProps {
  userId: number;
  pendingUploads: PendingUpload[];
  onPendingResolved: (taskId: string, caption: Caption) => void;
}

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_DURATION_MS = 3 * 60_000; // stop polling after 3 minutes

export default function GalleryGrid({ userId, pendingUploads, onPendingResolved }: GalleryGridProps) {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  const hasPending = pendingUploads.some((p) => p.status === 'processing' || p.status === 'uploading');

  async function fetchCaptions() {
    try {
      const data = await metadata.getUserCaptions(userId);
      setCaptions(data);

      // Resolve any pending uploads that now have a caption
      pendingUploads.forEach((pending) => {
        if (pending.status !== 'processing') return;
        const resolved = data.find((c) => c.task_id === pending.taskId);
        if (resolved) {
          onPendingResolved(pending.taskId, resolved);
        }
      });
    } catch {
      // Silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCaptions();
  }, [userId]);

  // Poll while there are pending uploads
  useEffect(() => {
    if (hasPending) {
      pollStartRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
          clearInterval(intervalRef.current!);
          return;
        }
        fetchCaptions();
      }, POLL_INTERVAL_MS);
    } else {
      clearInterval(intervalRef.current!);
    }

    return () => clearInterval(intervalRef.current!);
  }, [hasPending, pendingUploads]);

  // Merge: show processing items at the front, then completed captions newest-first
  const completedTaskIds = new Set(captions.map((c) => c.task_id));
  const activePending = pendingUploads.filter((p) => !completedTaskIds.has(p.taskId));
  const sortedCaptions = [...captions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const isEmpty = activePending.length === 0 && sortedCaptions.length === 0;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="aspect-video w-full animate-pulse bg-slate-800" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
          <Images className="h-6 w-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-300">No captions yet</p>
        <p className="mt-1 text-xs text-slate-500">Upload an image above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasPending && (
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Polling for results every 3 seconds…
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activePending.map((p) => (
          <CaptionCard key={p.taskId} item={p} isPending />
        ))}
        {sortedCaptions.map((c) => (
          <CaptionCard key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
}
