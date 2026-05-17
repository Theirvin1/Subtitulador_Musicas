const timelineMarkers = ['0:00', '0:30', '1:00', '1:30', '2:00', '2:30'];

export const PlaybackControls = (): JSX.Element => {
  return (
    <section className="playback-controls" aria-label="Controles de reproduccion">
      <div className="playback-controls__row">
        <div className="playback-controls__buttons">
          <button type="button" aria-label="Retroceder">
            -10s
          </button>
          <button type="button" className="playback-controls__play" aria-label="Reproducir">
            Play
          </button>
          <button type="button" aria-label="Avanzar">
            +10s
          </button>
        </div>

        <div className="playback-controls__time">
          <strong>00:38.240</strong>
          <span>/ 03:24.000</span>
        </div>
      </div>

      <div className="playback-controls__timeline">
        <div className="playback-controls__track">
          <span className="playback-controls__progress" />
          <span className="playback-controls__handle" />
        </div>
        <div className="playback-controls__markers">
          {timelineMarkers.map((marker) => (
            <span key={marker}>{marker}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
