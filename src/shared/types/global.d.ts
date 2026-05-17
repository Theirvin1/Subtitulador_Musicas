export {};

import type { MediaFile, MediaKind } from './media';
import type { Project, ProjectSummary } from './project';

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
      media: {
        selectFile: (kind: MediaKind) => Promise<MediaFile | null>;
      };
    };
  }
}
