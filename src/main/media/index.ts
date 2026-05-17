import { dialog } from 'electron';
import { basename, extname } from 'node:path';
import type { MediaFile, MediaKind } from '../../shared/types/media';

const MEDIA_FILTERS: Record<MediaKind, Electron.FileFilter> = {
  audio: {
    name: 'Audio',
    extensions: ['mp3', 'wav', 'aac']
  },
  video: {
    name: 'Video',
    extensions: ['mp4', 'mov', 'webm']
  },
  background: {
    name: 'Imagenes',
    extensions: ['jpg', 'jpeg', 'png', 'webp']
  }
};

const isMediaKind = (value: unknown): value is MediaKind => {
  return value === 'audio' || value === 'video' || value === 'background';
};

const isAllowedExtension = (kind: MediaKind, filePath: string): boolean => {
  const extension = extname(filePath).replace('.', '').toLowerCase();
  return MEDIA_FILTERS[kind].extensions.includes(extension);
};

export const selectMediaFile = async (kind: unknown): Promise<MediaFile | null> => {
  if (!isMediaKind(kind)) {
    throw new Error('Invalid media kind.');
  }

  const result = await dialog.showOpenDialog({
    title: 'Seleccionar archivo multimedia',
    properties: ['openFile'],
    filters: [MEDIA_FILTERS[kind]]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const [filePath] = result.filePaths;
  if (!isAllowedExtension(kind, filePath)) {
    throw new Error('File extension is not allowed.');
  }

  return {
    kind,
    path: filePath,
    name: basename(filePath),
    extension: extname(filePath).replace('.', '').toLowerCase()
  };
};
