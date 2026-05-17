import type { SubtitleBlock } from '../../shared/types/project';

type SubtitleBlockCardProps = {
  block: SubtitleBlock;
  canJoinNext: boolean;
  onChange: (blockId: string, updates: Partial<SubtitleBlock>) => void;
  onShiftTime: (blockId: string, offset: number) => void;
  onSplit: (blockId: string) => void;
  onJoinNext: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onToggleEnabled: (blockId: string) => void;
};

const toTimeInputValue = (time: number): string => {
  return Number.isFinite(time) ? String(Number(time.toFixed(3))) : '0';
};

const parseTimeInputValue = (value: string): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const SubtitleBlockCard = ({
  block,
  canJoinNext,
  onChange,
  onShiftTime,
  onSplit,
  onJoinNext,
  onDelete,
  onToggleEnabled
}: SubtitleBlockCardProps): JSX.Element => {
  return (
    <article className={block.enabled ? 'subtitle-card' : 'subtitle-card is-disabled'}>
      <div className="subtitle-card__header">
        <div className="subtitle-card__index">
          <span>Bloque</span>
          <strong>{String(block.order).padStart(2, '0')}</strong>
        </div>
        <button type="button" onClick={() => onToggleEnabled(block.id)}>
          {block.enabled ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      <div className="subtitle-card__time-grid">
        <label>
          <span>Inicio</span>
          <input
            type="number"
            min="0"
            step="0.001"
            value={toTimeInputValue(block.startTime)}
            onChange={(event) =>
              onChange(block.id, { startTime: parseTimeInputValue(event.target.value) })
            }
          />
        </label>
        <label>
          <span>Fin</span>
          <input
            type="number"
            min="0"
            step="0.001"
            value={toTimeInputValue(block.endTime)}
            onChange={(event) =>
              onChange(block.id, { endTime: parseTimeInputValue(event.target.value) })
            }
          />
        </label>
      </div>

      <label className="subtitle-card__textarea">
        <span>Texto original</span>
        <textarea
          value={block.originalText}
          onChange={(event) => onChange(block.id, { originalText: event.target.value })}
        />
      </label>

      <label className="subtitle-card__textarea">
        <span>Texto traducido</span>
        <textarea
          value={block.translatedText}
          placeholder="Traduccion pendiente"
          onChange={(event) => onChange(block.id, { translatedText: event.target.value })}
        />
      </label>

      <div className="subtitle-card__actions" aria-label={`Acciones del bloque ${block.order}`}>
        <button type="button" onClick={() => onShiftTime(block.id, 0.5)}>
          +0.5s
        </button>
        <button type="button" onClick={() => onShiftTime(block.id, -0.5)}>
          -0.5s
        </button>
        <button type="button" onClick={() => onSplit(block.id)}>
          Dividir
        </button>
        <button type="button" disabled={!canJoinNext} onClick={() => onJoinNext(block.id)}>
          Unir con siguiente
        </button>
        <button type="button" onClick={() => onDelete(block.id)}>
          Eliminar
        </button>
      </div>
    </article>
  );
};
