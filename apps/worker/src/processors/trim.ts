import type { Job } from '@clipforge/shared';
import type { TrimPayload } from '@clipforge/shared';
import { downloadFile, cleanup } from '../lib/ffmpeg';
import { uploadToR2 } from '../lib/r2';
import { updateJobProgress } from '../lib/db';
import ffmpeg from 'fluent-ffmpeg';

export async function processTrim(job: Job): Promise<string> {
  const payload = job.payload as unknown as TrimPayload;
  const inputPath = `/tmp/clipforge-${job.id}-input.mp4`;
  const outputPath = `/tmp/clipforge-${job.id}-output.mp4`;

  await downloadFile(payload.video_url, inputPath);
  await updateJobProgress(job.id, 20);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(payload.start)
      .setDuration(payload.end - payload.start)
      .outputOptions(['-c', 'copy'])
      .on('progress', (p) => {
        if (p.percent) updateJobProgress(job.id, 20 + Math.round(p.percent * 0.6));
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
