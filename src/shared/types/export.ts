import type { Project } from './project';

export type ExportQuality = 'HIGH';

export type ExportRequest = {
  project: Project;
  outputName: string;
  outputDirectory: string;
  quality: ExportQuality;
  fps: number;
};

export type ExportResult = {
  outputPath: string;
};
