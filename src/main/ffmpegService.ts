import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { app, dialog } from 'electron';
import type {
  ExportOutputCheckRequest,
  ExportOutputCheckResult,
  ExportQuality,
  ExportRequest,
  ExportResult,
  ExportValidationRequest,
  ExportValidationResult,
  FfmpegAvailability,
  ExtractCoverFrameRequest,
  ExtractCoverFrameResult
} from '../shared/types/export';
import type { CustomFont } from '../shared/types/font';
import type { Project, SubtitleBlock, SubtitleStyle } from '../shared/types/project';
import { validateExportRequestBeforeExport } from '../shared/validation/exportValidation';

const FFMPEG_BINARY = 'ffmpeg';
const LOCAL_FFMPEG_RELATIVE_PATH = join('ffmpeg', 'win', 'ffmpeg.exe');
const DEV_FFMPEG_RELATIVE_PATH = join('resources', 'ffmpeg', 'win', 'ffmpeg.exe');

const QUALITY_SETTINGS: Record<
  ExportQuality,
  { crf: string; preset: string; audioBitrate: string }
> = {
  MEDIUM: { crf: '23', preset: 'medium', audioBitrate: '160k' },
  HIGH: { crf: '18', preset: 'slow', audioBitrate: '192k' },
  MAXIMUM: { crf: '14', preset: 'slower', audioBitrate: '320k' }
};

