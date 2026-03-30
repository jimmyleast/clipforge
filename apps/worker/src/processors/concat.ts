import type { Job } from '@clipforge/shared';
import type { ConcatPayload } from '@clipforge/shared';
import { downloadFile, writeTempFile, cleanup } from '../lib/ffmpeg';
import { uploadToR2 } from '../lib/r2';
import { updateJobProgress } from '../lib/db';
import ffmpeg from 'fluent-ffmpeg';

export async function processConcat(job: Job): Promise<string> {
  const payload = job.payload as unknown as ConcatPayload;
  const outputPath = `/tmp/clipforge-${job.id}-output.mp4`;

  // Download all clips
  const clipPaths: string[] = [];
  for (let i = 0; i < payload.clips.length; i++) {
    const clip = payload.clips[i];
    const clipInput = `/tmp/clipforge-${job.id}-clip-${i}-input.mp4`;
    const clipOutput = `/tmp/clipforge-${job.id}-clip-${i}.mp4`;

    await downloadFile(clip.url, clipInput);

    // Trim clip if start/end specified
    if (clip.start !== undefined || clip.end !== undefined) {
      await new Promise<void>((resolve, reject) => {
        let cmd = ffmpeg(clipInput);
        if (clip.start !== undefined) cmd = cmd.setStartTime(clip.start);
        if (clip.end !== undefined && clip.start !== undefined) {
          cmd = cmd.setDuration(clip.end - clip.start);
        }
        cmd
          .outputOptions(['-c', 'copy'])
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(clipOutput);
      });
      clipPaths.push(clipOutput);
    } else {
      clipPaths.push(clipInput);
    }

    await updateJobProgress(job.id, Math.round(((i + 1) / payload.clips.length) * 40));
  }

  // Build concat file list
  const fileList = clipPaths.map((p) => `file '${p}'`).join('\n');
  const listPath = await writeTempFile(job.id, 'concat.txt', fileList);

  await updateJobProgress(job.id, 50);

  // Concatenate
  if (payload.transition === 'fade' && payload.transition_duration > 0) {
    // Use xfade filter for fade transitions between clips
    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg();
      clipPaths.forEach((p) => cmd.input(p));

      const filters: string[] = [];
      let lastOutput = '[0:v]';

      for (let i = 1; i < clipPaths.length; i++) {
        const output = i < clipPaths.length - 1 ? `[v${i}]` : '[vout]';
        filters.push(
          `${lastOutput}[${i}:v]xfade=transition=fade:duration=${payload.transition_duration}:offset=${i * 3}${output}`,
        );
        lastOutput = output;
      }

      if (clipPaths.length === 1) {
        // Single clip, no filter needed
        cmd
          .outputOptions(['-c', 'copy'])
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(outputPath);
      } else {
        cmd
          .complexFilter(filters)
          .outputOptions(['-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast'])
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(outputPath);
      }
    });
  } else {
    // Simple concat demuxer
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(listPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
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
