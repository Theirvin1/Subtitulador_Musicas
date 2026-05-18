export type AutomaticTimingMode = 'fixed-0-5' | 'fixed-1' | 'fixed-2' | 'distribute' | 'manual';

export type SubtitleTiming = {
  startTime: number;
  endTime: number;
};

type AssignSubtitleTimingsInput = {
  blockCount: number;
  mode: AutomaticTimingMode;
  totalDuration?: number;
};

const FIXED_DURATIONS: Partial<Record<AutomaticTimingMode, number>> = {
  'fixed-0-5': 0.5,
  'fixed-1': 1,
  'fixed-2': 2
};

const clampDuration = (duration: number): number => Math.max(0, duration);

export const getTimingModeLabel = (mode: AutomaticTimingMode): string => {
  const labels: Record<AutomaticTimingMode, string> = {
    'fixed-0-5': '0.5 segundos por bloque',
    'fixed-1': '1 segundo por bloque',
    'fixed-2': '2 segundos por bloque',
    distribute: 'Distribuir en toda la duracion',
    manual: 'Manual'
  };

  return labels[mode];
};

export const getTimingFallbackMessage = (
  mode: AutomaticTimingMode,
  totalDuration?: number
): string | null => {
  if (mode === 'distribute' && (!totalDuration || totalDuration <= 0)) {
    return 'No se detecto duracion del audio/video. Se usaran 2 segundos por bloque.';
  }

  return null;
};

export const assignSubtitleTimings = ({
  blockCount,
  mode,
  totalDuration
}: AssignSubtitleTimingsInput): SubtitleTiming[] => {
  if (blockCount <= 0) {
    return [];
  }

  const blockDuration =
    mode === 'distribute' && totalDuration && totalDuration > 0
      ? totalDuration / blockCount
      : FIXED_DURATIONS[mode] ?? 2;

  const safeDuration = Math.max(0.001, clampDuration(blockDuration));

  return Array.from({ length: blockCount }, (_item, index) => {
    const startTime = Math.max(0, index * safeDuration);
    const endTime = Math.max(startTime + 0.001, startTime + safeDuration);

    return {
      startTime,
      endTime
    };
  });
};
