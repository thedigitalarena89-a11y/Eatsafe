import { Buffer } from 'buffer';

export async function callNimInfer({ endpoint, imageBuffer, apiKey, payloadBuilder }) {
  if (!endpoint) {
    throw new Error('NIM endpoint not configured');
  }

  const base64 = imageBuffer.toString('base64');
  const payload = payloadBuilder
    ? payloadBuilder(base64)
    : {
        input: [
          {
            type: 'image_url',
            url: `data:image/jpeg;base64,${base64}`
          }
        ]
      };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${endpoint}/v1/infer`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM inference failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
