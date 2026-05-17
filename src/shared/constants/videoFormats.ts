import type { VideoFormat, VideoFormatPreset } from '../types/project';

export const DEFAULT_FPS = 30;
export const DEFAULT_VIDEO_FORMAT: VideoFormat = 'HORIZONTAL_16_9';

export const VIDEO_FORMAT_PRESETS: VideoFormatPreset[] = [
  {
    value: 'HORIZONTAL_16_9',
    label: 'Horizontal 16:9',
    width: 1920,
    height: 1080
  },
  {
    value: 'VERTICAL_9_16',
    label: 'Vertical 9:16',
    width: 1080,
    height: 1920
  },
  {
    value: 'SQUARE_1_1',
    label: 'Cuadrado 1:1',
    width: 1080,
    height: 1080
  },
  {
    value: 'CLASSIC_4_3',
    label: 'Clasico 4:3',
    width: 1440,
    height: 1080
  },
  {
    value: 'VERTICAL_3_4',
    label: 'Vertical 3:4',
    width: 1080,
    height: 1440
  },
  {
    value: 'ORIGINAL',
    label: 'Original',
    width: 1920,
    height: 1080
  }
];

export const getVideoFormatPreset = (videoFormat: VideoFormat): VideoFormatPreset => {
  return (
    VIDEO_FORMAT_PRESETS.find((preset) => preset.value === videoFormat) ??
    VIDEO_FORMAT_PRESETS[0]
  );
};
