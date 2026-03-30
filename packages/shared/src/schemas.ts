import { z } from 'zod';

export const textOverlaySchema = z.object({
  video_url: z.string().url(),
  segments: z.array(z.object({
    text: z.string(),
    size: z.number().min(8).max(200),
    style: z.enum(['primary', 'accent']),
    delay: z.number().min(0),
    duration: z.number().min(0.1),
    position: z.enum(['left', 'center', 'right']),
  })).min(1),
  primary_color: z.string().default('#ffffff'),
  accent_color: z.string().default('#c8b88a'),
  overlay_opacity: z.number().min(0).max(0.85).default(0.4),
  font: z.enum(['bebas', 'montserrat', 'impact']).default('bebas'),
  output_format: z.literal('mp4').default('mp4'),
  resolution: z.enum(['1080x1920', '1920x1080', '1080x1080']).default('1080x1920'),
});

export const captionBurnSchema = z.object({
  video_url: z.string().url(),
  srt_content: z.string().min(1),
  style: z.object({
    font_size: z.number().min(8).max(120).default(24),
    primary_color: z.string().default('#ffffff'),
    outline_color: z.string().default('#000000'),
    position: z.enum(['bottom', 'center', 'top']).default('bottom'),
  }),
});

export const audioDubSchema = z.object({
  video_url: z.string().url(),
  audio_url: z.string().url(),
  mode: z.enum(['replace', 'mix']).default('replace'),
  mix_volume: z.number().min(0).max(1).default(0.3),
});

export const trimSchema = z.object({
  video_url: z.string().url(),
  start: z.number().min(0),
  end: z.number().min(0),
});

export const concatSchema = z.object({
  clips: z.array(z.object({
    url: z.string().url(),
    start: z.number().min(0).optional(),
    end: z.number().min(0).optional(),
  })).min(2),
  transition: z.enum(['none', 'fade']).default('none'),
  transition_duration: z.number().min(0).max(5).default(0.5),
});

export const adCreativeSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().default(''),
  background: z.string().default('dark'),
  logos: z.array(z.object({
    name: z.string(),
    emoji: z.string(),
  })).default([]),
  cta_text: z.string().default('Get Started'),
  trust_line: z.string().default(''),
  resolution: z.enum(['1080x1920', '1080x1080', '1200x628']).default('1080x1920'),
});

export const jobTypeSchemas = {
  text_overlay: textOverlaySchema,
  caption_burn: captionBurnSchema,
  audio_dub: audioDubSchema,
  trim: trimSchema,
  concat: concatSchema,
  ad_creative: adCreativeSchema,
} as const;

export type TextOverlayPayload = z.infer<typeof textOverlaySchema>;
export type CaptionBurnPayload = z.infer<typeof captionBurnSchema>;
export type AudioDubPayload = z.infer<typeof audioDubSchema>;
export type TrimPayload = z.infer<typeof trimSchema>;
export type ConcatPayload = z.infer<typeof concatSchema>;
export type AdCreativePayload = z.infer<typeof adCreativeSchema>;
