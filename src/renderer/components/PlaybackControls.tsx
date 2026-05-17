type PlaybackControlsProps = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  hasMedia: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
};

const formatPlaybackTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const PlaybackControls = ({
  currentTime,
  duration,
  isPlaying,
  hasMedia,
  onPlay,
  onPause,
  onSeek
}: PlaybackControlsProps): JSX.Element => {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <section className="playback-controls" aria-label="Controles de reproduccion">
      <div className="playback-controls__row">
        <div className="playback-controls__buttons">
          <button type="button" aria-label="Retroceder" disabled={!hasMedia} onClick={() => onSeek(currentTime - 10)}>
            -10s
          </button>
          {isPlaying ? (
            <button type="button" className="playback-controls__play" aria-label="Pausar" onClick={onPause}>
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="playback-controls__play"
              aria-label="Reproducir"
              disabled={!hasMedia}
              onClick={onPlay}
            >
              Play
            </button>
          )}
          <button type="button" aria-label="Avanzar" disabled={!hasMedia} onClick={() => onSeek(currentTime + 10)}>
            +10s
          </button>
        </div>

        <div className="playback-controls__time">
          <strong>{formatPlaybackTime(currentTime)}</strong>
          <span>/ {formatPlaybackTime(duration)}</span>
        </div>
      </div>

      <div className="playback-controls__timeline">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={duration > 0 ? currentTime : 0}
          disabled={!hasMedia || duration <= 0}
          aria-label="Progreso de reproduccion"
          style={{ '--progress': `${progress}%` } as CSSProperties}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </div>
    </section>
  );
};
import type { CSSProperties } from 'react';
