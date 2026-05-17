import { VIDEO_FORMAT_PRESETS } from '../../shared/constants/videoFormats';
import type { Project } from '../../shared/types/project';
import { getFileName } from '../services/fileUrl';

const subtitleStyles = ['Cine limpio', 'Karaoke suave', 'Bilingue clasico'];

type SettingsPanelProps = {
  activeProject: Project | null;
  onSelectAudio: () => void;
  onSelectVideo: () => void;
  onSelectBackground: () => void;
};

export const SettingsPanel = ({
  activeProject,
  onSelectAudio,
  onSelectVideo,
  onSelectBackground
}: SettingsPanelProps): JSX.Element => {
  return (
    <aside className="settings-panel" aria-label="Configuracion del proyecto">
      <div className="settings-panel__header">
        <p>Configuracion</p>
        <span>{activeProject ? activeProject.name : 'Proyecto no creado'}</span>
      </div>

      <section className="settings-panel__group">
        <h2>Formato</h2>
        <div className="settings-panel__options">
          {VIDEO_FORMAT_PRESETS.slice(0, 3).map((format) => (
            <button
              key={format.value}
              type="button"
              className={
                activeProject?.videoFormat === format.value ||
                (!activeProject && format.value === 'HORIZONTAL_16_9')
                  ? 'settings-panel__option is-active'
                  : 'settings-panel__option'
              }
            >
              {format.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Proyecto activo</h2>
        <dl className="settings-panel__details">
          <div>
            <dt>Resolucion</dt>
            <dd>{activeProject ? `${activeProject.width}x${activeProject.height}` : 'Sin definir'}</dd>
          </div>
          <div>
            <dt>FPS</dt>
            <dd>{activeProject ? activeProject.fps : 'Sin definir'}</dd>
          </div>
        </dl>
      </section>

      <section className="settings-panel__group">
        <h2>Multimedia</h2>
        <div className="media-loader">
          <div className="media-loader__item">
            <div>
              <span>Audio</span>
              <strong>{getFileName(activeProject?.audioPath)}</strong>
            </div>
            <button type="button" onClick={onSelectAudio}>
              Cargar
            </button>
          </div>
          <div className="media-loader__item">
            <div>
              <span>Video</span>
              <strong>{getFileName(activeProject?.videoPath)}</strong>
            </div>
            <button type="button" onClick={onSelectVideo}>
              Cargar
            </button>
          </div>
          <div className="media-loader__item">
            <div>
              <span>Imagen de fondo</span>
              <strong>{getFileName(activeProject?.backgroundPath)}</strong>
            </div>
            <button type="button" onClick={onSelectBackground}>
              Cargar
            </button>
          </div>
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Subtitulos</h2>
        <label className="settings-panel__field">
          <span>Estilo visual</span>
          <select defaultValue={subtitleStyles[0]}>
            {subtitleStyles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </label>
        <label className="settings-panel__field">
          <span>Tamano de texto</span>
          <input type="range" min="24" max="72" defaultValue="42" />
        </label>
        <label className="settings-panel__toggle">
          <input type="checkbox" defaultChecked />
          <span>Mostrar traduccion</span>
        </label>
      </section>

      <section className="settings-panel__group">
        <h2>Audio</h2>
        <div className="settings-panel__meter" aria-label="Nivel de audio simulado">
          <span style={{ height: '42%' }} />
          <span style={{ height: '68%' }} />
          <span style={{ height: '54%' }} />
          <span style={{ height: '82%' }} />
          <span style={{ height: '47%' }} />
          <span style={{ height: '64%' }} />
        </div>
      </section>
    </aside>
  );
};
