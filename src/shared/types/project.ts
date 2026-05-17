export type VideoFormat =
  | 'VERTICAL_9_16'
  | 'HORIZONTAL_16_9'
  | 'SQUARE_1_1'
  | 'CLASSIC_4_3'
  | 'VERTICAL_3_4'
  | 'ORIGINAL';

export type Project = {
  id: string;
  name: string;
  audioPath?: string;
  videoPath?: string;
  backgroundPath?: string;
  coverPath?: string;
  exportBasePath?: string;
  videoFormat: VideoFormat;
  width: number;
  height: number;
  fps: number;
  subtitleStyle: SubtitleStyle;
  subtitleBlocks: SubtitleBlock[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = Pick<
  Project,
  'id' | 'name' | 'videoFormat' | 'width' | 'height' | 'fps' | 'createdAt' | 'updatedAt'
>;

export type VideoFormatPreset = {
  value: VideoFormat;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
};

export type SubtitleBlock = {
  id: string;
  projectId: string;
  order: number;
  startTime: number;
  endTime: number;
  originalText: string;
  translatedText: string;
  enabled: boolean;
};

export type SubtitleStyle = {
  fontOriginal: string;
  fontTranslation: string;
  sizeOriginal: number;
  sizeTranslation: number;
  colorOriginal: string;
  colorTranslation: string;
  borderSize: number;
  shadow: boolean;
  xOriginal: number;
  yOriginal: number;
  xTranslation: number;
  yTranslation: number;
  moveTogether: boolean;
};

export type AppSettings = {
  autoSaveEnabled: boolean;
};
