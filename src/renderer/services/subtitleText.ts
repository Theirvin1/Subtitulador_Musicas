export type TextSplitMode = 'lines' | 'paragraphs';

const normalizeLine = (line: string): string => line.trim();

export const splitSubtitleText = (text: string, mode: TextSplitMode): string[] => {
  if (mode === 'paragraphs') {
    return text
      .split(/\n\s*\n/g)
      .map((paragraph) =>
        paragraph
          .split(/\n/g)
          .map(normalizeLine)
          .filter(Boolean)
          .join(' ')
      )
      .filter(Boolean);
  }

  return text
    .split(/\n/g)
    .map(normalizeLine)
    .filter(Boolean);
};
