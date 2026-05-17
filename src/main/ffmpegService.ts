import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { dialog } from 'electron';
import type { ExportRequest, ExportResult } from '../shared/types/export';
import type { Project, SubtitleBlock, SubtitleStyle } from '../shared/types/project';

const FFMPEG_BINARY = 'ffmpeg';

const runFfmpeg = (args: string[], cwd?: string): Promise<void> => {
  return new Promise((resolveProcess, rejectProcess) => {
    const ffmpeg = spawn(FFMPEG_BINARY, args, {
      cwd,
      windowsHide: true
    });
    const output: string[] = [];

    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      output.push(chunk.toString());
    });

    ffmpeg.on('error', rejectProcess);
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolveProcess();
        return;
      }

      rejectProcess(
        new Error(output.join('').trim() || `FFmpeg finalizo con codigo ${code ?? 'desconocido'}`)
      );
    });
  });
};

export const checkFfmpegAvailable = async (): Promise<boolean> => {
  try {
    await runFfmpeg(['-version']);
    return true;
  } catch {
    return false;
  }
};

export const selectOutputDirectory = async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });

  return result.canceled ? null : result.filePaths[0] ?? null;
};

const formatAssTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const centiseconds = Math.floor((safeSeconds - Math.floor(safeSeconds)) * 100);

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(
    2,
    '0'
  )}.${String(centiseconds).padStart(2, '0')}`;
};

const escapeAssText = (text: string): string => {
  return text.replace(/[{}]/g, '').replace(/\r?\n/g, '\\N');
};

const hexToAssColor = (color: string): string => {
  const normalized = color.replace('#', '').padEnd(6, 'f').slice(0, 6);
  const red = normalized.slice(0, 2);
  const green = normalized.slice(2, 4);
  const blue = normalized.slice(4, 6);

  return `&H00${blue}${green}${red}`;
};

const createAssDialogue = (
  block: SubtitleBlock,
  style: SubtitleStyle,
  line: 'Original' | 'Translation'
): string => {
  const isOriginal = line === 'Original';
  const x = Math.round(isOriginal ? style.xOriginal : style.xTranslation);
  const y = Math.round(isOriginal ? style.yOriginal : style.yTranslation);
  const text = isOriginal ? block.originalText : block.translatedText;

  return [
    'Dialogue: 0',
    formatAssTime(block.startTime),
    formatAssTime(block.endTime),
    line,
    '',
    '0',
    '0',
    '0',
    '',
    `{\\pos(${x},${y})}${escapeAssText(text)}`
  ].join(',');
};

const createAssFile = (project: Project, blocks: SubtitleBlock[]): string => {
  const style = project.subtitleStyle;
  const shadow = style.shadow ? Math.max(1, style.borderSize) : 0;
  const originalColor = hexToAssColor(style.colorOriginal);
  const translationColor = hexToAssColor(style.colorTranslation);
  const styleLine = (
    name: string,
    font: string,
    size: number,
    color: string
  ): string =>
    [
      `Style: ${name}`,
      font,
      Math.round(size),
      color,
      '&H000000FF',
      '&H00000000',
      '&H99000000',
      '1',
      '0',
      '0',
      '0',
      '100',
      '100',
      '0',
      '0',
      '1',
      Math.max(0, style.borderSize),
      shadow,
      '2',
      '10',
      '10',
      '10',
      '1'
    ].join(',');

  const dialogues = blocks.flatMap((block) => {
    const lines = [createAssDialogue(block, style, 'Original')];

    if (block.translatedText.trim()) {
      lines.push(createAssDialogue(block, style, 'Translation'));
    }

    return lines;
  });

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${project.width}`,
    `PlayResY: ${project.height}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    styleLine('Original', style.fontOriginal, style.sizeOriginal, originalColor),
    styleLine('Translation', style.fontTranslation, style.sizeTranslation, translationColor),
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...dialogues
  ].join('\n');
};

const sanitizeOutputName = (name: string): string => {
  return name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
};

const validateExportRequest = (request: unknown): ExportRequest => {
  if (!request || typeof request !== 'object') {
    throw new Error('Solicitud de exportacion invalida.');
  }

  const exportRequest = request as ExportRequest;
  const project = exportRequest.project;
  const blocks = project?.subtitleBlocks ?? [];

  if (!project || typeof project !== 'object') {
    throw new Error('Proyecto invalido.');
  }

  if (!project.videoPath && !project.audioPath) {
    throw new Error('Carga un audio o video antes de exportar.');
  }

  if (!project.videoPath && !project.backgroundPath) {
    throw new Error('Carga una imagen de fondo para exportar solo con audio.');
  }

  if (!Array.isArray(blocks) || blocks.filter((block) => block.enabled).length === 0) {
    throw new Error('Agrega al menos un bloque de subtitulos activo.');
  }

  const hasInvalidTiming = blocks
    .filter((block) => block.enabled)
    .some((block) => block.startTime < 0 || block.endTime <= block.startTime);

  if (hasInvalidTiming) {
    throw new Error('Corrige los tiempos de los subtitulos antes de exportar.');
  }

  if (!sanitizeOutputName(exportRequest.outputName)) {
    throw new Error('Escribe un nombre para el video.');
  }

  if (!exportRequest.outputDirectory) {
    throw new Error('Selecciona una carpeta de salida.');
  }

  return {
    ...exportRequest,
    fps: 30,
    quality: 'HIGH',
    outputName: sanitizeOutputName(exportRequest.outputName)
  };
};

const createVideoFilter = (project: Project, assFileName: string): string => {
  return [
    `scale=${project.width}:${project.height}:force_original_aspect_ratio=increase`,
    `crop=${project.width}:${project.height}`,
    'setsar=1',
    `ass=${assFileName}`
  ].join(',');
};

export const exportMp4 = async (request: unknown): Promise<ExportResult> => {
  const exportRequest = validateExportRequest(request);
  const hasFfmpeg = await checkFfmpegAvailable();

  if (!hasFfmpeg) {
    throw new Error('FFmpeg no esta disponible en el sistema.');
  }

  const tempDirectory = join(tmpdir(), `submusic-export-${Date.now()}`);
  const assFileName = 'subtitles.ass';
  const assPath = join(tempDirectory, assFileName);
  const outputPath = resolve(
    exportRequest.outputDirectory,
    `${exportRequest.outputName.replace(/\.mp4$/i, '')}.mp4`
  );
  const enabledBlocks = exportRequest.project.subtitleBlocks.filter((block) => block.enabled);

  mkdirSync(tempDirectory, { recursive: true });
  writeFileSync(assPath, createAssFile(exportRequest.project, enabledBlocks), 'utf8');

  const filter = createVideoFilter(exportRequest.project, assFileName);
  const args = exportRequest.project.videoPath
    ? [
        '-y',
        '-i',
        exportRequest.project.videoPath,
        '-vf',
        filter,
        '-r',
        String(exportRequest.fps),
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-crf',
        '18',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        outputPath
      ]
    : [
        '-y',
        '-loop',
        '1',
        '-framerate',
        String(exportRequest.fps),
        '-i',
        exportRequest.project.backgroundPath ?? '',
        '-i',
        exportRequest.project.audioPath ?? '',
        '-vf',
        filter,
        '-r',
        String(exportRequest.fps),
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-crf',
        '18',
        '-tune',
        'stillimage',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-shortest',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        outputPath
      ];

  try {
    await runFfmpeg(args, tempDirectory);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }

  return { outputPath };
};
