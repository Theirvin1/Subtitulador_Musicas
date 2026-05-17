import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import type { MediaKind } from '../shared/types/media';
import type { Project } from '../shared/types/project';

const api = {
  platform: process.platform,
  projects: {
    save: (project: Project) => ipcRenderer.invoke(IPC_CHANNELS.projects.save, project),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.projects.list),
    open: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.projects.open, projectId),
    delete: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.projects.delete, projectId)
  },
  media: {
    selectFile: (kind: MediaKind) => ipcRenderer.invoke(IPC_CHANNELS.media.selectFile, kind)
  }
};

contextBridge.exposeInMainWorld('subMusic', api);
