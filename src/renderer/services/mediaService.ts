import type { MediaFile, MediaKind } from '../../shared/types/media';

export const mediaService = {
  selectFile(kind: MediaKind): Promise<MediaFile | null> {
    return window.subMusic.media.selectFile(kind);
  }
};
