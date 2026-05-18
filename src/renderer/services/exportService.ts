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
} from '../../shared/types/export';

export const exportService = {
  checkFfmpeg(): Promise<FfmpegAvailability> {
    return window.subMusic.export.checkFfmpeg();
  },
  checkOutput(request: ExportOutputCheckRequest): Promise<ExportOutputCheckResult> {
    return window.subMusic.export.checkOutput(request);
  },
  selectOutputDirectory(): Promise<string | null> {
    return window.subMusic.export.selectOutputDirectory();
  },
  extractCoverFrame(request: ExtractCoverFrameRequest): Promise<ExtractCoverFrameResult> {
    return window.subMusic.export.extractCoverFrame(request);
  },
  validateBeforeExport(request: ExportValidationRequest): Promise<ExportValidationResult> {
    return window.subMusic.export.validate(request);
  },
  exportMp4(request: ExportRequest): Promise<ExportResult> {
    return window.subMusic.export.mp4(request);
  }
};
