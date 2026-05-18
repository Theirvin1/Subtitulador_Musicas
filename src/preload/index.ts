import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import type {
  ExportRequest,
  ExportValidationRequest,
  ExtractCoverFrameRequest
} from '../shared/types/export';
import type { CustomFont } from '../shared/types/font';
import type { MediaKind } from '../shared/types/media';
import type { AppSettings, Project } from '../shared/types/project';

const api = {
  platform: process.platform,
  projects: {
    save: (project: Project) => ipcRenderer.invoke(IPC_CHANNELS.projects.save, project),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.projects.list),
    open: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.projects.open, projectId),
    delete: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.projects.delete, projectId)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settings.get),
    update: (settings: AppSettings) => ipcRenderer.invoke(IPC_CHANNELS.settings.update, settings)
  },
  fonts: {
    list: (): Promise<CustomFont[]> => ipcRenderer.invoke(IPC_CHANNELS.fonts.list),
    add: (): Promise<CustomFont | null> => ipcRenderer.invoke(IPC_CHANNELS.fonts.add)
  },
  media: {
    selectFile: (kind: MediaKind) => ipcRenderer.invoke(IPC_CHANNELS.media.selectFile, kind)
  },
  export: {
    checkFfmpeg: () => ipcRenderer.invoke(IPC_CHANNELS.export.checkFfmpeg),
    selectOutputDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.export.selectOutputDirectory),
    extractCoverFrame: (request: ExtractCoverFrameRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.export.extractCoverFrame, request),
    validate: (request: ExportValidationRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.export.validate, request),
    mp4: (request: ExportRequest) => ipcRenderer.invoke(IPC_CHANNELS.export.mp4, request)
  }
};

contextBridge.exposeInMainWorld('subMusic', api);
