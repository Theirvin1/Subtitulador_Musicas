import type { Project } from '../../shared/types/project';
import { DEFAULT_VIDEO_FORMAT, getVideoFormatPreset } from '../../shared/constants/videoFormats';
import { toFileUrl } from '../services/fileUrl';

type PreviewCanvasProps = {
  activeProject: Project | null;
};

export const PreviewCanvas = ({ activeProject }: PreviewCanvasProps): JSX.Element => {
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
            <video className="preview-canvas__media" src={videoUrl} muted controls />
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

          <div className="preview-canvas__subtitles">
            <p>Tonight we follow every beat</p>
            <span>Esta noche seguimos cada ritmo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
