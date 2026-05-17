import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import type { AppDatabase } from '../database';

export const registerIpcHandlers = (database: AppDatabase): void => {
  ipcMain.handle(IPC_CHANNELS.projects.save, (_event, project: unknown) => {
    return database.saveProject(project);
  });

  ipcMain.handle(IPC_CHANNELS.projects.list, () => {
    return database.listProjects();
  });

  ipcMain.handle(IPC_CHANNELS.projects.open, (_event, projectId: unknown) => {
    return database.openProject(projectId);
  });

  ipcMain.handle(IPC_CHANNELS.projects.delete, (_event, projectId: unknown) => {
    return database.deleteProject(projectId);
  });
};