const runFfmpegBinary = (binaryPath: string, args: string[], cwd?: string): Promise<void> => {
  return new Promise((resolveProcess, rejectProcess) => {
    const ffmpeg = spawn(binaryPath, args, {
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

const getLocalFfmpegPath = (): string => {
  return app.isPackaged
    ? join(process.resourcesPath, LOCAL_FFMPEG_RELATIVE_PATH)
    : resolve(process.cwd(), DEV_FFMPEG_RELATIVE_PATH);
};

const testFfmpegBinary = async (binaryPath: string): Promise<boolean> => {
  try {
    await runFfmpegBinary(binaryPath, ['-version']);
    return true;
  } catch {
    return false;
  }
};

export const checkFfmpegAvailability = async (): Promise<FfmpegAvailability> => {
  const localFfmpegPath = getLocalFfmpegPath();

  if (existsSync(localFfmpegPath) && (await testFfmpegBinary(localFfmpegPath))) {
    console.info(`[SubMusic Studio] FFmpeg local incluido detectado: ${localFfmpegPath}`);
    return {
      available: true,
      source: 'local',
      binaryPath: localFfmpegPath,
      message: 'FFmpeg disponible. La exportacion esta lista.'
    };
  }

  if (await testFfmpegBinary(FFMPEG_BINARY)) {
    console.info('[SubMusic Studio] FFmpeg detectado en PATH del sistema.');
    return {
      available: true,
      source: 'path',
      binaryPath: FFMPEG_BINARY,
      message: 'FFmpeg disponible desde el PATH del sistema. La exportacion esta lista.'
    };
  }

  console.warn(
    `[SubMusic Studio] FFmpeg no detectado. Ruta local revisada: ${localFfmpegPath}`
  );
  return {
    available: false,
    source: 'missing',
    message:
      'No se encontro FFmpeg. Para exportar videos, instala FFmpeg o agrega ffmpeg.exe al PATH. Tambien puedes usar una version de la app que incluya FFmpeg.'
  };
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
  const fadeTag = style.fadeIn || style.fadeOut
    ? `\\fad(${style.fadeIn ? 300 : 0},${style.fadeOut ? 300 : 0})`
    : '';

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
    `{\\pos(${x},${y})${fadeTag}}${escapeAssText(text)}`
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

export const checkExportOutputExists = (request: unknown): ExportOutputCheckResult => {
  if (!request || typeof request !== 'object') {
    return { exists: false, paths: [] };
  }

  const outputRequest = request as ExportOutputCheckRequest;
  const outputStem = sanitizeOutputName(outputRequest.outputName).replace(/\.(mp4|mp3)$/i, '');

  if (!outputStem || !outputRequest.outputDirectory) {
    return { exists: false, paths: [] };
  }

  const exportDirectory = resolve(outputRequest.outputDirectory, outputStem);
  const candidatePaths = [
    outputRequest.mode !== 'MP3_ONLY' ? resolve(exportDirectory, `${outputStem}.mp4`) : '',
    outputRequest.mode !== 'MP4' ? resolve(exportDirectory, `${outputStem}.mp3`) : '',
    resolve(exportDirectory, 'portada.png')
  ].filter(Boolean);
  const existingPaths = candidatePaths.filter((path) => existsSync(path));

  return {
    exists: existingPaths.length > 0,
    paths: existingPaths
  };
};

const getProjectCoverDirectory = (projectId: string): string => {
  return join(app.getPath('userData'), 'covers', sanitizeOutputName(projectId));
};

const isExportQuality = (quality: unknown): quality is ExportQuality => {
  return quality === 'MEDIUM' || quality === 'HIGH' || quality === 'MAXIMUM';
};

const isExportMode = (mode: unknown): mode is ExportRequest['mode'] => {
  return mode === 'MP4' || mode === 'MP4_AND_MP3' || mode === 'MP3_ONLY';
};

const validateExportRequest = (request: unknown): ExportRequest => {
  if (!request || typeof request !== 'object') {
    throw new Error('Solicitud de exportacion invalida.');
  }

  const exportRequest = request as ExportRequest;
  const project = exportRequest.project;
  const blocks = project?.subtitleBlocks ?? [];
  const mode = isExportMode(exportRequest.mode) ? exportRequest.mode : 'MP4';
  const shouldExportMp4 = mode === 'MP4' || mode === 'MP4_AND_MP3';

  if (!project || typeof project !== 'object') {
    throw new Error('Proyecto invalido.');
  }

  if (!project.videoPath && !project.audioPath) {
    throw new Error('Carga un audio o video antes de exportar.');
  }

  if (shouldExportMp4 && !project.videoPath && !project.backgroundPath) {
    throw new Error('Carga una imagen de fondo para exportar solo con audio.');
  }

  if (
    shouldExportMp4 &&
    (!Array.isArray(blocks) || blocks.filter((block) => block.enabled).length === 0)
  ) {
    throw new Error('Agrega al menos un bloque de subtitulos activo.');
  }

  const hasInvalidTiming = shouldExportMp4 && blocks
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

  const validation = validateExportRequestBeforeExport(exportRequest, existsSync);
  if (!validation.canExport) {
    throw new Error(
      ['No se puede exportar todavia:', ...validation.errors.map((issue) => `- ${issue.message}`)]
        .join('\n')
    );
  }

  return {
    ...exportRequest,
    fps: 30,
    quality: isExportQuality(exportRequest.quality) ? exportRequest.quality : 'HIGH',
    mode,
    outputName: sanitizeOutputName(exportRequest.outputName)
  };
};

export const validateProjectBeforeExport = (
  request: unknown
): ExportValidationResult => {
  if (!request || typeof request !== 'object') {
    return {
      errors: [{ severity: 'error', message: 'Solicitud de validacion invalida.' }],
      warnings: [],
      canExport: false
    };
  }

  return validateExportRequestBeforeExport(request as ExportValidationRequest, existsSync);
};

const createVideoFilter = (project: Project, assFileName: string): string => {
  const fontFilter = project.subtitleStyle.fontOriginal || project.subtitleStyle.fontTranslation
    ? ':fontsdir=fonts'
    : '';

  return [
    `scale=${project.width}:${project.height}:force_original_aspect_ratio=increase`,
    `crop=${project.width}:${project.height}`,
    'setsar=1',
    `ass=${assFileName}${fontFilter}`
  ].join(',');
};

const validateCustomFonts = (project: Project, customFonts: CustomFont[]): void => {
  const selectedFonts = [project.subtitleStyle.fontOriginal, project.subtitleStyle.fontTranslation];

  customFonts
    .filter((font) => selectedFonts.includes(font.name))
    .forEach((font) => {
      if (!existsSync(font.path)) {
        throw new Error(`La fuente "${font.name}" no existe o fue movida: ${font.path}`);
      }
    });
};

const copyCustomFontsToTemp = (customFonts: CustomFont[], tempDirectory: string): void => {
  const fontsDirectory = join(tempDirectory, 'fonts');
  mkdirSync(fontsDirectory, { recursive: true });

  customFonts.forEach((font) => {
    if (existsSync(font.path)) {
      copyFileSync(font.path, join(fontsDirectory, basename(font.path)));
    }
  });
};

const writeExportCover = async (
  coverPath: string,
  exportDirectory: string,
  ffmpegBinaryPath: string
): Promise<string> => {
  const outputCoverPath = resolve(exportDirectory, 'portada.png');

  if (coverPath.toLowerCase().endsWith('.png')) {
    copyFileSync(coverPath, outputCoverPath);
    return outputCoverPath;
  }

  await runFfmpegBinary(ffmpegBinaryPath, [
    '-y',
    '-i',
    coverPath,
    '-frames:v',
    '1',
    outputCoverPath
  ]);
  return outputCoverPath;
};

export const extractCoverFrame = async (
  request: unknown
): Promise<ExtractCoverFrameResult> => {
  if (!request || typeof request !== 'object') {
    throw new Error('Solicitud de portada invalida.');
  }

  const frameRequest = request as ExtractCoverFrameRequest;
  if (!frameRequest.projectId || !frameRequest.videoPath) {
    throw new Error('Carga un video antes de seleccionar un frame como portada.');
  }

  const ffmpegAvailability = await checkFfmpegAvailability();
  if (!ffmpegAvailability.available || !ffmpegAvailability.binaryPath) {
    throw new Error(ffmpegAvailability.message);
  }

  const coverDirectory = getProjectCoverDirectory(frameRequest.projectId);
  mkdirSync(coverDirectory, { recursive: true });

  const coverPath = join(coverDirectory, `cover-${Date.now()}.png`);
  await runFfmpegBinary(
    ffmpegAvailability.binaryPath,
    [
      '-y',
      '-ss',
      String(Math.max(0, frameRequest.currentTime)),
      '-i',
      frameRequest.videoPath,
      '-frames:v',
      '1',
      coverPath
    ]
  );

  return { coverPath };
};

export const exportMp4 = async (request: unknown): Promise<ExportResult> => {
  const exportRequest = validateExportRequest(request);
  const ffmpegAvailability = await checkFfmpegAvailability();

  if (!ffmpegAvailability.available || !ffmpegAvailability.binaryPath) {
    throw new Error(ffmpegAvailability.message);
  }

  validateCustomFonts(exportRequest.project, exportRequest.customFonts ?? []);

  const tempDirectory = join(tmpdir(), `submusic-export-${Date.now()}`);
  const assFileName = 'subtitles.ass';
  const assPath = join(tempDirectory, assFileName);
  const outputStem = exportRequest.outputName.replace(/\.(mp4|mp3)$/i, '');
  const exportDirectory = resolve(
    exportRequest.outputDirectory,
    outputStem
  );
  const mp4Path = resolve(
    exportDirectory,
    `${outputStem}.mp4`
  );
  const mp3Path = resolve(
    exportDirectory,
    `${outputStem}.mp3`
  );
  let coverPath: string | undefined;
  const enabledBlocks = exportRequest.project.subtitleBlocks.filter((block) => block.enabled);
  const quality = QUALITY_SETTINGS[exportRequest.quality];
  const shouldExportMp4 = exportRequest.mode === 'MP4' || exportRequest.mode === 'MP4_AND_MP3';
  const shouldExportMp3 =
    exportRequest.mode === 'MP3_ONLY' || exportRequest.mode === 'MP4_AND_MP3';

  mkdirSync(tempDirectory, { recursive: true });
  mkdirSync(exportDirectory, { recursive: true });
  copyCustomFontsToTemp(exportRequest.customFonts ?? [], tempDirectory);

  if (shouldExportMp4) {
    writeFileSync(assPath, createAssFile(exportRequest.project, enabledBlocks), 'utf8');
  }

  const filter = createVideoFilter(exportRequest.project, assFileName);
  const mp4Args = exportRequest.project.videoPath
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
        quality.preset,
        '-crf',
        quality.crf,
        '-c:a',
        'aac',
        '-b:a',
        quality.audioBitrate,
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        mp4Path
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
        quality.preset,
        '-crf',
        quality.crf,
        '-tune',
        'stillimage',
        '-c:a',
        'aac',
        '-b:a',
        quality.audioBitrate,
        '-shortest',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        mp4Path
      ];
  const audioSource = exportRequest.project.videoPath ?? exportRequest.project.audioPath;
  const mp3Args = [
    '-y',
    '-i',
    audioSource ?? '',
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    quality.audioBitrate,
    mp3Path
  ];

  try {
    if (shouldExportMp4) {
      await runFfmpegBinary(ffmpegAvailability.binaryPath, mp4Args, tempDirectory);
    }

    if (shouldExportMp3) {
      await runFfmpegBinary(ffmpegAvailability.binaryPath, mp3Args);
    }

    if (exportRequest.project.coverPath) {
      coverPath = await writeExportCover(
        exportRequest.project.coverPath,
        exportDirectory,
        ffmpegAvailability.binaryPath
      );
    }
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }

  return {
    outputDirectory: exportDirectory,
    mp4Path: shouldExportMp4 ? mp4Path : undefined,
    mp3Path: shouldExportMp3 ? mp3Path : undefined,
    coverPath
  };
};
