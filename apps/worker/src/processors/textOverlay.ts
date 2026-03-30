import path from 'path';
import type { Job } from '@clipforge/shared';
import type { TextOverlayPayload } from '@clipforge/shared';
import { downloadFile, runFfmpeg, cleanup } from '../lib/ffmpeg';
import { uploadToR2 } from '../lib/r2';
import { updateJobProgress } from '../lib/db';

const FONT_DIR = path.resolve(__dirname, '../../src/assets/fonts');

const FONT_MAP: Record<string, string> = {
  bebas: path.join(FONT_DIR, 'BebasNeue-Regular.ttf'),
  montserrat: path.join(FONT_DIR, 'Montserrat-Black.ttf'),
  impact: path.join(FONT_DIR, 'Impact.ttf'),
};

const RESOLUTION_MAP: Record<string, { w: number; h: number }> = {
  '1080x1920': { w: 1080, h: 1920 },
  '1920x1080': { w: 1920, h: 1080 },
  '1080x1080': { w: 1080, h: 1080 },
};

function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "\\\\\\'")
    .replace(/:/g, '\\\\:')
    .replace(/\[/g, '\\\\[')
    .replace(/\]/g, '\\\\]')
    .replace(/%/g, '%%');
}

export async function processTextOverlay(job: Job): Promise<string> {
  const payload = job.payload as unknown as TextOverlayPayload;
  const inputPath = `/tmp/clipforge-${job.id}-input.mp4`;
  const outputPath = `/tmp/clipforge-${job.id}-output.mp4`;

  await downloadFile(payload.video_url, inputPath);
  await updateJobProgress(job.id, 10);

  const { h: videoHeight } = RESOLUTION_MAP[payload.resolution] || { w: 1080, h: 1920 };
  const fontPath = FONT_MAP[payload.font] || FONT_MAP.bebas;
  const opacity = payload.overlay_opacity;

  // Build filter chain
  const filters: string[] = [];

  // Dark overlay
  filters.push(`drawbox=x=0:y=0:w=iw:h=ih:color=black@${opacity}:t=fill`);

  // Text segments
  let startY = Math.round(videoHeight * 0.28);

  for (const segment of payload.segments) {
    const color = segment.style === 'accent' ? payload.accent_color : payload.primary_color;
    const delay = segment.delay;
    const end = delay + segment.duration;
    const fadeIn = delay + 0.4;
    const fadeOut = end - 0.3;
    const escapedText = escapeFFmpegText(segment.text);

    let x: string;
    switch (segment.position) {
      case 'left':
        x = '48';
        break;
      case 'right':
        x = 'w-text_w-48';
        break;
      default:
        x = '(w-text_w)/2';
    }

    const alphaExpr = `if(lt(t\\,${fadeIn})\\,(t-${delay})/0.4\\,if(gt(t\\,${fadeOut})\\,(${end}-t)/0.3\\,1))`;

    filters.push(
      `drawtext=fontfile='${fontPath.replace(/\\/g, '/')}':` +
      `text='${escapedText}':` +
      `fontsize=${segment.size}:` +
      `fontcolor=${color}:` +
      `x=${x}:` +
      `y=${startY}:` +
      `enable='between(t\\,${delay}\\,${end})':` +
      `alpha='${alphaExpr}'`
    );

    startY += Math.round(segment.size * 1.15);
  }

  const filterChain = filters.join(',');

  await runFfmpeg(
    inputPath,
    outputPath,
    (cmd) =>
      cmd
        .videoFilter(filterChain)
        .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy']),
    async (percent) => {
      await updateJobProgress(job.id, 10 + Math.round(percent * 0.8));
    },
  );

  await updateJobProgress(job.id, 90);

  const cdnUrl = await uploadToR2(
    outputPath,
    `renders/${job.id}/output.mp4`,
    'video/mp4',
  );

  await updateJobProgress(job.id, 100);
  return cdnUrl;
}
