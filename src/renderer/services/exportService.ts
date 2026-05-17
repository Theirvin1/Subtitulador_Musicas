import type { ExportRequest, ExportResult } from '../../shared/types/export';

export const exportService = {
  checkFfmpeg(): Promise<boolean> {
    return window.subMusic.export.checkFfmpeg();
  },
  selectOutputDirectory(): Promise<string | null> {
    return window.subMusic.export.selectOutputDirectory();
  },
  exportMp4(request: ExportRequest): Promise<ExportResult> {
    return window.subMusic.export.mp4(request);
  }
};
