import { dialog } from 'electron';
import { basename, extname } from 'node:path';
import type { CustomFont } from '../../shared/types/font';

const createFontName = (fontPath: string): string => {
  return basename(fontPath, extname(fontPath)).replace(/[_-]+/g, ' ').trim();
};

export const selectFontFile = async (): Promise<Pick<CustomFont, 'name' | 'path'> | null> => {
  const result = await dialog.showOpenDialog({
    title: 'Seleccionar fuente personalizada',
    properties: ['openFile'],
    filters: [
      {
        name: 'Fuentes',
        extensions: ['ttf', 'otf']
      }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const [fontPath] = result.filePaths;
  const extension = extname(fontPath).replace('.', '').toLowerCase();

  if (extension !== 'ttf' && extension !== 'otf') {
    throw new Error('Solo se permiten fuentes .ttf o .otf.');
  }

  return {
    name: createFontName(fontPath),
    path: fontPath
  };
};
