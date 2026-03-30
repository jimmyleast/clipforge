import ffmpeg from 'fluent-ffmpeg';
import { glob } from 'glob';
import { unlink, writeFile } from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { logger } from './logger';

export async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const fileStream = createWriteStream(destPath);
  await pipeline(Readable.fromWeb(res.body as any), fileStream);
}

export function runFfmpeg(
  inputPath: string,
  outputPath: string,
  buildFilters: (cmd: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath);
    cmd = buildFilters(cmd);

    cmd
      .on('progress', (p) => {
        if (onProgress && p.percent) onProgress(Math.round(p.percent));
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

export async function cleanup(jobId: string): Promise<void> {
  try {
    const files = await glob(`/tmp/clipforge-${jobId}-*`);
    await Promise.allSettled(files.map((f) => unlink(f)));
  } catch (err) {
    logger.warn({ jobId, err: (err as Error).message }, 'Cleanup warning');
  }
}

export async function writeTempFile(jobId: string, suffix: string, content: string): Promise<string> {
  const path = `/tmp/clipforge-${jobId}-${suffix}`;
  await writeFile(path, content, 'utf-8');
  return path;
}
