import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

type UseMediaPlaybackInput = {
  mediaUrl?: string;
};

type UseMediaPlaybackState = {
  mediaRef: RefObject<HTMLMediaElement>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
};

export const useMediaPlayback = ({ mediaUrl }: UseMediaPlaybackInput): UseMediaPlaybackState => {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [mediaUrl]);

  const play = useCallback((): void => {
    const media = mediaRef.current;

    if (!media || !mediaUrl) {
      return;
    }

    void media.play();
  }, [mediaUrl]);

  const pause = useCallback((): void => {
    mediaRef.current?.pause();
  }, []);

  const seek = useCallback((time: number): void => {
    const media = mediaRef.current;

    if (!media) {
      return;
    }

    const safeDuration = Number.isFinite(media.duration) ? media.duration : 0;
    const nextTime = Math.min(Math.max(0, time), safeDuration || Math.max(0, time));

    media.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const handleTimeUpdate = useCallback((): void => {
    setCurrentTime(mediaRef.current?.currentTime ?? 0);
  }, []);

  const handleLoadedMetadata = useCallback((): void => {
    const media = mediaRef.current;
    const nextDuration = media && Number.isFinite(media.duration) ? media.duration : 0;

    setDuration(nextDuration);
  }, []);

  const handlePlay = useCallback((): void => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback((): void => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const media = mediaRef.current;

    if (!media) {
      return undefined;
    }

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('ended', handlePause);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('ended', handlePause);
    };
  }, [handleLoadedMetadata, handlePause, handlePlay, handleTimeUpdate, mediaUrl]);

  return {
    mediaRef,
    currentTime,
    duration,
    isPlaying,
    play,
    pause,
    seek
  };
};
