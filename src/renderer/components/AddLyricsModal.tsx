import { FormEvent, useMemo, useState } from 'react';
import { splitSubtitleText, type TextSplitMode } from '../services/subtitleText';
import {
  getTimingFallbackMessage,
  getTimingModeLabel,
  type AutomaticTimingMode
} from '../services/subtitleTiming';

type AddLyricsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mediaDuration?: number;
  existingOriginalLines: string[];
  onCreateBlocks: (
    lines: string[],
    timingMode: AutomaticTimingMode,
    translations?: string[]
  ) => void;
  onApplyTranslation: (translations: string[]) => void;
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
  mediaDuration,
  existingOriginalLines,
  onCreateBlocks,
  onApplyTranslation
}: AddLyricsModalProps): JSX.Element | null => {
  const [originalText, setOriginalText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [language, setLanguage] = useState(originalLanguages[0].value);
  const [splitMode, setSplitMode] = useState<TextSplitMode>('lines');
  const [translationSplitMode, setTranslationSplitMode] = useState<TextSplitMode>('lines');
  const [timingMode, setTimingMode] = useState<AutomaticTimingMode>('distribute');
  const [validationError, setValidationError] = useState('');
  const hasExistingBlocks = existingOriginalLines.length > 0;

  const detectedOriginalBlocks = useMemo(() => {
    if (hasExistingBlocks) {
      return existingOriginalLines;
    }

    return splitSubtitleText(originalText, splitMode);
  }, [existingOriginalLines, hasExistingBlocks, originalText, splitMode]);

  const detectedTranslationBlocks = useMemo(() => {
    return splitSubtitleText(translationText, translationSplitMode);
  }, [translationText, translationSplitMode]);

  const timingFallbackMessage = getTimingFallbackMessage(timingMode, mediaDuration);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (detectedOriginalBlocks.length === 0) {
      return;
    }

    if (detectedTranslationBlocks.length > 0) {
      if (detectedTranslationBlocks.length !== detectedOriginalBlocks.length) {
        setValidationError(
          `La traduccion tiene ${detectedTranslationBlocks.length} bloques, pero el texto original tiene ${detectedOriginalBlocks.length}. Debes igualar la cantidad antes de guardar.`
        );
        return;
      }
    }

    if (hasExistingBlocks) {
      if (detectedTranslationBlocks.length === 0) {
        setValidationError('Pega una traduccion antes de guardar.');
        return;
      }

      onApplyTranslation(detectedTranslationBlocks);
    } else {
      onCreateBlocks(
        detectedOriginalBlocks,
        timingMode,
        detectedTranslationBlocks.length > 0 ? detectedTranslationBlocks : undefined
      );
    }

    setOriginalText('');
    setTranslationText('');
    setLanguage(originalLanguages[0].value);
    setSplitMode('lines');
    setTranslationSplitMode('lines');
    setTimingMode('distribute');
    setValidationError('');
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="lyrics-modal" role="dialog" aria-modal="true" aria-labelledby="lyrics-title">
        <div className="lyrics-modal__header">
          <div>
            <p id="lyrics-title">Agregar letra / traduccion</p>
            <span>El texto original define la estructura de los bloques</span>
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
              <span>Original</span>
              <strong>{detectedOriginalBlocks.length}</strong>
            </div>

            <label className="lyrics-modal__field">
              <span>Separar traduccion por</span>
              <select
                value={translationSplitMode}
                onChange={(event) => setTranslationSplitMode(event.target.value as TextSplitMode)}
              >
                <option value="lines">Lineas</option>
                <option value="paragraphs">Parrafos</option>
              </select>
            </label>

            <div className="lyrics-modal__counter" aria-live="polite">
              <span>Traduccion</span>
              <strong>{detectedTranslationBlocks.length}</strong>
            </div>
          </div>

          <div className="lyrics-modal__columns">
            <label className="lyrics-modal__textarea">
              <span>Texto original</span>
              <textarea
                value={hasExistingBlocks ? existingOriginalLines.join('\n') : originalText}
                readOnly={hasExistingBlocks}
                placeholder="Pega aqui la letra original de la cancion..."
                onChange={(event) => {
                  setOriginalText(event.target.value);
                  setValidationError('');
                }}
              />
            </label>

            <label className="lyrics-modal__textarea">
              <span>Traduccion</span>
              <textarea
                value={translationText}
                placeholder="Pega aqui la traduccion bloque por bloque..."
                onChange={(event) => {
                  setTranslationText(event.target.value);
                  setValidationError('');
                }}
              />
            </label>
          </div>

          {!hasExistingBlocks ? (
            <section className="lyrics-modal__timing" aria-label="Tiempos automaticos">
              <div>
                <h2>Tiempos automaticos</h2>
                {timingFallbackMessage ? <p>{timingFallbackMessage}</p> : null}
              </div>

              <div className="lyrics-modal__timing-options">
                {(['fixed-0-5', 'fixed-1', 'fixed-2', 'distribute', 'manual'] as AutomaticTimingMode[]).map(
                  (mode) => (
                    <label key={mode} className="lyrics-modal__timing-option">
                      <input
                        type="radio"
                        name="timingMode"
                        value={mode}
                        checked={timingMode === mode}
                        onChange={() => setTimingMode(mode)}
                      />
                      <span>{getTimingModeLabel(mode)}</span>
                    </label>
                  )
                )}
              </div>
            </section>
          ) : null}

          {validationError ? <p className="lyrics-modal__error">{validationError}</p> : null}

          <div className="lyrics-modal__actions">
            <button type="button" className="lyrics-modal__secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={detectedOriginalBlocks.length === 0}>
              {hasExistingBlocks ? 'Guardar traduccion' : 'Crear bloques'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
