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

export type SubtitleOverlap = {
  currentId: string;
  nextId: string;
  currentOrder: number;
  nextOrder: number;
};

export const detectSubtitleOverlaps = (blocks: SubtitleBlock[]): SubtitleOverlap[] => {
  const sortedBlocks = [...blocks]
    .filter((block) => block.enabled)
    .sort((firstBlock, secondBlock) => {
      if (firstBlock.startTime === secondBlock.startTime) {
        return firstBlock.order - secondBlock.order;
      }

      return firstBlock.startTime - secondBlock.startTime;
    });

  return sortedBlocks.reduce<SubtitleOverlap[]>((overlaps, block, index) => {
    const nextBlock = sortedBlocks[index + 1];

    if (nextBlock && block.endTime > nextBlock.startTime) {
      overlaps.push({
        currentId: block.id,
        nextId: nextBlock.id,
        currentOrder: block.order,
        nextOrder: nextBlock.order
      });
    }

    return overlaps;
  }, []);
};

export const setSubtitleBlockDuration = (
  block: SubtitleBlock,
  duration: number
): SubtitleBlock => {
  const safeDuration = Math.max(MIN_BLOCK_DURATION, clampTime(duration));

  return {
    ...block,
    endTime: block.startTime + safeDuration
  };
};
