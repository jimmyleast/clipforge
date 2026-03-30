import type { Job } from '@clipforge/shared';
import type { CaptionBurnPayload } from '@clipforge/shared';
import { downloadFile, writeTempFile, cleanup } from '../lib/ffmpeg';
import { uploadToR2 } from '../lib/r2';
import { updateJobProgress } from '../lib/db';
import ffmpeg from 'fluent-ffmpeg';

const POSITION_MAP: Record<string, number> = {
  bottom: 2,
  center: 10,
  top: 6,
};

export async function processCaptionBurn(job: Job): Promise<string> {
  const payload = job.payload as unknown as CaptionBurnPayload;
  const inputPath = `/tmp/clipforge-${job.id}-input.mp4`;
  const outputPath = `/tmp/clipforge-${job.id}-output.mp4`;

  await downloadFile(payload.video_url, inputPath);
  await updateJobProgress(job.id, 15);

  // Write SRT content to temp file
  const srtPath = await writeTempFile(job.id, 'captions.srt', payload.srt_content);
  await updateJobProgress(job.id, 20);

  const style = payload.style;
  const alignment = POSITION_MAP[style.position] ?? 2;

  // Build ASS-style subtitle filter
  const subtitleFilter =
    `subtitles='${srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')}':` +
    `force_style='FontSize=${style.font_size},` +
    `PrimaryColour=${hexToASS(style.primary_color)},` +
    `OutlineColour=${hexToASS(style.outline_color)},` +
    `Outline=2,` +
    `Alignment=${alignment}'`;

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(subtitleFilter)
      .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy'])
      .on('progress', (p) => {
        if (p.percent) updateJobProgress(job.id, 20 + Math.round(p.percent * 0.7));
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });

  await updateJobProgress(job.id, 90);

  const cdnUrl = await uploadToR2(
    outputPath,
    `renders/${job.id}/output.mp4`,
    'video/mp4',
  );

  return cdnUrl;
}

function hexToASS(hex: string): string {
  // Convert #RRGGBB to &HBBGGRR& (ASS format)
  const r = hex.slice(1, 3);
  const g = hex.slice(3, 5);
  const b = hex.slice(5, 7);
  return `&H${b}${g}${r}&`;
}
