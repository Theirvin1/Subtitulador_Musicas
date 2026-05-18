import { FormEvent, useState } from 'react';
import { DEFAULT_VIDEO_FORMAT, VIDEO_FORMAT_PRESETS } from '../../shared/constants/videoFormats';
import type { VideoFormat } from '../../shared/types/project';

type NewProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (input: { name: string; videoFormat: VideoFormat }) => void;
};

export const NewProjectModal = ({
  isOpen,
  onClose,
  onCreateProject
}: NewProjectModalProps): JSX.Element | null => {
  const [name, setName] = useState('');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>(DEFAULT_VIDEO_FORMAT);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const projectName = name.trim();
    if (!projectName) {
      return;
    }

    onCreateProject({
      name: projectName,
      videoFormat
    });
    setName('');
    setVideoFormat(DEFAULT_VIDEO_FORMAT);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="new-project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <div className="new-project-modal__header">
          <div>
            <p>Nuevo proyecto</p>
            <span>Define la base inicial del video musical</span>
          </div>
          <button type="button" aria-label="Cerrar modal" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="new-project-modal__form" onSubmit={handleSubmit}>
          <label className="new-project-modal__field">
            <span id="new-project-title">Nombre del proyecto</span>
            <input
              autoFocus
              type="text"
              value={name}
              placeholder="Mi cancion subtitulada"
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="new-project-modal__field">
            <span>Formato inicial de video</span>
            <select
              value={videoFormat}
              onChange={(event) => setVideoFormat(event.target.value as VideoFormat)}
            >
              {VIDEO_FORMAT_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label} - {preset.width}x{preset.height}
                </option>
              ))}
            </select>
          </label>

          <div className="new-project-modal__actions">
            <button type="button" className="new-project-modal__secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim()}>
              Crear proyecto
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
