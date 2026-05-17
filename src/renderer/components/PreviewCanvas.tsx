import type { CSSProperties, RefObject } from 'react';
import type { Project, SubtitleBlock, SubtitleStyle } from '../../shared/types/project';
import { createDefaultSubtitleStyle } from '../../shared/constants/subtitleStyle';
import { DEFAULT_VIDEO_FORMAT, getVideoFormatPreset } from '../../shared/constants/videoFormats';
import { toFileUrl } from '../services/fileUrl';

type PreviewCanvasProps = {
  activeProject: Project | null;
  activeSubtitleBlock: SubtitleBlock | null;
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

export const PreviewCanvas = ({
  activeProject,
  activeSubtitleBlock,
  mediaRef
}: PreviewCanvasProps): JSX.Element => {
  const backgroundUrl = toFileUrl(activeProject?.backgroundPath);
  const videoUrl = toFileUrl(activeProject?.videoPath);
  const preset = getVideoFormatPreset(activeProject?.videoFormat ?? DEFAULT_VIDEO_FORMAT);
  const previewWidth = activeProject?.width ?? preset.width;
  const previewHeight = activeProject?.height ?? preset.height;
  const subtitleStyle =
    activeProject?.subtitleStyle ?? createDefaultSubtitleStyle(previewWidth, previewHeight);

  return (
    <section className="preview-canvas" aria-label="Vista previa del video">
      <div className="preview-canvas__screen">
        <div
          className="preview-canvas__frame"
          style={{ aspectRatio: `${previewWidth} / ${previewHeight}` }}
        >
          <span className="preview-canvas__badge">
            {preset.shortLabel} - {previewWidth}x{previewHeight}
          </span>

          {videoUrl ? (
            <video ref={mediaRef as RefObject<HTMLVideoElement>} className="preview-canvas__media" src={videoUrl} muted />
          ) : backgroundUrl ? (
            <img className="preview-canvas__media" src={backgroundUrl} alt="Fondo del proyecto" />
          ) : (
            <div className="preview-canvas__artwork">
              <div className="preview-canvas__disc" />
              <div className="preview-canvas__waveform">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {activeSubtitleBlock ? (
            <div className="preview-canvas__subtitles">
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
      </div>
    </section>
  );
};
