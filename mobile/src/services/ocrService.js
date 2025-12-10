import * as FileSystem from 'expo-file-system';

const SAMPLE_NAMES = [
  'Lightning Bolt',
  'Black Lotus',
  'Counterspell',
  'Sol Ring',
  'Brainstorm',
  'Fabled Passage'
];

const randomName = () => SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];

export const simulateOcrText = async (imageUri) => {
  try {
    if (imageUri) {
      const info = await FileSystem.getInfoAsync(imageUri);
      if (!info.exists) throw new Error('Image not found');
    }
  } catch (error) {
    console.warn('simulateOcrText: unable to inspect file', error);
  }

  // Placeholder for actual OCR integration. Returns newline separated content.
  return `${randomName()}\nLegendary Artifact\n{T}: Add one mana of any color.`;
};

export default {
  simulateOcrText
};

