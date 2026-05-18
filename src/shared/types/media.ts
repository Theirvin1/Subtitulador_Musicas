export type MediaKind = 'audio' | 'video' | 'background' | 'cover';

export type MediaFile = {
  kind: MediaKind;
  path: string;
  name: string;
  extension: string;
};
