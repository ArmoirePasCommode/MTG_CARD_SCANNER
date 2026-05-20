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
 *
 * Rules (in order):
 *  1. Split on newlines, trim each line.
 *  2. Discard lines that are pure numbers, pure symbols/punctuation, very short
 *     (≤2 chars), or look like a mana-cost string (e.g. "{2}{W}{B}").
 *  3. Discard lines that match known non-name patterns: creature type lines
 *     ("Legendary Creature —"), copyright/legal footers, collector numbers
 *     ("042/281"), power/toughness ("2/3"), reminder text in parentheses.
 *  4. Prefer the first remaining line that starts with an uppercase letter,
 *     contains only word characters, spaces, commas, apostrophes and hyphens,
 *     and is between 3 and 45 characters long.
 *  5. Fall back to the first candidate that passes steps 1-3, or empty string.
 */
export function extractCardName(ocrText: string): string {
  const MANA_COST = /^\{[^}]+\}(\{[^}]+\})*$/;
  const COLLECTOR_NUMBER = /^\d+\/\d+$/;
  const POWER_TOUGHNESS = /^\d+\/\d+$/;
  const REMINDER_TEXT = /^\(.*\)$/;
  const TYPE_LINE = /\bCreature\b|\bInstant\b|\bSorcery\b|\bEnchantment\b|\bArtifact\b|\bPlaneswalker\b|\bLand\b|\bBattle\b/i;
  const COPYRIGHT = /©|™|\bWizards\b|\bHasbro\b/i;
  const ONLY_SYMBOLS = /^[\W\d]+$/;

  const candidates = ocrText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length <= 2) return false;
      if (MANA_COST.test(l)) return false;
      if (COLLECTOR_NUMBER.test(l)) return false;
      if (POWER_TOUGHNESS.test(l)) return false;
      if (REMINDER_TEXT.test(l)) return false;
      if (TYPE_LINE.test(l)) return false;
      if (COPYRIGHT.test(l)) return false;
      if (ONLY_SYMBOLS.test(l)) return false;
      return true;
    });

  // Prefer a line that looks like a proper card name
  const CARD_NAME_SHAPE = /^[A-Z][A-Za-z0-9 ',\-]{2,44}$/;
  const strong = candidates.find((l) => CARD_NAME_SHAPE.test(l) && l.length <= 45);
  return strong ?? candidates[0] ?? '';
}
