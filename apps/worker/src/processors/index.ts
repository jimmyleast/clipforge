import type { Job } from '@clipforge/shared';
import { processTextOverlay } from './textOverlay';
import { processTrim } from './trim';
import { processConcat } from './concat';
import { processCaptionBurn } from './captionBurn';
import { processAudioDub } from './audioDub';
import { processAdCreative } from './adCreative';

const processors: Record<string, (job: Job) => Promise<string>> = {
  text_overlay: processTextOverlay,
  trim: processTrim,
  concat: processConcat,
  caption_burn: processCaptionBurn,
  audio_dub: processAudioDub,
  ad_creative: processAdCreative,
};

export async function processJob(job: Job): Promise<string> {
  const processor = processors[job.type];
  if (!processor) {
    throw new Error(`Unknown job type: ${job.type}`);
  }
  return processor(job);
}
