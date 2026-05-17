import type { RefObject } from 'react';
import type { Project, SubtitleBlock } from '../../shared/types/project';
import { DEFAULT_VIDEO_FORMAT, getVideoFormatPreset } from '../../shared/constants/videoFormats';
import { toFileUrl } from '../services/fileUrl';

type PreviewCanvasProps = {
  activeProject: Project | null;
  activeSubtitleBlock: SubtitleBlock | null;
  mediaRef: RefObject<HTMLMediaElement>;
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

  return (
    <section className="preview-canvas" aria-label="Vista previa del video">
      <div className="preview-canvas__screen">
        <div
          className="preview-canvas__frame"
          style={{ aspectRatio: `${previewWidth} / ${previewHeight}` }}
        >
          <span className="preview-canvas__badge">
            {preset.shortLabel} · {previewWidth}x{previewHeight}
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
              <p>{activeSubtitleBlock.originalText}</p>
              {activeSubtitleBlock.translatedText ? <span>{activeSubtitleBlock.translatedText}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
