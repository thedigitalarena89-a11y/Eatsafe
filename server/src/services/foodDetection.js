import { callNimChat } from './nimChatClient.js';

export async function detectFood(imageBuffer) {
  const response = await callNimChat({
    imageBuffer,
    prompt:
      'Identify the primary food item in this image. Respond ONLY as JSON with keys: name (string), confidence (0-1). Example: {"name":"carrot","confidence":0.84}'
  });

  const parsed = safeJson(response);
  if (!parsed?.name) {
    return { name: 'Unknown', confidence: 0 };
  }

  return {
    name: String(parsed.name),
    confidence: Number(parsed.confidence ?? 0)
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
