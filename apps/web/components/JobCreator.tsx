'use client';

import { useState } from 'react';

interface Segment {
  text: string;
  size: number;
  style: 'primary' | 'accent';
  delay: number;
  duration: number;
  position: 'left' | 'center' | 'right';
}

const defaultSegment: Segment = {
  text: 'SAMPLE TEXT',
  size: 72,
  style: 'primary',
  delay: 0,
  duration: 3,
  position: 'center',
};

export default function JobCreator() {
  const [videoUrl, setVideoUrl] = useState('');
  const [segments, setSegments] = useState<Segment[]>([{ ...defaultSegment }]);
  const [primaryColor, setPrimaryColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#c8b88a');
  const [opacity, setOpacity] = useState(0.4);
  const [font, setFont] = useState<'bebas' | 'montserrat' | 'impact'>('bebas');
  const [resolution, setResolution] = useState<'1080x1920' | '1920x1080' | '1080x1080'>('1080x1920');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const addSegment = () => setSegments([...segments, { ...defaultSegment, delay: segments.length * 2 }]);
  const removeSegment = (i: number) => setSegments(segments.filter((_, idx) => idx !== i));
  const updateSegment = (i: number, field: keyof Segment, value: string | number) => {
    const updated = [...segments];
    (updated[i] as unknown as Record<string, unknown>)[field] = value;
    setSegments(updated);
  };

  const submit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clipforge-key': process.env.NEXT_PUBLIC_CLIPFORGE_API_KEY || '',
        },
        body: JSON.stringify({
          type: 'text_overlay',
          payload: {
            video_url: videoUrl,
            segments,
            primary_color: primaryColor,
            accent_color: accentColor,
            overlay_opacity: opacity,
            font,
            output_format: 'mp4',
            resolution,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Job created: ${data.id}`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setResult(`Network error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-white/40 mb-1">Video URL</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://example.com/video.mp4"
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">Font</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value as typeof font)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
          >
            <option value="bebas">Bebas Neue</option>
            <option value="montserrat">Montserrat</option>
            <option value="impact">Impact</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Resolution</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as typeof resolution)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
          >
            <option value="1080x1920">1080x1920 (9:16)</option>
            <option value="1920x1080">1920x1080 (16:9)</option>
            <option value="1080x1080">1080x1080 (1:1)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Overlay Opacity: {opacity}</label>
          <input
            type="range"
            min="0"
            max="0.85"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">Primary Color</label>
          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Accent Color</label>
          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-8" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/40">Segments</label>
          <button onClick={addSegment} className="text-xs text-blue-400 hover:text-blue-300">+ Add Segment</button>
        </div>
        {segments.map((seg, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-end">
            <input
              value={seg.text}
              onChange={(e) => updateSegment(i, 'text', e.target.value)}
              placeholder="Text"
              className="col-span-2 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none"
            />
            <input
              type="number"
              value={seg.size}
              onChange={(e) => updateSegment(i, 'size', parseInt(e.target.value))}
              placeholder="Size"
              className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none"
            />
            <input
              type="number"
              value={seg.delay}
              onChange={(e) => updateSegment(i, 'delay', parseFloat(e.target.value))}
              placeholder="Delay"
              className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none"
            />
            <input
              type="number"
              value={seg.duration}
              onChange={(e) => updateSegment(i, 'duration', parseFloat(e.target.value))}
              placeholder="Duration"
              className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none"
            />
            <button
              onClick={() => removeSegment(i)}
              className="text-red-400/60 hover:text-red-400 text-xs py-1.5"
              disabled={segments.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={submitting || !videoUrl}
        className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded px-4 py-2.5 text-sm font-medium transition"
      >
        {submitting ? 'Submitting...' : 'Submit Text Overlay Job'}
      </button>

      {result && (
        <p className={`text-xs ${result.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {result}
        </p>
      )}
    </div>
  );
}
