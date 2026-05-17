import type { SubtitleBlock } from '../../shared/types/project';

type SubtitleBlocksPanelProps = {
  blocks: SubtitleBlock[];
  onAddText: () => void;
  onUpdateBlock: (blockId: string, text: string) => void;
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds % 1) * 1000);

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(
    2,
    '0'
  )}.${String(milliseconds).padStart(3, '0')}`;
};

export const SubtitleBlocksPanel = ({
  blocks,
  onAddText,
  onUpdateBlock
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
          {blocks.map((block) => (
            <article key={block.id} className="subtitle-block">
              <div className="subtitle-block__index">{String(block.order).padStart(2, '0')}</div>
              <div className="subtitle-block__time">
                <span>{formatTime(block.startTime)}</span>
                <span>{formatTime(block.endTime)}</span>
              </div>
              <div className="subtitle-block__text">
                <textarea
                  value={block.originalText}
                  aria-label={`Texto original bloque ${block.order}`}
                  onChange={(event) => onUpdateBlock(block.id, event.target.value)}
                />
                <span>{block.translatedText || 'Traduccion pendiente'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
