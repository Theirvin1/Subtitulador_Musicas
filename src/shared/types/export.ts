import type { Project } from './project';
import type { CustomFont } from './font';

export type ExportQuality = 'MEDIUM' | 'HIGH' | 'MAXIMUM';

export type ExportMode = 'MP4' | 'MP4_AND_MP3' | 'MP3_ONLY';

export type ExportRequest = {
  project: Project;
  outputName: string;
  outputDirectory: string;
  quality: ExportQuality;
  mode: ExportMode;
  fps: number;
  customFonts: CustomFont[];
};

export type ExportValidationIssueSeverity = 'error' | 'warning';

export type ExportValidationIssue = {
  severity: ExportValidationIssueSeverity;
  message: string;
};

export type ExportValidationRequest = {
  project: Project | null;
  outputName: string;
  outputDirectory: string;
  mode: ExportMode;
  customFonts: CustomFont[];
};

export type ExportValidationResult = {
  errors: ExportValidationIssue[];
  warnings: ExportValidationIssue[];
  canExport: boolean;
};

export type ExportOutputCheckRequest = {
  outputName: string;
  outputDirectory: string;
  mode: ExportMode;
};

export type ExportOutputCheckResult = {
  exists: boolean;
  paths: string[];
};

export type ExportResult = {
  outputDirectory: string;
  mp4Path?: string;
  mp3Path?: string;
  coverPath?: string;
};

export type ExtractCoverFrameRequest = {
  projectId: string;
  videoPath: string;
  currentTime: number;
};

export type ExtractCoverFrameResult = {
  coverPath: string;
};
