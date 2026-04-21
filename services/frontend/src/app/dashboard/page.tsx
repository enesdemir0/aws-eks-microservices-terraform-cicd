'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import DropZone from '@/components/DropZone';
import GalleryGrid from '@/components/GalleryGrid';
import { auth, gateway } from '@/lib/api';
import type { Caption, PendingUpload, User } from '@/lib/types';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    auth.me().then((r) => setUser(r.data.user)).catch(() => {});
    return () => previewUrls.current.forEach(URL.revokeObjectURL);
  }, []);

  const handleUpload = useCallback(async (files: File[]) => {
    setUploadError('');
    setUploading(true);

    const newPending: PendingUpload[] = files.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.push(preview);
      return {
        taskId: crypto.randomUUID(),
        filename: file.name,
        imagePath: '',
        status: 'uploading',
        preview,
        uploadedAt: Date.now(),
      };
    });

    setPendingUploads((prev) => [...newPending, ...prev]);

    const results = await Promise.allSettled(
      files.map(async (file, i) => {
        const response = await gateway.upload(file);
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.taskId === newPending[i].taskId
              ? { ...p, taskId: response.task_id, imagePath: response.image_path, status: 'processing' }
              : p,
          ),
        );
        return response;
      }),
    );

    const errors = results.filter((r) => r.status === 'rejected');
    if (errors.length > 0) {
      const msg = (errors[0] as PromiseRejectedResult).reason?.message ?? 'Upload failed';
      setUploadError(msg);
      // Mark failed uploads as error
      setPendingUploads((prev) =>
        prev.map((p, idx) =>
          results[idx]?.status === 'rejected' ? { ...p, status: 'error' } : p,
        ),
      );
    }

    setUploading(false);
  }, []);

  const handlePendingResolved = useCallback((taskId: string, _caption: Caption) => {
    setPendingUploads((prev) => prev.filter((p) => p.taskId !== taskId));
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          AI Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Upload images and our AI will generate descriptive captions in seconds.
        </p>
      </div>

      {/* Upload Zone */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Upload
        </h2>
        <DropZone onUpload={handleUpload} uploading={uploading} />
        {uploadError && (
          <p className="mt-2 text-sm text-red-400">{uploadError}</p>
        )}
      </section>

      {/* Gallery */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Gallery
        </h2>
        <GalleryGrid
          userId={user.id}
          pendingUploads={pendingUploads}
          onPendingResolved={handlePendingResolved}
        />
      </section>
    </div>
  );
}
