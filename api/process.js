import { IncomingForm } from 'formidable';
import fs from 'node:fs/promises';
import { analyzeImage } from './services/analyzeImage.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const imageFile = files.image?.[0] || files.image;
    if (!imageFile) {
      return res.status(400).json({ error: 'Image is required.' });
    }

    const buffer = await fs.readFile(imageFile.filepath);
    const result = await analyzeImage(buffer);
    
    // Clean up temporary file
    await fs.unlink(imageFile.filepath).catch(() => {});

    res.status(200).json(result);
  } catch (error) {
    console.error('API Process Error:', error);
    res.status(500).json({ error: 'Processing failed.', details: error.message });
  }
}
