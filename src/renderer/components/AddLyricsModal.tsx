import { FormEvent, useMemo, useState } from 'react';
import { splitSubtitleText, type TextSplitMode } from '../services/subtitleText';

type AddLyricsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlocks: (lines: string[]) => void;
};

const originalLanguages = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'Ingles' },
  { value: 'pt', label: 'Portugues' },
  { value: 'fr', label: 'Frances' },
  { value: 'other', label: 'Otro' }
];

export const AddLyricsModal = ({
  isOpen,
  onClose,
  onCreateBlocks
}: AddLyricsModalProps): JSX.Element | null => {
  const [originalText, setOriginalText] = useState('');
  const [language, setLanguage] = useState(originalLanguages[0].value);
  const [splitMode, setSplitMode] = useState<TextSplitMode>('lines');

  const detectedBlocks = useMemo(() => {
    return splitSubtitleText(originalText, splitMode);
  }, [originalText, splitMode]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (detectedBlocks.length === 0) {
      return;
    }

    onCreateBlocks(detectedBlocks);
    setOriginalText('');
    setLanguage(originalLanguages[0].value);
    setSplitMode('lines');
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="lyrics-modal" role="dialog" aria-modal="true" aria-labelledby="lyrics-title">
        <div className="lyrics-modal__header">
          <div>
            <p id="lyrics-title">Agregar letra / traduccion</p>
            <span>En esta fase se crearan bloques con la letra original</span>
          </div>
          <button type="button" aria-label="Cerrar modal" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="lyrics-modal__form" onSubmit={handleSubmit}>
          <div className="lyrics-modal__controls">
            <label className="lyrics-modal__field">
              <span>Idioma original</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {originalLanguages.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lyrics-modal__field">
              <span>Separar por</span>
              <select
                value={splitMode}
                onChange={(event) => setSplitMode(event.target.value as TextSplitMode)}
              >
                <option value="lines">Lineas</option>
                <option value="paragraphs">Parrafos</option>
              </select>
            </label>

            <div className="lyrics-modal__counter" aria-live="polite">
              <span>Bloques detectados</span>
              <strong>{detectedBlocks.length}</strong>
            </div>
          </div>

          <label className="lyrics-modal__textarea">
            <span>Texto original</span>
            <textarea
              value={originalText}
              placeholder="Pega aqui la letra original de la cancion..."
              onChange={(event) => setOriginalText(event.target.value)}
            />
          </label>

          <div className="lyrics-modal__actions">
            <button type="button" className="lyrics-modal__secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={detectedBlocks.length === 0}>
              Crear bloques
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
