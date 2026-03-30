'use client';

import { useEffect, useState } from 'react';
import VideoPreview from './VideoPreview';

interface Job {
  id: string;
  type: string;
  status: string;
  progress: number;
  output_url: string | null;
  error: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  queued: 'bg-amber-500/20 text-amber-400',
  processing: 'bg-blue-500/20 text-blue-400',
  complete: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function JobTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs?limit=50', {
          headers: { 'x-clipforge-key': process.env.NEXT_PUBLIC_CLIPFORGE_API_KEY || '' },
        });
        if (res.ok) setJobs(await res.json());
      } catch {}
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Progress</th>
              <th className="text-left py-3 px-4">Created</th>
              <th className="text-left py-3 px-4">Output</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-white/30">
                  No jobs yet
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 font-mono text-xs">{job.type}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[job.status] || ''}`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="w-24 bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-white/50 text-xs">{timeAgo(job.created_at)}</td>
                <td className="py-3 px-4">
                  {job.output_url ? (
                    <button
                      onClick={() => setPreviewUrl(job.output_url)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Preview
                    </button>
                  ) : job.error ? (
                    <span className="text-red-400 text-xs truncate max-w-[200px] block" title={job.error}>
                      {job.error}
                    </span>
                  ) : (
                    <span className="text-white/20 text-xs">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewUrl && (
        <VideoPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </>
  );
}
