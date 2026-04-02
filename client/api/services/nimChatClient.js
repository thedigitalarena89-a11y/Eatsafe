const DEFAULT_BASE = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function callNimChat({ imageBuffer, prompt }) {
  const apiKey = process.env.NIM_API_KEY;
  const model = process.env.NIM_VISION_MODEL || 'meta/llama-4-maverick-17b-128e-instruct';
  const endpoint = process.env.NIM_API_BASE || DEFAULT_BASE;

  if (!apiKey) {
    throw new Error('NIM_API_KEY is not set in Vercel/Environment');
  }

  const base64 = imageBuffer.toString('base64');

  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`
            }
          }
        ]
      }
    ],
    max_tokens: 512,
    temperature: 0.2,
    top_p: 1
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM chat failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}
