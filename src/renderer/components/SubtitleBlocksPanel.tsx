import type { SubtitleBlock } from '../../shared/types/project';
import { SubtitleBlockCard } from './SubtitleBlockCard';

type SubtitleBlocksPanelProps = {
  blocks: SubtitleBlock[];
  onAddText: () => void;
  onChangeBlock: (blockId: string, updates: Partial<SubtitleBlock>) => void;
  onShiftBlockTime: (blockId: string, offset: number) => void;
  onSplitBlock: (blockId: string) => void;
  onJoinWithNext: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleBlock: (blockId: string) => void;
};

export const SubtitleBlocksPanel = ({
  blocks,
  onAddText,
  onChangeBlock,
  onShiftBlockTime,
  onSplitBlock,
  onJoinWithNext,
  onDeleteBlock,
  onToggleBlock
}: SubtitleBlocksPanelProps): JSX.Element => {
  return (
    <section className="subtitle-blocks" aria-label="Bloques de subtitulos">
      <div className="subtitle-blocks__header">
        <div>
          <p>Bloques de subtitulos</p>
          <span>{blocks.length} bloques de letra original</span>
        </div>
        <button type="button" onClick={onAddText}>
          Agregar texto
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="subtitle-blocks__empty">Agrega la letra original para crear bloques.</div>
      ) : (
        <div className="subtitle-blocks__list">
          {blocks.map((block, index) => (
            <SubtitleBlockCard
              key={block.id}
              block={block}
              canJoinNext={index < blocks.length - 1}
              onChange={onChangeBlock}
              onShiftTime={onShiftBlockTime}
              onSplit={onSplitBlock}
              onJoinNext={onJoinWithNext}
              onDelete={onDeleteBlock}
              onToggleEnabled={onToggleBlock}
            />
          ))}
        </div>
      )}
    </section>
  );
};
