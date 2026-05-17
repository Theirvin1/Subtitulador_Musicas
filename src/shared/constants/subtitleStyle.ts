import type { SubtitleStyle } from '../types/project';

export type SubtitleStylePresetId =
  | 'CLEAN'
  | 'ANIME'
  | 'TRANSLATOR'
  | 'MINIMAL'
  | 'TIKTOK'
  | 'KARAOKE_BASIC';

export type SubtitleStylePreset = {
  id: SubtitleStylePresetId;
  label: string;
  description: string;
  previewColor: string;
  previewAccent: string;
  createStyle: (width: number, height: number) => SubtitleStyle;
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontOriginal: 'Inter',
  fontTranslation: 'Inter',
  sizeOriginal: 56,
  sizeTranslation: 40,
  colorOriginal: '#ffffff',
  colorTranslation: '#d3f7f2',
  borderSize: 2,
  shadow: true,
  xOriginal: 960,
  yOriginal: 860,
  xTranslation: 960,
  yTranslation: 930,
  moveTogether: true
};

export const createDefaultSubtitleStyle = (
  width: number,
  height: number
): SubtitleStyle => ({
  ...DEFAULT_SUBTITLE_STYLE,
  xOriginal: Math.round(width / 2),
  yOriginal: Math.round(height * 0.8),
  xTranslation: Math.round(width / 2),
  yTranslation: Math.round(height * 0.86)
});

const createSubtitleStyle = (
  width: number,
  height: number,
  overrides: Partial<SubtitleStyle>
): SubtitleStyle => ({
  ...createDefaultSubtitleStyle(width, height),
  ...overrides
});

export const SUBTITLE_STYLE_PRESETS: SubtitleStylePreset[] = [
  {
    id: 'CLEAN',
    label: 'Limpio',
    description: 'Blanco, sobrio y legible.',
    previewColor: '#ffffff',
    previewAccent: '#d3f7f2',
    createStyle: (width, height) =>
      createSubtitleStyle(width, height, {
        sizeOriginal: 54,
        sizeTranslation: 38,
        colorOriginal: '#ffffff',
        colorTranslation: '#d3f7f2',
        borderSize: 2,
        shadow: true,
        xOriginal: Math.round(width / 2),
        yOriginal: Math.round(height * 0.79),
        xTranslation: Math.round(width / 2),
        yTranslation: Math.round(height * 0.86),
        moveTogether: true
      })
  },
  {
    id: 'ANIME',
    label: 'Anime',
    description: 'Alto contraste con energia pop.',
    previewColor: '#fff7a8',
    previewAccent: '#ff9bd2',
    createStyle: (width, height) =>
      createSubtitleStyle(width, height, {
        sizeOriginal: 62,
        sizeTranslation: 42,
        colorOriginal: '#fff7a8',
        colorTranslation: '#ff9bd2',
        borderSize: 4,
        shadow: true,
        xOriginal: Math.round(width / 2),
        yOriginal: Math.round(height * 0.76),
        xTranslation: Math.round(width / 2),
        yTranslation: Math.round(height * 0.84),
        moveTogether: true
      })
  },
  {
    id: 'TRANSLATOR',
    label: 'Traductor',
    description: 'Original arriba y traduccion clara.',
    previewColor: '#eaf2ff',
    previewAccent: '#8fe8dc',
    createStyle: (width, height) =>
      createSubtitleStyle(width, height, {
        sizeOriginal: 48,
        sizeTranslation: 44,
        colorOriginal: '#eaf2ff',
        colorTranslation: '#8fe8dc',
        borderSize: 2,
        shadow: true,
        xOriginal: Math.round(width / 2),
        yOriginal: Math.round(height * 0.72),
        xTranslation: Math.round(width / 2),
        yTranslation: Math.round(height * 0.82),
        moveTogether: true
      })
  },
  {
    id: 'MINIMAL',
    label: 'Minimalista',
    description: 'Pequeno, discreto y limpio.',
    previewColor: '#f8fafc',
    previewAccent: '#cbd5e1',
    createStyle: (width, height) =>
      createSubtitleStyle(width, height, {
        sizeOriginal: 42,
        sizeTranslation: 32,
        colorOriginal: '#f8fafc',
        colorTranslation: '#cbd5e1',
        borderSize: 1,
        shadow: false,
        xOriginal: Math.round(width / 2),
        yOriginal: Math.round(height * 0.84),
        xTranslation: Math.round(width / 2),
        yTranslation: Math.round(height * 0.9),
        moveTogether: true
      })
  },
  {
    id: 'TIKTOK',
    label: 'TikTok',
    description: 'Grande y centrado para vertical.',
    previewColor: '#ffffff',
    previewAccent: '#42f5e9',
    createStyle: (width, height) =>
      createSubtitleStyle(width, height, {
        sizeOriginal: 72,
        sizeTranslation: 48,
        colorOriginal: '#ffffff',
        colorTranslation: '#42f5e9',
        borderSize: 5,
        shadow: true,
        xOriginal: Math.round(width / 2),
        yOriginal: Math.round(height * 0.66),
        xTranslation: Math.round(width / 2),
        yTranslation: Math.round(height * 0.75),
        moveTogether: true
      })
  },
  {
    id: 'KARAOKE_BASIC',
    label: 'Karaoke basico',
    description: 'Apariencia musical, sin palabra por palabra.',
    previewColor: '#ffe066',
    previewAccent: '#ffffff',
    createStyle: (width, height) =>
      createSubtitleStyle(width, height, {
        sizeOriginal: 64,
        sizeTranslation: 36,
        colorOriginal: '#ffe066',
        colorTranslation: '#ffffff',
        borderSize: 4,
        shadow: true,
        xOriginal: Math.round(width / 2),
        yOriginal: Math.round(height * 0.81),
        xTranslation: Math.round(width / 2),
        yTranslation: Math.round(height * 0.89),
        moveTogether: true
      })
  }
];

export const getSubtitleStylePreset = (
  presetId: SubtitleStylePresetId,
  width: number,
  height: number
): SubtitleStyle => {
  return (
    SUBTITLE_STYLE_PRESETS.find((preset) => preset.id === presetId) ??
    SUBTITLE_STYLE_PRESETS[0]
  ).createStyle(width, height);
};
