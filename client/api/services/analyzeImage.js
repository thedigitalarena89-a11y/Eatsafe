import { detectFood } from './foodDetection.js';
import { detectWeight } from './weightOcr.js';

export async function analyzeImage(buffer) {
  const warnings = [];

  const [food, weight] = await Promise.all([
    detectFood(buffer).catch(() => {
      warnings.push('Food detection failed. Please enter manually.');
      return { name: 'Unknown', confidence: 0 };
    }),
    detectWeight(buffer).catch(() => {
      warnings.push('Weight detection failed. Please enter manually.');
      return { valueGrams: null, display: 'Unknown', confidence: 0 };
    })
  ]);

  if (food.confidence !== null && food.confidence < 0.5) {
    warnings.push('Low confidence on food recognition.');
  }

  if (weight.confidence !== null && weight.confidence < 0.5) {
    warnings.push('Low confidence on weight OCR.');
  }

  return {
    food,
    weight,
    warnings,
    timestamp: new Date().toISOString()
  };
}
