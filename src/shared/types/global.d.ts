export {};

import type { MediaFile, MediaKind } from './media';
import type { ExportRequest, ExportResult } from './export';
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
      media: {
        selectFile: (kind: MediaKind) => Promise<MediaFile | null>;
      };
      export: {
        checkFfmpeg: () => Promise<boolean>;
        selectOutputDirectory: () => Promise<string | null>;
        mp4: (request: ExportRequest) => Promise<ExportResult>;
      };
    };
  }
}
