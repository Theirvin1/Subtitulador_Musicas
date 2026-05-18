import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import {
  checkExportOutputExists,
  checkFfmpegAvailable,
  exportMp4,
  extractCoverFrame,
  selectOutputDirectory,
  validateProjectBeforeExport
} from '../ffmpegService';
import { selectFontFile } from '../fonts';
import { selectMediaFile } from '../media';
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

  ipcMain.handle(IPC_CHANNELS.settings.get, () => {
    return database.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.settings.update, (_event, settings: unknown) => {
    return database.updateSettings(settings);
  });

  ipcMain.handle(IPC_CHANNELS.fonts.list, () => {
    return database.listCustomFonts();
  });

  ipcMain.handle(IPC_CHANNELS.fonts.add, async () => {
    const font = await selectFontFile();

    return font ? database.addCustomFont(font) : null;
  });

  ipcMain.handle(IPC_CHANNELS.media.selectFile, (_event, kind: unknown) => {
    return selectMediaFile(kind);
  });

  ipcMain.handle(IPC_CHANNELS.export.checkFfmpeg, () => {
    return checkFfmpegAvailable();
  });

  ipcMain.handle(IPC_CHANNELS.export.checkOutput, (_event, request: unknown) => {
    return checkExportOutputExists(request);
  });

  ipcMain.handle(IPC_CHANNELS.export.selectOutputDirectory, () => {
    return selectOutputDirectory();
  });

  ipcMain.handle(IPC_CHANNELS.export.extractCoverFrame, (_event, request: unknown) => {
    return extractCoverFrame(request);
  });

  ipcMain.handle(IPC_CHANNELS.export.validate, (_event, request: unknown) => {
    return validateProjectBeforeExport(request);
  });

  ipcMain.handle(IPC_CHANNELS.export.mp4, (_event, request: unknown) => {
    return exportMp4(request);
  });
};
