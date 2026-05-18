import type { CSSProperties, RefObject } from 'react';
import type { Project, SubtitleBlock, SubtitleStyle } from '../../shared/types/project';
import { createDefaultSubtitleStyle } from '../../shared/constants/subtitleStyle';
import { DEFAULT_VIDEO_FORMAT, getVideoFormatPreset } from '../../shared/constants/videoFormats';
import { toFileUrl } from '../services/fileUrl';

type PreviewCanvasProps = {
  activeProject: Project | null;
  activeSubtitleBlock: SubtitleBlock | null;
  currentTime: number;
  mediaRef: RefObject<HTMLMediaElement>;
};

const buildSubtitlePosition = (
  style: SubtitleStyle,
  previewWidth: number,
  previewHeight: number,
  line: 'original' | 'translation'
): CSSProperties => {
  const isOriginal = line === 'original';
  const x = isOriginal ? style.xOriginal : style.xTranslation;
  const y = isOriginal ? style.yOriginal : style.yTranslation;
  const size = isOriginal ? style.sizeOriginal : style.sizeTranslation;
  const color = isOriginal ? style.colorOriginal : style.colorTranslation;
  const fontFamily = isOriginal ? style.fontOriginal : style.fontTranslation;
  const strokeSize = style.borderSize > 0 ? Math.max(1, style.borderSize) : 0;

  return {
    left: `${(x / previewWidth) * 100}%`,
    top: `${(y / previewHeight) * 100}%`,
    color,
    fontFamily,
    fontSize: `${(size / previewWidth) * 100}cqw`,
    textShadow: style.shadow ? '0 3px 14px rgba(0, 0, 0, 0.82)' : 'none',
    WebkitTextStroke: strokeSize ? `${strokeSize}px rgba(5, 9, 14, 0.76)` : undefined
  };
};

const getSubtitleOpacity = (
  style: SubtitleStyle,
  block: SubtitleBlock | null,
  currentTime: number
): number => {
  if (!block) {
    return 1;
  }

  const fadeDuration = 0.3;
  let opacity = 1;

  if (style.fadeIn) {
    opacity = Math.min(opacity, Math.min(1, (currentTime - block.startTime) / fadeDuration));
  }

  if (style.fadeOut) {
    opacity = Math.min(opacity, Math.min(1, (block.endTime - currentTime) / fadeDuration));
  }

  return Math.max(0, opacity);
};

export const PreviewCanvas = ({
  activeProject,
  activeSubtitleBlock,
  currentTime,
  mediaRef
}: PreviewCanvasProps): JSX.Element => {
  const backgroundUrl = toFileUrl(activeProject?.backgroundPath);
  const videoUrl = toFileUrl(activeProject?.videoPath);
  const preset = getVideoFormatPreset(activeProject?.videoFormat ?? DEFAULT_VIDEO_FORMAT);
  const previewWidth = activeProject?.width ?? preset.width;
  const previewHeight = activeProject?.height ?? preset.height;
  const subtitleStyle =
    activeProject?.subtitleStyle ?? createDefaultSubtitleStyle(previewWidth, previewHeight);
  const subtitleOpacity = getSubtitleOpacity(subtitleStyle, activeSubtitleBlock, currentTime);
  const hasPreviewMedia = Boolean(videoUrl || backgroundUrl);

  return (
    <section className="preview-canvas" aria-label="Vista previa del video">
      <div className="preview-canvas__screen">
        {hasPreviewMedia ? (
          <div
            className="preview-canvas__frame"
            style={{ aspectRatio: `${previewWidth} / ${previewHeight}` }}
          >
            <span className="preview-canvas__badge">
              {preset.shortLabel} - {previewWidth}x{previewHeight}
            </span>

            {videoUrl ? (
              <video
                ref={mediaRef as RefObject<HTMLVideoElement>}
                className="preview-canvas__media"
                src={videoUrl}
                muted
              />
            ) : (
              <img className="preview-canvas__media" src={backgroundUrl} alt="Fondo del proyecto" />
            )}

            {activeSubtitleBlock ? (
              <div className="preview-canvas__subtitles" style={{ opacity: subtitleOpacity }}>
                <p
                  className="preview-canvas__subtitle-line preview-canvas__subtitle-line--original"
                  style={buildSubtitlePosition(
                    subtitleStyle,
                    previewWidth,
                    previewHeight,
                    'original'
                  )}
                >
                  {activeSubtitleBlock.originalText}
                </p>
                {activeSubtitleBlock.translatedText ? (
                  <span
                    className="preview-canvas__subtitle-line preview-canvas__subtitle-line--translation"
                    style={buildSubtitlePosition(
                      subtitleStyle,
                      previewWidth,
                      previewHeight,
                      'translation'
                    )}
                  >
                    {activeSubtitleBlock.translatedText}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="preview-canvas__empty">
            <span className="preview-canvas__empty-label">Vista previa</span>
            <div className="preview-canvas__artwork" aria-hidden="true">
              <div className="preview-canvas__disc" />
              <div className="preview-canvas__waveform">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <strong>{activeProject ? 'Sin multimedia cargada' : 'Sin proyecto activo'}</strong>
            <p>
              {activeProject
                ? 'Carga un video o una imagen de fondo para ver aqui el resultado del proyecto.'
                : 'Crea o abre un proyecto para activar la vista previa del editor.'}
            </p>
            <small>{activeProject ? 'Usa el panel derecho de multimedia.' : 'Empieza con Nuevo.'}</small>
          </div>
        )}
      </div>
    </section>
  );
};
