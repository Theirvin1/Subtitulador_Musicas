import {
  SUBTITLE_STYLE_PRESETS,
  type SubtitleStylePresetId
} from '../../shared/constants/subtitleStyle';
import { VIDEO_FORMAT_PRESETS } from '../../shared/constants/videoFormats';
import type { CustomFont } from '../../shared/types/font';
import type { Project, SubtitleStyle, VideoFormat } from '../../shared/types/project';
import { getFileName, toFileUrl } from '../services/fileUrl';

type SettingsPanelProps = {
  activeProject: Project | null;
  onSelectAudio: () => void;
  onSelectVideo: () => void;
  onSelectBackground: () => void;
  onSelectCover: () => void;
  onExtractCoverFrame: () => void;
  onChangeVideoFormat: (videoFormat: VideoFormat) => void;
  onChangeSubtitleStyle: (updates: Partial<SubtitleStyle>) => void;
  onCenterSubtitles: () => void;
  onSendSubtitlesTop: () => void;
  onSendSubtitlesBottom: () => void;
  onResetSubtitleStyle: () => void;
  onApplySubtitleStylePreset: (presetId: SubtitleStylePresetId) => void;
  customFonts: CustomFont[];
  onAddCustomFont: () => void;
  autoSaveEnabled: boolean;
  onChangeAutoSave: (enabled: boolean) => void;
};

