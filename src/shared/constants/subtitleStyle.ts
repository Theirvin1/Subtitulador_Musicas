import type { SubtitleStyle } from '../types/project';

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
