import type {
  ExportMode,
  ExportValidationIssue,
  ExportValidationRequest,
  ExportValidationResult
} from '../types/export';
import type { CustomFont } from '../types/font';
import type { Project, SubtitleBlock } from '../types/project';

type ValidateProjectBeforeExportInput = {
  project: Project | null;
  outputName: string;
  outputDirectory: string;
  mode: ExportMode;
  customFonts: CustomFont[];
  fileExists?: (path: string) => boolean;
};

const addIssue = (
  issues: ExportValidationIssue[],
  severity: ExportValidationIssue['severity'],
  message: string
): void => {
  issues.push({ severity, message });
};

const hasValidTime = (block: SubtitleBlock): boolean => {
  return (
    Number.isFinite(block.startTime) &&
    Number.isFinite(block.endTime) &&
    block.startTime >= 0 &&
    block.endTime > block.startTime
  );
};

const getEnabledBlocks = (project: Project): SubtitleBlock[] => {
  return project.subtitleBlocks.filter((block) => block.enabled);
};

const detectOverlapMessages = (blocks: SubtitleBlock[]): string[] => {
  const sortedBlocks = [...blocks].sort((firstBlock, secondBlock) => {
    if (firstBlock.startTime === secondBlock.startTime) {
      return firstBlock.order - secondBlock.order;
    }

    return firstBlock.startTime - secondBlock.startTime;
  });

  return sortedBlocks.reduce<string[]>((messages, block, index) => {
    const nextBlock = sortedBlocks[index + 1];

    if (nextBlock && block.endTime > nextBlock.startTime) {
      messages.push(`Los bloques ${block.order} y ${nextBlock.order} estan superpuestos.`);
    }

    return messages;
  }, []);
};

const validateSelectedFonts = (
  project: Project,
  customFonts: CustomFont[],
  fileExists: ((path: string) => boolean) | undefined,
  errors: ExportValidationIssue[]
): void => {
  if (!fileExists) {
    return;
  }

  const selectedFontNames = [
    project.subtitleStyle.fontOriginal,
    project.subtitleStyle.fontTranslation
  ];

  customFonts
    .filter((font) => selectedFontNames.includes(font.name))
    .forEach((font) => {
      if (!fileExists(font.path)) {
        addIssue(errors, 'error', `La fuente "${font.name}" ya no existe o fue movida.`);
      }
    });
};

export const validateProjectBeforeExport = ({
  project,
  outputName,
  outputDirectory,
  mode,
  customFonts,
  fileExists
}: ValidateProjectBeforeExportInput): ExportValidationResult => {
  const errors: ExportValidationIssue[] = [];
  const warnings: ExportValidationIssue[] = [];
  const shouldExportVideo = mode === 'MP4' || mode === 'MP4_AND_MP3';

  if (!project) {
    addIssue(errors, 'error', 'No existe un proyecto activo.');
    return { errors, warnings, canExport: false };
  }

  if (!project.audioPath && !project.videoPath) {
    addIssue(errors, 'error', 'Carga un audio o video antes de exportar.');
  }

  if (shouldExportVideo && !project.videoPath && !project.backgroundPath) {
    addIssue(errors, 'error', 'Falta imagen de fondo para exportar video usando solo audio.');
  }

  if (!project.videoFormat) {
    addIssue(errors, 'error', 'Selecciona un formato de video.');
  }

  if (!outputDirectory.trim()) {
    addIssue(errors, 'error', 'Selecciona una carpeta de salida.');
  }

  if (!outputName.trim()) {
    addIssue(errors, 'error', 'Escribe un nombre para el video.');
  }

  const enabledBlocks = getEnabledBlocks(project);
  const missingBlocksSeverity = shouldExportVideo ? 'error' : 'warning';

  if (project.subtitleBlocks.length === 0) {
    addIssue(
      shouldExportVideo ? errors : warnings,
      missingBlocksSeverity,
      'No hay bloques de subtitulos creados.'
    );
  }

  if (enabledBlocks.length === 0) {
    addIssue(
      shouldExportVideo ? errors : warnings,
      missingBlocksSeverity,
      'No hay bloques de subtitulos activos.'
    );
  }

  const blocksWithoutOriginalText = enabledBlocks.filter(
    (block) => !block.originalText.trim()
  );
  blocksWithoutOriginalText.forEach((block) => {
    addIssue(
      shouldExportVideo ? errors : warnings,
      shouldExportVideo ? 'error' : 'warning',
      `El bloque ${block.order} no tiene texto original.`
    );
  });

  enabledBlocks
    .filter((block) => !hasValidTime(block))
    .forEach((block) => {
      addIssue(errors, 'error', `El bloque ${block.order} tiene tiempos invalidos.`);
    });

  detectOverlapMessages(enabledBlocks.filter(hasValidTime)).forEach((message) => {
    addIssue(errors, 'error', message);
  });

  const bilingualModeEnabled = enabledBlocks.some((block) => block.translatedText.trim());
  if (bilingualModeEnabled) {
    enabledBlocks
      .filter((block) => !block.translatedText.trim())
      .forEach((block) => {
        addIssue(
          shouldExportVideo ? errors : warnings,
          shouldExportVideo ? 'error' : 'warning',
          `La traduccion esta incompleta en el bloque ${block.order}.`
        );
      });
  }

  validateSelectedFonts(project, customFonts, fileExists, errors);

  return {
    errors,
    warnings,
    canExport: errors.length === 0
  };
};

export const validateExportRequestBeforeExport = (
  request: ExportValidationRequest,
  fileExists?: (path: string) => boolean
): ExportValidationResult => {
  return validateProjectBeforeExport({
    project: request.project,
    outputName: request.outputName,
    outputDirectory: request.outputDirectory,
    mode: request.mode,
    customFonts: request.customFonts,
    fileExists
  });
};
