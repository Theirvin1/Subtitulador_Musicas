const subtitleBlocks = [
  {
    id: '01',
    start: '00:12.400',
    end: '00:16.800',
    original: 'I hear the city calling out my name',
    translation: 'Escucho a la ciudad llamando mi nombre'
  },
  {
    id: '02',
    start: '00:17.000',
    end: '00:21.200',
    original: 'Every light becomes a melody',
    translation: 'Cada luz se convierte en una melodia'
  },
  {
    id: '03',
    start: '00:21.600',
    end: '00:25.900',
    original: 'We keep moving through the night',
    translation: 'Seguimos avanzando por la noche'
  }
];

export const SubtitleBlocksPanel = (): JSX.Element => {
  return (
    <section className="subtitle-blocks" aria-label="Bloques de subtitulos">
      <div className="subtitle-blocks__header">
        <div>
          <p>Bloques de subtitulos</p>
          <span>Letra original y traduccion sincronizadas</span>
        </div>
        <button type="button">Agregar bloque</button>
      </div>

      <div className="subtitle-blocks__list">
        {subtitleBlocks.map((block) => (
          <article key={block.id} className="subtitle-block">
            <div className="subtitle-block__index">{block.id}</div>
            <div className="subtitle-block__time">
              <span>{block.start}</span>
              <span>{block.end}</span>
            </div>
            <div className="subtitle-block__text">
              <strong>{block.original}</strong>
              <span>{block.translation}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
