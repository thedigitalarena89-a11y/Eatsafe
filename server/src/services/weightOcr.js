import sharp from 'sharp';
import { callNimChat } from './nimChatClient.js';

const DEFAULT_CONFIDENCE = 0;

export async function detectWeight(imageBuffer) {
  const preprocessed = await preprocessForOcr(imageBuffer);

  const response = await callNimChat({
    imageBuffer: preprocessed,
    prompt:
      'Read the weight from the weighing scale display (7-segment digits). Respond ONLY as JSON with keys: weight_display (e.g. "1.25 kg" or "750 g"), weight_grams (integer), confidence (0-1). If unreadable, set weight_display to "unknown" and confidence 0.'
  });

  const parsed = safeJson(response);
  if (!parsed || !parsed.weight_display || parsed.weight_display === 'unknown') {
    return {
      valueGrams: null,
      display: 'Unknown',
      confidence: Number(parsed?.confidence ?? DEFAULT_CONFIDENCE),
      rawText: response
    };
  }

  return {
    valueGrams: Number(parsed.weight_grams ?? null),
    display: String(parsed.weight_display),
    confidence: Number(parsed.confidence ?? DEFAULT_CONFIDENCE),
    rawText: response
  };
}

async function preprocessForOcr(imageBuffer) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const crop = parseCrop(metadata.width, metadata.height);

  let pipeline = image;
  if (crop) {
    pipeline = pipeline.extract(crop);
  }

  return pipeline
    .greyscale()
    .normalize()
    .linear(1.4, -15)
    .sharpen()
    .toBuffer();
}

function parseCrop(width, height) {
  const cropEnv = process.env.OCR_CROP;
  if (!cropEnv) return null;

  const parts = cropEnv.split(',').map((value) => Number(value.trim()));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }

  const [xPct, yPct, wPct, hPct] = parts;
  return {
    left: Math.max(0, Math.floor((xPct / 100) * width)),
    top: Math.max(0, Math.floor((yPct / 100) * height)),
    width: Math.max(1, Math.floor((wPct / 100) * width)),
    height: Math.max(1, Math.floor((hPct / 100) * height))
  };
}

function safeJson(text) {
  if (!text) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(text.slice(first, last + 1));
  } catch {
    return null;
  }
}
