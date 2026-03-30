import type { Job } from '@clipforge/shared';
import type { AudioDubPayload } from '@clipforge/shared';
import { downloadFile, cleanup } from '../lib/ffmpeg';
import { uploadToR2 } from '../lib/r2';
import { updateJobProgress } from '../lib/db';
import ffmpeg from 'fluent-ffmpeg';

export async function processAudioDub(job: Job): Promise<string> {
  const payload = job.payload as unknown as AudioDubPayload;
  const videoPath = `/tmp/clipforge-${job.id}-input.mp4`;
  const audioPath = `/tmp/clipforge-${job.id}-audio.mp3`;
  const outputPath = `/tmp/clipforge-${job.id}-output.mp4`;

  await Promise.all([
    downloadFile(payload.video_url, videoPath),
    downloadFile(payload.audio_url, audioPath),
  ]);
  await updateJobProgress(job.id, 20);

  if (payload.mode === 'replace') {
    // Replace original audio entirely
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'copy',
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-shortest',
        ])
        .on('progress', (p) => {
          if (p.percent) updateJobProgress(job.id, 20 + Math.round(p.percent * 0.7));
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  } else {
    // Mix: blend original audio with new audio
    const volume = payload.mix_volume;
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter([
          `[0:a]volume=${volume}[a0]`,
          `[a0][1:a]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
        ])
        .outputOptions([
          '-c:v', 'copy',
          '-map', '0:v:0',
          '-map', '[aout]',
          '-shortest',
        ])
        .on('progress', (p) => {
          if (p.percent) updateJobProgress(job.id, 20 + Math.round(p.percent * 0.7));
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  await updateJobProgress(job.id, 90);

  const cdnUrl = await uploadToR2(
    outputPath,
    `renders/${job.id}/output.mp4`,
    'video/mp4',
  );

  return cdnUrl;
}
