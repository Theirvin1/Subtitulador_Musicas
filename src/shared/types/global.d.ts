export {};

import type { MediaFile, MediaKind } from './media';
import type {
  ExportRequest,
  ExportResult,
  ExportOutputCheckRequest,
  ExportOutputCheckResult,
  ExportValidationRequest,
  ExportValidationResult,
  FfmpegAvailability,
  ExtractCoverFrameRequest,
  ExtractCoverFrameResult
} from './export';
import type { CustomFont } from './font';
import type { AppSettings, Project, ProjectSummary } from './project';

declare global {
  interface Window {
    subMusic: {
      platform: NodeJS.Platform;
      projects: {
        save: (project: Project) => Promise<Project>;
        list: () => Promise<ProjectSummary[]>;
        open: (projectId: string) => Promise<Project | null>;
        delete: (projectId: string) => Promise<boolean>;
      };
      settings: {
        get: () => Promise<AppSettings>;
        update: (settings: AppSettings) => Promise<AppSettings>;
      };
      fonts: {
        list: () => Promise<CustomFont[]>;
        add: () => Promise<CustomFont | null>;
      };
      media: {
        selectFile: (kind: MediaKind) => Promise<MediaFile | null>;
      };
      export: {
        checkFfmpeg: () => Promise<FfmpegAvailability>;
        checkOutput: (request: ExportOutputCheckRequest) => Promise<ExportOutputCheckResult>;
        selectOutputDirectory: () => Promise<string | null>;
        extractCoverFrame: (
          request: ExtractCoverFrameRequest
        ) => Promise<ExtractCoverFrameResult>;
        validate: (request: ExportValidationRequest) => Promise<ExportValidationResult>;
        mp4: (request: ExportRequest) => Promise<ExportResult>;
      };
    };
  }
}
