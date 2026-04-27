import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

/**
 * Runs Google Cloud Vision text detection on a raw image buffer.
 * Returns the full detected text, or an empty string if nothing found.
 */
export async function extractTextFromBuffer(imageBuffer: Buffer): Promise<string> {
  const [result] = await client.textDetection({ image: { content: imageBuffer } });
  return result.fullTextAnnotation?.text ?? '';
}

/**
 * Heuristically picks the most likely MTG card name from raw OCR text.
 * MTG card names appear on the first non-trivial line of the card.
 */
export function extractCardName(ocrText: string): string {
  const lines = ocrText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^\d+$/.test(l));
  return lines[0] ?? '';
}
