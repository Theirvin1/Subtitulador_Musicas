import type { SubtitleBlock } from '../../shared/types/project';
import type { SubtitleOverlap } from '../services/subtitleBlocks';
import { SubtitleBlockCard } from './SubtitleBlockCard';

type SubtitleBlocksPanelProps = {
  blocks: SubtitleBlock[];
  activeBlockId?: string;
  durationValue: number;
  overlapWarnings: SubtitleOverlap[];
  selectedBlockIds: string[];
  onAddText: () => void;
  onSelectBlock: (blockId: string, selected: boolean) => void;
  onSelectAllBlocks: () => void;
  onClearSelection: () => void;
  onChangeBlock: (blockId: string, updates: Partial<SubtitleBlock>) => void;
  onShiftBlockTime: (blockId: string, offset: number) => void;
  onShiftAllBlocks: (offset: number) => void;
  onShiftSelectedBlocks: (offset: number) => void;
  onChangeDurationValue: (duration: number) => void;
  onApplyDurationToAll: () => void;
  onGoToActiveBlock: () => void;
  onPlayFromCurrentBlock: () => void;
  onPlayCurrentBlockOnly: () => void;
  onSplitBlock: (blockId: string) => void;
  onJoinWithNext: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleBlock: (blockId: string) => void;
};

export const SubtitleBlocksPanel = ({
  blocks,
  activeBlockId,
  durationValue,
  overlapWarnings,
  selectedBlockIds,
  onAddText,
  onSelectBlock,
  onSelectAllBlocks,
  onClearSelection,
  onChangeBlock,
  onShiftBlockTime,
  onShiftAllBlocks,
  onShiftSelectedBlocks,
  onChangeDurationValue,
  onApplyDurationToAll,
  onGoToActiveBlock,
  onPlayFromCurrentBlock,
  onPlayCurrentBlockOnly,
  onSplitBlock,
  onJoinWithNext,
  onDeleteBlock,
  onToggleBlock
}: SubtitleBlocksPanelProps): JSX.Element => {
  const selectedCount = selectedBlockIds.length;
  const overlappingBlockIds = new Set(
    overlapWarnings.flatMap((overlap) => [overlap.currentId, overlap.nextId])
  );

  return (
    <section className="subtitle-blocks" aria-label="Bloques de subtitulos">
      <div className="subtitle-blocks__header">
        <div>
          <p>Bloques de subtitulos</p>
          <span>
            {blocks.length} bloques de letra original · {selectedCount} seleccionados
          </span>
        </div>
        <button type="button" onClick={onAddText}>
          Agregar texto
        </button>
      </div>

      <section className="sync-tools" aria-label="Herramientas de sincronizacion">
        <div className="sync-tools__header">
          <div>
            <h3>Herramientas de sincronizacion</h3>
            <span>Ajustes rapidos para tiempos y reproduccion por bloque</span>
          </div>
          <div className="sync-tools__selection">
            <button type="button" disabled={blocks.length === 0} onClick={onSelectAllBlocks}>
              Seleccionar todos
            </button>
            <button type="button" disabled={selectedCount === 0} onClick={onClearSelection}>
              Limpiar
            </button>
          </div>
        </div>

        <div className="sync-tools__grid">
          <div className="sync-tools__group">
            <span>Mover todos</span>
            <button type="button" disabled={blocks.length === 0} onClick={() => onShiftAllBlocks(0.5)}>
              +0.5s
            </button>
            <button type="button" disabled={blocks.length === 0} onClick={() => onShiftAllBlocks(-0.5)}>
              -0.5s
            </button>
          </div>

          <div className="sync-tools__group">
            <span>Mover seleccionados</span>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => onShiftSelectedBlocks(0.5)}
            >
              +0.5s
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => onShiftSelectedBlocks(-0.5)}
            >
              -0.5s
            </button>
          </div>

          <label className="sync-tools__duration">
            <span>Duracion de todos</span>
            <input
              type="number"
              min="0.001"
              step="0.1"
              value={durationValue}
              onChange={(event) => onChangeDurationValue(Number(event.target.value))}
            />
            <button type="button" disabled={blocks.length === 0} onClick={onApplyDurationToAll}>
              Ajustar
            </button>
          </label>

          <div className="sync-tools__group">
            <span>Reproduccion</span>
            <button type="button" disabled={!activeBlockId} onClick={onGoToActiveBlock}>
              Ir al bloque activo
            </button>
            <button type="button" disabled={!activeBlockId} onClick={onPlayFromCurrentBlock}>
              Reproducir desde inicio
            </button>
            <button type="button" disabled={!activeBlockId} onClick={onPlayCurrentBlockOnly}>
              Reproducir solo bloque actual
            </button>
          </div>
        </div>

        {overlapWarnings.length > 0 ? (
          <div className="sync-tools__warnings" role="alert">
            <strong>Advertencia: hay bloques superpuestos.</strong>
            <span>
              {overlapWarnings
                .map((overlap) => `${overlap.currentOrder}-${overlap.nextOrder}`)
                .join(', ')}
            </span>
          </div>
        ) : null}
      </section>

      {blocks.length === 0 ? (
        <div className="subtitle-blocks__empty">Agrega la letra original para crear bloques.</div>
      ) : (
        <div className="subtitle-blocks__list">
          {blocks.map((block, index) => (
            <SubtitleBlockCard
              key={block.id}
              block={block}
              canJoinNext={index < blocks.length - 1}
              isActive={block.id === activeBlockId}
              isOverlapping={overlappingBlockIds.has(block.id)}
              isSelected={selectedBlockIds.includes(block.id)}
              onSelect={onSelectBlock}
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
