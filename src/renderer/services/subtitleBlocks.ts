import type { SubtitleBlock } from '../../shared/types/project';

export const MIN_BLOCK_DURATION = 0.001;

export const clampTime = (time: number): number => {
  return Number.isFinite(time) ? Math.max(0, time) : 0;
};

export const normalizeTimeRange = (startTime: number, endTime: number): Pick<
  SubtitleBlock,
  'startTime' | 'endTime'
> => {
  const safeStartTime = clampTime(startTime);
  const safeEndTime = Math.max(clampTime(endTime), safeStartTime + MIN_BLOCK_DURATION);

  return {
    startTime: safeStartTime,
    endTime: safeEndTime
  };
};

export const reorderSubtitleBlocks = (blocks: SubtitleBlock[]): SubtitleBlock[] => {
  return blocks.map((block, index) => ({
    ...block,
    order: index + 1
  }));
};

export const shiftSubtitleBlock = (block: SubtitleBlock, offset: number): SubtitleBlock => {
  const duration = Math.max(MIN_BLOCK_DURATION, block.endTime - block.startTime);
  const startTime = clampTime(block.startTime + offset);

  return {
    ...block,
    startTime,
    endTime: startTime + duration
  };
};
