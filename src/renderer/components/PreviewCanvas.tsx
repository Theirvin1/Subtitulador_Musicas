export const PreviewCanvas = (): JSX.Element => {
  return (
    <section className="preview-canvas" aria-label="Vista previa del video">
      <div className="preview-canvas__screen">
        <div className="preview-canvas__frame">
          <span className="preview-canvas__badge">16:9</span>
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
          <div className="preview-canvas__subtitles">
            <p>Tonight we follow every beat</p>
            <span>Esta noche seguimos cada ritmo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
