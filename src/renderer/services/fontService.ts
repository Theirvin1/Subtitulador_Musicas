import type { CustomFont } from '../../shared/types/font';

export const fontService = {
  list(): Promise<CustomFont[]> {
    return window.subMusic.fonts.list();
  },
  add(): Promise<CustomFont | null> {
    return window.subMusic.fonts.add();
  }
};