export const SettingsPanel = ({
  activeProject,
  onSelectAudio,
  onSelectVideo,
  onSelectBackground,
  onSelectCover,
  onExtractCoverFrame,
  onChangeVideoFormat,
  onChangeSubtitleStyle,
  onCenterSubtitles,
  onSendSubtitlesTop,
  onSendSubtitlesBottom,
  onResetSubtitleStyle,
  onApplySubtitleStylePreset,
  customFonts,
  onAddCustomFont,
  autoSaveEnabled,
  onChangeAutoSave
}: SettingsPanelProps): JSX.Element => {
  const subtitleStyle = activeProject?.subtitleStyle;
  const width = activeProject?.width ?? 1920;
  const height = activeProject?.height ?? 1080;
  const fontOptions = Array.from(new Set(['Inter', ...customFonts.map((font) => font.name)]));

  return (
    <aside className="settings-panel" aria-label="Configuracion del proyecto">
      <div className="settings-panel__header">
        <p>Configuracion</p>
        <span>{activeProject ? activeProject.name : 'Proyecto no creado'}</span>
      </div>

      <section className="settings-panel__group">
        <h2>Formato de video</h2>
        <div className="video-format-grid">
          {VIDEO_FORMAT_PRESETS.map((format) => (
            <button
              key={format.value}
              type="button"
              className={
                activeProject?.videoFormat === format.value ||
                (!activeProject && format.value === 'HORIZONTAL_16_9')
                  ? 'video-format-grid__option is-active'
                  : 'video-format-grid__option'
              }
              onClick={() => onChangeVideoFormat(format.value)}
            >
              <span>{format.shortLabel}</span>
              <strong>
                {format.value === 'ORIGINAL' ? 'Original' : `${format.width}x${format.height}`}
              </strong>
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
        <label className="settings-panel__toggle">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(event) => onChangeAutoSave(event.target.checked)}
          />
          <span>Autoguardado activado</span>
        </label>
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
        <h2>Portada</h2>
        <div className="cover-editor">
          {activeProject?.coverPath ? (
            <img
              className="cover-editor__preview"
              src={toFileUrl(activeProject.coverPath)}
              alt="Portada del proyecto"
            />
          ) : (
            <div className="cover-editor__empty">Sin portada</div>
          )}
          <div className="cover-editor__details">
            <strong>{getFileName(activeProject?.coverPath)}</strong>
            <button type="button" onClick={onSelectCover}>
              Agregar portada desde archivo
            </button>
            <button type="button" onClick={onExtractCoverFrame}>
              Seleccionar frame como portada
            </button>
          </div>
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Fuentes</h2>
        <div className="font-editor">
          <label className="settings-panel__field">
            <span>Fuente original</span>
            <select
              value={subtitleStyle?.fontOriginal ?? 'Inter'}
              onChange={(event) => onChangeSubtitleStyle({ fontOriginal: event.target.value })}
            >
              {fontOptions.map((fontName) => (
                <option key={`original-${fontName}`} value={fontName}>
                  {fontName}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-panel__field">
            <span>Fuente traduccion</span>
            <select
              value={subtitleStyle?.fontTranslation ?? 'Inter'}
              onChange={(event) =>
                onChangeSubtitleStyle({ fontTranslation: event.target.value })
              }
            >
              {fontOptions.map((fontName) => (
                <option key={`translation-${fontName}`} value={fontName}>
                  {fontName}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onAddCustomFont}>
            Agregar fuente personalizada
          </button>
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Estilos de subtitulos</h2>
        <div className="subtitle-style-presets">
          {SUBTITLE_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="subtitle-style-presets__option"
              onClick={() => onApplySubtitleStylePreset(preset.id)}
            >
              <span className="subtitle-style-presets__swatch">
                <i style={{ background: preset.previewColor }} />
                <i style={{ background: preset.previewAccent }} />
              </span>
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Editor visual</h2>
        <div className="visual-editor">
          <label className="settings-panel__toggle">
            <input
              type="checkbox"
              checked={subtitleStyle?.moveTogether ?? true}
              onChange={(event) => onChangeSubtitleStyle({ moveTogether: event.target.checked })}
            />
            <span>Mover ambos subtitulos juntos</span>
          </label>

          <div className="visual-editor__group">
            <h3>Texto original</h3>
            <label className="visual-editor__field">
              <span>Tamano</span>
              <input
                type="number"
                min="12"
                max="180"
                value={subtitleStyle?.sizeOriginal ?? 56}
                onChange={(event) => onChangeSubtitleStyle({ sizeOriginal: Number(event.target.value) })}
              />
            </label>
            <label className="visual-editor__field">
              <span>Color</span>
              <input
                type="color"
                value={subtitleStyle?.colorOriginal ?? '#ffffff'}
                onChange={(event) => onChangeSubtitleStyle({ colorOriginal: event.target.value })}
              />
            </label>
            <label className="visual-editor__field">
              <span>X</span>
              <input
                type="range"
                min="0"
                max={width}
                value={subtitleStyle?.xOriginal ?? width / 2}
                onChange={(event) => onChangeSubtitleStyle({ xOriginal: Number(event.target.value) })}
              />
            </label>
            <label className="visual-editor__field">
              <span>Y</span>
              <input
                type="range"
                min="0"
                max={height}
                value={subtitleStyle?.yOriginal ?? height * 0.8}
                onChange={(event) => onChangeSubtitleStyle({ yOriginal: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="visual-editor__group">
            <h3>Traduccion</h3>
            <label className="visual-editor__field">
              <span>Tamano</span>
              <input
                type="number"
                min="12"
                max="180"
                value={subtitleStyle?.sizeTranslation ?? 40}
                onChange={(event) =>
                  onChangeSubtitleStyle({ sizeTranslation: Number(event.target.value) })
                }
              />
            </label>
            <label className="visual-editor__field">
              <span>Color</span>
              <input
                type="color"
                value={subtitleStyle?.colorTranslation ?? '#d3f7f2'}
                onChange={(event) =>
                  onChangeSubtitleStyle({ colorTranslation: event.target.value })
                }
              />
            </label>
            <label className="visual-editor__field">
              <span>X</span>
              <input
                type="range"
                min="0"
                max={width}
                value={subtitleStyle?.xTranslation ?? width / 2}
                disabled={subtitleStyle?.moveTogether ?? true}
                onChange={(event) =>
                  onChangeSubtitleStyle({ xTranslation: Number(event.target.value) })
                }
              />
            </label>
            <label className="visual-editor__field">
              <span>Y</span>
              <input
                type="range"
                min="0"
                max={height}
                value={subtitleStyle?.yTranslation ?? height * 0.86}
                disabled={subtitleStyle?.moveTogether ?? true}
                onChange={(event) =>
                  onChangeSubtitleStyle({ yTranslation: Number(event.target.value) })
                }
              />
            </label>
          </div>

          <div className="visual-editor__group">
            <h3>Apariencia</h3>
            <label className="visual-editor__field">
              <span>Borde</span>
              <input
                type="range"
                min="0"
                max="8"
                value={subtitleStyle?.borderSize ?? 2}
                onChange={(event) =>
                  onChangeSubtitleStyle({ borderSize: Number(event.target.value) })
                }
              />
            </label>
            <label className="settings-panel__toggle">
              <input
                type="checkbox"
                checked={subtitleStyle?.shadow ?? true}
                onChange={(event) => onChangeSubtitleStyle({ shadow: event.target.checked })}
              />
              <span>Sombra</span>
            </label>
          </div>

          <div className="visual-editor__actions">
            <button type="button" onClick={onCenterSubtitles}>
              Centrar horizontalmente
            </button>
            <button type="button" onClick={onSendSubtitlesTop}>
              Enviar arriba
            </button>
            <button type="button" onClick={onSendSubtitlesBottom}>
              Enviar abajo
            </button>
            <button type="button" onClick={onResetSubtitleStyle}>
              Restablecer posicion
            </button>
          </div>
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Subtitulos</h2>
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
