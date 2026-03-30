import sharp from 'sharp';
import type { Job } from '@clipforge/shared';
import type { AdCreativePayload } from '@clipforge/shared';
import { uploadToR2 } from '../lib/r2';
import { updateJobProgress } from '../lib/db';

const RESOLUTION_MAP: Record<string, { w: number; h: number }> = {
  '1080x1920': { w: 1080, h: 1920 },
  '1080x1080': { w: 1080, h: 1080 },
  '1200x628': { w: 1200, h: 628 },
};

export async function processAdCreative(job: Job): Promise<string> {
  const payload = job.payload as unknown as AdCreativePayload;
  const outputPath = `/tmp/clipforge-${job.id}-output.png`;
  const { w, h } = RESOLUTION_MAP[payload.resolution] || { w: 1080, h: 1920 };

  await updateJobProgress(job.id, 10);

  const isDark = payload.background === 'dark' || payload.background === '#000000';
  const bgColor = payload.background === 'dark' ? '#0a0a0a'
    : payload.background === 'light' ? '#ffffff'
    : payload.background;
  const textColor = isDark ? '#ffffff' : '#111111';
  const subColor = isDark ? '#aaaaaa' : '#555555';
  const ctaBg = isDark ? '#ffffff' : '#111111';
  const ctaText = isDark ? '#000000' : '#ffffff';

  // Build SVG
  const logoSection = payload.logos.length > 0
    ? payload.logos.map((l, i) =>
        `<text x="${w / 2}" y="${h * 0.3 + i * 50}" text-anchor="middle" font-size="36" fill="${textColor}">${l.emoji} ${escapeXml(l.name)}</text>`
      ).join('\n')
    : '';

  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="${bgColor}"/>

      ${logoSection}

      <text x="${w / 2}" y="${h * 0.45}" text-anchor="middle"
        font-size="${Math.round(w * 0.06)}" font-weight="bold" fill="${textColor}"
        font-family="sans-serif">
        ${escapeXml(payload.headline)}
      </text>

      <text x="${w / 2}" y="${h * 0.52}" text-anchor="middle"
        font-size="${Math.round(w * 0.03)}" fill="${subColor}"
        font-family="sans-serif">
        ${escapeXml(payload.subheadline)}
      </text>

      <rect x="${w * 0.25}" y="${h * 0.6}" width="${w * 0.5}" height="${h * 0.05}"
        rx="8" fill="${ctaBg}"/>
      <text x="${w / 2}" y="${h * 0.6 + h * 0.035}" text-anchor="middle"
        font-size="${Math.round(w * 0.025)}" font-weight="bold" fill="${ctaText}"
        font-family="sans-serif">
        ${escapeXml(payload.cta_text)}
      </text>

      <text x="${w / 2}" y="${h * 0.75}" text-anchor="middle"
        font-size="${Math.round(w * 0.02)}" fill="${subColor}"
        font-family="sans-serif">
        ${escapeXml(payload.trust_line)}
      </text>
    </svg>
  `;

  await updateJobProgress(job.id, 50);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  await updateJobProgress(job.id, 80);

  const cdnUrl = await uploadToR2(
    outputPath,
    `renders/${job.id}/output.png`,
    'image/png',
  );

  return cdnUrl;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
