import { useEffect, useMemo, useState } from 'react';
import type {
  ExportMode,
  ExportQuality,
  ExportValidationResult
} from '../../shared/types/export';
import type { CustomFont } from '../../shared/types/font';
import type { Project, SubtitleBlock } from '../../shared/types/project';
import { exportService } from '../services/exportService';
import { projectStorage } from '../services/projectStorage';

type ExportStatus = 'idle' | 'preparing' | 'exporting' | 'finished' | 'error';

type ExportModalProps = {
  isOpen: boolean;
  project: Project | null;
  subtitleBlocks: SubtitleBlock[];
  customFonts: CustomFont[];
  onClose: () => void;
};

const getDefaultName = (project: Project | null): string => {
  return project?.name ? project.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') : '';
};

const EMPTY_VALIDATION_RESULT: ExportValidationResult = {
  errors: [],
  warnings: [],
  canExport: true
};

export const ExportModal = ({
  isOpen,
  project,
  subtitleBlocks,
  customFonts,
  onClose
}: ExportModalProps): JSX.Element | null => {
  const [videoName, setVideoName] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('');
  const [quality, setQuality] = useState<ExportQuality>('HIGH');
  const [exportMp3, setExportMp3] = useState(false);
  const [mp3Only, setMp3Only] = useState(false);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [message, setMessage] = useState('');
  const [outputPaths, setOutputPaths] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ExportValidationResult>(
    EMPTY_VALIDATION_RESULT
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setVideoName(getDefaultName(project));
    setStatus('idle');
    setMessage('');
    setOutputPaths([]);
    setValidationResult(EMPTY_VALIDATION_RESULT);
    void projectStorage.getSettings().then((settings) => {
      if (settings.lastExportDirectory) {
        setOutputDirectory(settings.lastExportDirectory);
      }
    });
  }, [isOpen, project]);

  const mode: ExportMode = useMemo(
    () => (mp3Only ? 'MP3_ONLY' : exportMp3 ? 'MP4_AND_MP3' : 'MP4'),
    [exportMp3, mp3Only]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const validationTimer = window.setTimeout(() => {
      void exportService
        .validateBeforeExport({
          project: project
            ? {
                ...project,
                subtitleBlocks
              }
            : null,
          outputName: videoName,
          outputDirectory,
          mode,
          customFonts
        })
        .then(setValidationResult)
        .catch((error) => {
          setValidationResult({
            errors: [
              {
                severity: 'error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'No se pudo validar el proyecto antes de exportar.'
              }
            ],
            warnings: [],
            canExport: false
          });
        });
    }, 150);

    return () => window.clearTimeout(validationTimer);
  }, [customFonts, isOpen, mode, outputDirectory, project, subtitleBlocks, videoName]);

  if (!isOpen) {
    return null;
  }

  const handleSelectDirectory = async (): Promise<void> => {
    const directory = await exportService.selectOutputDirectory();

    if (directory) {
      setOutputDirectory(directory);
      const currentSettings = await projectStorage.getSettings();
      void projectStorage.updateSettings({
        autoSaveEnabled: currentSettings.autoSaveEnabled,
        lastExportDirectory: directory
      });
    }
  };

  const handleExport = async (): Promise<void> => {
    if (!project) {
      setStatus('error');
      setMessage('No existe un proyecto activo.');
      return;
    }

    const nextValidationResult = await exportService.validateBeforeExport({
      project: {
        ...project,
        subtitleBlocks
      },
      outputName: videoName,
      outputDirectory,
      mode,
      customFonts
    });
    setValidationResult(nextValidationResult);

    if (!nextValidationResult.canExport) {
      setStatus('error');
      setMessage('No se puede exportar todavia. Revisa los errores marcados.');
      return;
    }

    const outputCheck = await exportService.checkOutput({
      outputName: videoName,
      outputDirectory,
      mode
    });

    if (outputCheck.exists) {
      const confirmed = window.confirm(
        `Ya existe una exportacion con ese nombre. Se sobrescribiran ${outputCheck.paths.length} archivo(s). Continuar?`
      );

      if (!confirmed) {
        setStatus('idle');
        setMessage('Exportacion cancelada para evitar sobrescribir archivos.');
        return;
      }
    }

    setStatus('preparing');
    setMessage('Preparando archivos temporales');

    try {
      const hasFfmpeg = await exportService.checkFfmpeg();

      if (!hasFfmpeg) {
        throw new Error('FFmpeg no esta disponible en el sistema.');
      }

      setStatus('exporting');
      setMessage(
        mp3Only
          ? 'Exportando MP3'
          : exportMp3
            ? 'Exportando MP4 y MP3'
            : 'Exportando MP4 con subtitulos ASS'
      );

      const result = await exportService.exportMp4({
        project: {
          ...project,
          subtitleBlocks
        },
        outputName: videoName,
        outputDirectory,
        quality,
        mode,
        fps: 30,
        customFonts
      });

      setOutputPaths(
        [result.mp4Path, result.mp3Path, result.coverPath].filter((path): path is string =>
          Boolean(path)
        )
      );
      setStatus('finished');
      setMessage(`Finalizado en ${result.outputDirectory}`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error al exportar');
    }
  };

  const isBusy = status === 'preparing' || status === 'exporting';
  const validationIssuesCount =
    validationResult.errors.length + validationResult.warnings.length;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="export-modal" role="dialog" aria-modal="true" aria-label="Exportar">
        <header className="export-modal__header">
          <div>
            <p>Exportar</p>
            <span>MP4 con ASS y audio MP3 opcional</span>
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
            <span>Carpeta base de salida</span>
            <div className="export-modal__folder">
              <input value={outputDirectory} readOnly placeholder="Selecciona una carpeta" />
              <button type="button" onClick={() => void handleSelectDirectory()} disabled={isBusy}>
                Elegir
              </button>
            </div>
          </label>

          <section className="export-modal__options" aria-label="Opciones de exportacion">
            <label className="settings-panel__toggle">
              <input
                type="checkbox"
                checked={exportMp3}
                disabled={isBusy || mp3Only}
                onChange={(event) => setExportMp3(event.target.checked)}
              />
              <span>Exportar tambien como MP3</span>
            </label>
            <label className="settings-panel__toggle">
              <input
                type="checkbox"
                checked={mp3Only}
                disabled={isBusy}
                onChange={(event) => {
                  setMp3Only(event.target.checked);
                  if (event.target.checked) {
                    setExportMp3(false);
                  }
                }}
              />
              <span>Exportar solo MP3</span>
            </label>
          </section>

          <label className="new-project-modal__field">
            <span>Calidad</span>
            <select
              value={quality}
              onChange={(event) => setQuality(event.target.value as ExportQuality)}
              disabled={isBusy}
            >
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="MAXIMUM">Maxima</option>
            </select>
          </label>

          <dl className="export-modal__summary">
            <div>
              <dt>Calidad</dt>
              <dd>
                {quality === 'MEDIUM'
                  ? 'Media'
                  : quality === 'MAXIMUM'
                    ? 'Maxima'
                    : 'Alta'}
              </dd>
            </div>
            <div>
              <dt>FPS</dt>
              <dd>30</dd>
            </div>
            <div>
              <dt>Salida</dt>
              <dd>{mp3Only ? 'MP3' : exportMp3 ? 'MP4 + MP3' : 'MP4'}</dd>
            </div>
          </dl>

          {validationIssuesCount > 0 && status !== 'finished' ? (
            <section
              className="export-modal__validation"
              role={validationResult.errors.length > 0 ? 'alert' : 'status'}
              aria-label="Validacion antes de exportar"
            >
              {validationResult.errors.length > 0 ? (
                <div className="export-modal__validation-errors">
                  <strong>No se puede exportar todavia:</strong>
                  <ul>
                    {validationResult.errors.map((issue) => (
                      <li key={`error-${issue.message}`}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {validationResult.warnings.length > 0 ? (
                <div className="export-modal__validation-warnings">
                  <strong>Advertencias:</strong>
                  <ul>
                    {validationResult.warnings.map((issue) => (
                      <li key={`warning-${issue.message}`}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {message ? (
            <p className={`export-modal__message is-${status}`}>
              {message}
            </p>
          ) : null}

          {outputPaths.length > 0 ? (
            <ul className="export-modal__outputs">
              {outputPaths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          ) : null}

          <div className="export-modal__actions">
            <button type="button" onClick={onClose} disabled={isBusy}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isBusy || !validationResult.canExport}
            >
              {isBusy ? 'Exportando...' : mp3Only ? 'Exportar MP3' : 'Exportar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
