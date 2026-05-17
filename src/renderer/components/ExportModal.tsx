import { useEffect, useMemo, useState } from 'react';
import type { Project, SubtitleBlock } from '../../shared/types/project';
import { exportService } from '../services/exportService';

type ExportStatus = 'idle' | 'preparing' | 'exporting' | 'finished' | 'error';

type ExportModalProps = {
  isOpen: boolean;
  project: Project | null;
  subtitleBlocks: SubtitleBlock[];
  onClose: () => void;
};

const getDefaultName = (project: Project | null): string => {
  return project?.name ? project.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') : '';
};

export const ExportModal = ({
  isOpen,
  project,
  subtitleBlocks,
  onClose
}: ExportModalProps): JSX.Element | null => {
  const [videoName, setVideoName] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [message, setMessage] = useState('');
  const [outputPath, setOutputPath] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setVideoName(getDefaultName(project));
    setStatus('idle');
    setMessage('');
    setOutputPath('');
  }, [isOpen, project]);

  const validationError = useMemo(() => {
    if (!project) {
      return 'Crea un proyecto antes de exportar.';
    }

    if (!project.videoPath && !project.audioPath) {
      return 'Carga un audio o video antes de exportar.';
    }

    if (!project.videoPath && !project.backgroundPath) {
      return 'Carga una imagen de fondo para exportar solo con audio.';
    }

    if (!subtitleBlocks.some((block) => block.enabled)) {
      return 'Agrega al menos un bloque de subtitulos activo.';
    }

    if (
      subtitleBlocks
        .filter((block) => block.enabled)
        .some((block) => block.startTime < 0 || block.endTime <= block.startTime)
    ) {
      return 'Corrige los tiempos de los subtitulos antes de exportar.';
    }

    if (!videoName.trim()) {
      return 'Escribe un nombre para el video.';
    }

    if (!outputDirectory) {
      return 'Selecciona una carpeta de salida.';
    }

    return '';
  }, [outputDirectory, project, subtitleBlocks, videoName]);

  if (!isOpen) {
    return null;
  }

  const handleSelectDirectory = async (): Promise<void> => {
    const directory = await exportService.selectOutputDirectory();

    if (directory) {
      setOutputDirectory(directory);
    }
  };

  const handleExport = async (): Promise<void> => {
    if (!project || validationError) {
      setStatus('error');
      setMessage(validationError);
      return;
    }

    setStatus('preparing');
    setMessage('Preparando archivos temporales');

    try {
      const hasFfmpeg = await exportService.checkFfmpeg();

      if (!hasFfmpeg) {
        throw new Error('FFmpeg no esta disponible en el sistema.');
      }

      setStatus('exporting');
      setMessage('Exportando MP4 con subtitulos ASS');

      const result = await exportService.exportMp4({
        project: {
          ...project,
          subtitleBlocks
        },
        outputName: videoName,
        outputDirectory,
        quality: 'HIGH',
        fps: 30
      });

      setOutputPath(result.outputPath);
      setStatus('finished');
      setMessage('Finalizado');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error al exportar');
    }
  };

  const isBusy = status === 'preparing' || status === 'exporting';

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="export-modal" role="dialog" aria-modal="true" aria-label="Exportar MP4">
        <header className="export-modal__header">
          <div>
            <p>Exportar MP4</p>
            <span>Subtitulos ASS quemados en pantalla</span>
          </div>
          <button type="button" onClick={onClose} disabled={isBusy}>
            Cerrar
          </button>
        </header>

        <div className="export-modal__content">
          <label className="new-project-modal__field">
            <span>Nombre del video</span>
            <input
              value={videoName}
              onChange={(event) => setVideoName(event.target.value)}
              placeholder="mi-video-final"
              disabled={isBusy}
            />
          </label>

          <label className="new-project-modal__field">
            <span>Carpeta de salida</span>
            <div className="export-modal__folder">
              <input value={outputDirectory} readOnly placeholder="Selecciona una carpeta" />
              <button type="button" onClick={() => void handleSelectDirectory()} disabled={isBusy}>
                Elegir
              </button>
            </div>
          </label>

          <dl className="export-modal__summary">
            <div>
              <dt>Calidad</dt>
              <dd>Alta</dd>
            </div>
            <div>
              <dt>FPS</dt>
              <dd>30</dd>
            </div>
            <div>
              <dt>Resolucion</dt>
              <dd>{project ? `${project.width}x${project.height}` : 'Sin proyecto'}</dd>
            </div>
          </dl>

          {validationError && status !== 'finished' ? (
            <p className="export-modal__message is-error">{validationError}</p>
          ) : null}

          {message ? (
            <p className={`export-modal__message is-${status}`}>
              {outputPath ? `${message}: ${outputPath}` : message}
            </p>
          ) : null}

          <div className="export-modal__actions">
            <button type="button" onClick={onClose} disabled={isBusy}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isBusy || Boolean(validationError)}
            >
              {isBusy ? 'Exportando...' : 'Exportar MP4'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
