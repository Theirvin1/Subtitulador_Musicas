import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AddLyricsModal } from '../components/AddLyricsModal';
import { ExportModal } from '../components/ExportModal';
import { HistoryModal } from '../components/HistoryModal';
import { PlaybackControls } from '../components/PlaybackControls';
import { NewProjectModal } from '../components/NewProjectModal';
import { PreviewCanvas } from '../components/PreviewCanvas';
import { SettingsPanel } from '../components/SettingsPanel';
import { SubtitleBlocksPanel } from '../components/SubtitleBlocksPanel';
import { TopBar } from '../components/TopBar';
import { useActiveProject } from '../hooks/useActiveProject';
import { useMediaPlayback } from '../hooks/useMediaPlayback';
import { toFileUrl } from '../services/fileUrl';
import { mediaService } from '../services/mediaService';
import { exportService } from '../services/exportService';
import { fontService } from '../services/fontService';
import { projectStorage } from '../services/projectStorage';
import {
  normalizeTimeRange,
  reorderSubtitleBlocks,
  shiftSubtitleBlock
} from '../services/subtitleBlocks';
import { assignSubtitleTimings, type AutomaticTimingMode } from '../services/subtitleTiming';
import {
  createDefaultSubtitleStyle,
  getSubtitleStylePreset,
  type SubtitleStylePresetId
} from '../../shared/constants/subtitleStyle';
import { getVideoFormatPreset } from '../../shared/constants/videoFormats';
import type { MediaKind } from '../../shared/types/media';
import type { CustomFont } from '../../shared/types/font';
import type {
  ProjectSummary,
  SubtitleBlock,
  SubtitleStyle,
  VideoFormat
} from '../../shared/types/project';

const createSubtitleBlockId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `subtitle-block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const clampSubtitleStyle = (
  style: SubtitleStyle,
  width: number,
  height: number
): SubtitleStyle => ({
  ...style,
  sizeOriginal: clamp(style.sizeOriginal, 12, 180),
  sizeTranslation: clamp(style.sizeTranslation, 12, 180),
  xOriginal: clamp(style.xOriginal, 0, width),
  yOriginal: clamp(style.yOriginal, 0, height),
  xTranslation: clamp(style.xTranslation, 0, width),
  yTranslation: clamp(style.yTranslation, 0, height)
});

type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

const formatSaveStatus = (
  status: SaveStatus,
  lastSavedAt: Date | null,
  errorMessage: string
): string => {
  if (status === 'saving') {
    return 'Guardando...';
  }

  if (status === 'dirty') {
    return 'Cambios sin guardar';
  }

  if (status === 'error') {
    return errorMessage || 'Error al guardar';
  }

  if (!lastSavedAt) {
    return 'Sin guardar';
  }

  const seconds = Math.max(0, Math.floor((Date.now() - lastSavedAt.getTime()) / 1000));
  return `Guardado hace ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
};

export const EditorPage = (): JSX.Element => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAddLyricsModalOpen, setIsAddLyricsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<ProjectSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [projectMessage, setProjectMessage] = useState('Proyecto en memoria');
  const [subtitleBlocks, setSubtitleBlocks] = useState<SubtitleBlock[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saveStatusTick, setSaveStatusTick] = useState(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRevisionRef = useRef(0);
  const { activeProject, createNewProject, setActiveProject, updateActiveProject } =
    useActiveProject();
  const mediaUrl = toFileUrl(activeProject?.videoPath ?? activeProject?.audioPath);
  const isVideoPlayback = Boolean(activeProject?.videoPath);
  const { mediaRef, currentTime, duration, isPlaying, play, pause, seek } = useMediaPlayback({
    mediaUrl
  });
  const activeSubtitleBlock = useMemo(() => {
    return (
      subtitleBlocks.find(
        (block) =>
          block.enabled && block.startTime <= currentTime && currentTime <= block.endTime
      ) ?? null
    );
  }, [currentTime, subtitleBlocks]);
  const saveStatusLabel = useMemo(
    () => formatSaveStatus(saveStatus, lastSavedAt, saveError),
    [lastSavedAt, saveError, saveStatus, saveStatusTick]
  );

  useEffect(() => {
    void projectStorage.getSettings().then((settings) => {
      setAutoSaveEnabled(settings.autoSaveEnabled);
    });
    void fontService.list().then(setCustomFonts);
  }, []);

  useEffect(() => {
    customFonts.forEach((font) => {
      const fontUrl = toFileUrl(font.path);

      if (!fontUrl || document.fonts.check(`12px "${font.name}"`)) {
        return;
      }

      const fontFace = new FontFace(font.name, `url("${fontUrl}")`);
      void fontFace
        .load()
        .then((loadedFont) => {
          document.fonts.add(loadedFont);
        })
        .catch(() => undefined);
    });
  }, [customFonts]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSaveStatusTick((currentTick) => currentTick + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const markUnsaved = useCallback((): void => {
    dirtyRevisionRef.current += 1;
    setSaveError('');
    setSaveStatus('dirty');
  }, []);

  const persistActiveProject = useCallback(
    async (mode: 'manual' | 'auto'): Promise<void> => {
      if (!activeProject) {
        setProjectMessage('Crea un proyecto antes de guardar');
        setIsNewProjectModalOpen(true);
        return;
      }

      setSaveStatus('saving');
      setSaveError('');
      const saveRevision = dirtyRevisionRef.current;

      try {
        const savedProject = await projectStorage.saveProject({
          ...activeProject,
          subtitleBlocks
        });

        setLastSavedAt(new Date(savedProject.updatedAt));
        if (dirtyRevisionRef.current === saveRevision) {
          setActiveProject(savedProject);
          setSubtitleBlocks(savedProject.subtitleBlocks);
          setSaveStatus('saved');
        } else {
          setSaveStatus('dirty');
        }
        setProjectMessage(
          mode === 'auto' ? 'Proyecto autoguardado' : 'Proyecto guardado localmente'
        );
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Error al guardar');
        setSaveStatus('error');
        setProjectMessage('Error al guardar el proyecto');
      }
    },
    [activeProject, setActiveProject, subtitleBlocks]
  );

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (!autoSaveEnabled || saveStatus !== 'dirty' || !activeProject) {
      return;
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void persistActiveProject('auto');
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeProject, autoSaveEnabled, persistActiveProject, saveStatus, subtitleBlocks]);

  const refreshHistory = async (): Promise<void> => {
    setIsHistoryLoading(true);

    try {
      setSavedProjects(await projectStorage.listProjects());
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleOpenHistory = async (): Promise<void> => {
    setIsHistoryModalOpen(true);
    await refreshHistory();
  };

  const handleSaveProject = async (): Promise<void> => {
    await persistActiveProject('manual');
  };

  const handleOpenProject = async (projectId: string): Promise<void> => {
    const project = await projectStorage.openProject(projectId);

    if (project) {
      setActiveProject(project);
      setSubtitleBlocks(project.subtitleBlocks);
      dirtyRevisionRef.current = 0;
      setLastSavedAt(new Date(project.updatedAt));
      setSaveStatus('saved');
      setSaveError('');
      setProjectMessage('Proyecto cargado desde historial');
      setIsHistoryModalOpen(false);
    }
  };

  const handleDeleteProject = async (project: ProjectSummary): Promise<void> => {
    const confirmed = window.confirm(`Eliminar "${project.name}" del historial?`);

    if (!confirmed) {
      return;
    }

    await projectStorage.deleteProject(project.id);

    if (activeProject?.id === project.id) {
      setActiveProject(null);
      setSubtitleBlocks([]);
      dirtyRevisionRef.current = 0;
      setLastSavedAt(null);
      setSaveStatus('saved');
      setProjectMessage('Proyecto eliminado');
    }

    await refreshHistory();
  };

  const handleSelectMedia = async (kind: MediaKind): Promise<void> => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de cargar multimedia');
      setIsNewProjectModalOpen(true);
      return;
    }

    const mediaFile = await mediaService.selectFile(kind);
    if (!mediaFile) {
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      audioPath: kind === 'audio' ? mediaFile.path : project.audioPath,
      videoPath: kind === 'video' ? mediaFile.path : project.videoPath,
      backgroundPath: kind === 'background' ? mediaFile.path : project.backgroundPath,
      coverPath: kind === 'cover' ? mediaFile.path : project.coverPath,
      updatedAt: new Date().toISOString()
    }));

    markUnsaved();
    setProjectMessage(`${mediaFile.name} cargado en el proyecto`);
  };

  const handleExtractCoverFrame = async (): Promise<void> => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de seleccionar portada');
      setIsNewProjectModalOpen(true);
      return;
    }

    if (!activeProject.videoPath) {
      setProjectMessage('Carga un video antes de seleccionar un frame como portada');
      return;
    }

    try {
      const result = await exportService.extractCoverFrame({
        projectId: activeProject.id,
        videoPath: activeProject.videoPath,
        currentTime
      });

      updateActiveProject((project) => ({
        ...project,
        coverPath: result.coverPath,
        updatedAt: new Date().toISOString()
      }));
      markUnsaved();
      setProjectMessage('Frame seleccionado como portada');
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : 'Error al generar portada');
    }
  };

  const handleChangeVideoFormat = (videoFormat: VideoFormat): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de cambiar el formato');
      setIsNewProjectModalOpen(true);
      return;
    }

    const preset = getVideoFormatPreset(videoFormat);

    updateActiveProject((project) => ({
      ...project,
      videoFormat,
      width: preset.width,
      height: preset.height,
      subtitleStyle: createDefaultSubtitleStyle(preset.width, preset.height),
      updatedAt: new Date().toISOString()
    }));

    markUnsaved();
    setProjectMessage(`Formato actualizado a ${preset.shortLabel} (${preset.width}x${preset.height})`);
  };

  const handleChangeSubtitleStyle = (updates: Partial<SubtitleStyle>): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de editar subtitulos');
      setIsNewProjectModalOpen(true);
      return;
    }

    updateActiveProject((project) => {
      const currentStyle =
        project.subtitleStyle ?? createDefaultSubtitleStyle(project.width, project.height);
      const nextStyle: SubtitleStyle = {
        ...currentStyle,
        ...updates
      };

      if (currentStyle.moveTogether) {
        if (updates.xOriginal !== undefined && updates.xTranslation === undefined) {
          const offsetX = updates.xOriginal - currentStyle.xOriginal;
          nextStyle.xTranslation = currentStyle.xTranslation + offsetX;
        }

        if (updates.yOriginal !== undefined && updates.yTranslation === undefined) {
          const offsetY = updates.yOriginal - currentStyle.yOriginal;
          nextStyle.yTranslation = currentStyle.yTranslation + offsetY;
        }
      }

      return {
        ...project,
        subtitleStyle: clampSubtitleStyle(nextStyle, project.width, project.height),
        updatedAt: new Date().toISOString()
      };
    });
    markUnsaved();
  };

  const handleCenterSubtitles = (): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de editar subtitulos');
      setIsNewProjectModalOpen(true);
      return;
    }

    handleChangeSubtitleStyle({
      xOriginal: Math.round(activeProject.width / 2),
      xTranslation: Math.round(activeProject.width / 2)
    });
  };

  const handleSendSubtitlesTop = (): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de editar subtitulos');
      setIsNewProjectModalOpen(true);
      return;
    }

    handleChangeSubtitleStyle({
      yOriginal: Math.round(activeProject.height * 0.16),
      yTranslation: Math.round(activeProject.height * 0.23)
    });
  };

  const handleSendSubtitlesBottom = (): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de editar subtitulos');
      setIsNewProjectModalOpen(true);
      return;
    }

    handleChangeSubtitleStyle({
      yOriginal: Math.round(activeProject.height * 0.8),
      yTranslation: Math.round(activeProject.height * 0.87)
    });
  };

  const handleResetSubtitleStyle = (): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de editar subtitulos');
      setIsNewProjectModalOpen(true);
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      subtitleStyle: createDefaultSubtitleStyle(project.width, project.height),
      updatedAt: new Date().toISOString()
    }));
    markUnsaved();
  };

  const handleApplySubtitleStylePreset = (presetId: SubtitleStylePresetId): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de aplicar estilos');
      setIsNewProjectModalOpen(true);
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      subtitleStyle: getSubtitleStylePreset(presetId, project.width, project.height),
      updatedAt: new Date().toISOString()
    }));
    markUnsaved();
    setProjectMessage('Estilo de subtitulos aplicado');
  };

  const handleChangeAutoSave = (enabled: boolean): void => {
    setAutoSaveEnabled(enabled);
    void projectStorage.updateSettings({ autoSaveEnabled: enabled }).catch((error) => {
      setSaveError(error instanceof Error ? error.message : 'Error al guardar configuracion');
      setSaveStatus('error');
    });
  };

  const handleAddCustomFont = async (): Promise<void> => {
    try {
      const font = await fontService.add();

      if (font) {
        setCustomFonts(await fontService.list());
        setProjectMessage(`Fuente agregada: ${font.name}`);
      }
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : 'Error al agregar fuente');
    }
  };

  const handleOpenAddLyrics = (): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de agregar texto');
      setIsNewProjectModalOpen(true);
      return;
    }

    setIsAddLyricsModalOpen(true);
  };

  const applyTranslationsToBlocks = (translations: string[]): void => {
    setSubtitleBlocks((currentBlocks) =>
      currentBlocks.map((block, index) => ({
        ...block,
        translatedText: translations[index] ?? block.translatedText
      }))
    );
    touchProject();
  };

  const handleCreateSubtitleBlocks = (
    lines: string[],
    timingMode: AutomaticTimingMode,
    translations?: string[]
  ): void => {
    if (!activeProject) {
      return;
    }

    const nextStartOrder = subtitleBlocks.length + 1;
    const timings = assignSubtitleTimings({
      blockCount: lines.length,
      mode: timingMode
    });
    const nextBlocks = lines.map<SubtitleBlock>((line, index) => ({
      id: createSubtitleBlockId(),
      projectId: activeProject.id,
      order: nextStartOrder + index,
      startTime: timings[index]?.startTime ?? 0,
      endTime: timings[index]?.endTime ?? 0,
      originalText: line,
      translatedText: translations?.[index] ?? '',
      enabled: true
    }));

    setSubtitleBlocks((currentBlocks) => [...currentBlocks, ...nextBlocks]);
    updateActiveProject((project) => ({
      ...project,
      updatedAt: new Date().toISOString()
    }));
    markUnsaved();
    setIsAddLyricsModalOpen(false);
    setProjectMessage(
      translations
        ? `${nextBlocks.length} bloques creados con traduccion`
        : `${nextBlocks.length} bloques creados con tiempos iniciales`
    );
  };

  const touchProject = (): void => {
    updateActiveProject((project) => ({
      ...project,
      updatedAt: new Date().toISOString()
    }));
    markUnsaved();
  };

  const handleChangeSubtitleBlock = (
    blockId: string,
    updates: Partial<SubtitleBlock>
  ): void => {
    setSubtitleBlocks((currentBlocks) =>
      currentBlocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const nextBlock = {
          ...block,
          ...updates
        };
        const nextStartTime =
          updates.startTime !== undefined ? updates.startTime : nextBlock.startTime;
        const nextEndTime = updates.endTime !== undefined ? updates.endTime : nextBlock.endTime;

        return {
          ...nextBlock,
          ...normalizeTimeRange(nextStartTime, nextEndTime)
        };
      })
    );
    touchProject();
  };

  const handleShiftSubtitleBlockTime = (blockId: string, offset: number): void => {
    setSubtitleBlocks((currentBlocks) =>
      currentBlocks.map((block) => (block.id === blockId ? shiftSubtitleBlock(block, offset) : block))
    );
    touchProject();
  };

  const splitText = (text: string): [string, string] | null => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return null;
    }

    const words = trimmedText.split(/\s+/);
    if (words.length < 2) {
      return null;
    }

    const splitIndex = Math.ceil(words.length / 2);
    return [words.slice(0, splitIndex).join(' '), words.slice(splitIndex).join(' ')];
  };

  const handleSplitSubtitleBlock = (blockId: string): void => {
    let didSplit = false;

    setSubtitleBlocks((currentBlocks) => {
      const blockIndex = currentBlocks.findIndex((block) => block.id === blockId);
      const block = currentBlocks[blockIndex];

      if (!block) {
        return currentBlocks;
      }

      const splitOriginalText = splitText(block.originalText);
      if (!splitOriginalText) {
        setProjectMessage('No hay suficiente texto para dividir el bloque');
        return currentBlocks;
      }

      const splitTranslatedText = block.translatedText.trim()
        ? splitText(block.translatedText) ?? [block.translatedText, '']
        : ['', ''];
      const midpoint = block.startTime + (block.endTime - block.startTime) / 2;
      const firstBlock: SubtitleBlock = {
        ...block,
        originalText: splitOriginalText[0],
        translatedText: splitTranslatedText[0],
        endTime: Math.max(block.startTime + 0.001, midpoint)
      };
      const secondBlock: SubtitleBlock = {
        ...block,
        id: createSubtitleBlockId(),
        originalText: splitOriginalText[1],
        translatedText: splitTranslatedText[1],
        startTime: Math.max(firstBlock.endTime, midpoint),
        endTime: Math.max(firstBlock.endTime + 0.001, block.endTime)
      };

      setProjectMessage('Bloque dividido');
      didSplit = true;
      return reorderSubtitleBlocks([
        ...currentBlocks.slice(0, blockIndex),
        firstBlock,
        secondBlock,
        ...currentBlocks.slice(blockIndex + 1)
      ]);
    });

    if (didSplit) {
      touchProject();
    }
  };

  const handleJoinSubtitleBlockWithNext = (blockId: string): void => {
    let didJoin = false;

    setSubtitleBlocks((currentBlocks) => {
      const blockIndex = currentBlocks.findIndex((block) => block.id === blockId);
      const block = currentBlocks[blockIndex];
      const nextBlock = currentBlocks[blockIndex + 1];

      if (!block || !nextBlock) {
        return currentBlocks;
      }

      const joinedBlock: SubtitleBlock = {
        ...block,
        originalText: [block.originalText, nextBlock.originalText].filter(Boolean).join('\n'),
        translatedText: [block.translatedText, nextBlock.translatedText].filter(Boolean).join('\n'),
        endTime: Math.max(block.endTime, nextBlock.endTime),
        enabled: block.enabled || nextBlock.enabled
      };

      setProjectMessage('Bloque unido con el siguiente');
      didJoin = true;
      return reorderSubtitleBlocks([
        ...currentBlocks.slice(0, blockIndex),
        joinedBlock,
        ...currentBlocks.slice(blockIndex + 2)
      ]);
    });

    if (didJoin) {
      touchProject();
    }
  };

  const handleDeleteSubtitleBlock = (blockId: string): void => {
    setSubtitleBlocks((currentBlocks) =>
      reorderSubtitleBlocks(currentBlocks.filter((block) => block.id !== blockId))
    );
    setProjectMessage('Bloque eliminado');
    touchProject();
  };

  const handleToggleSubtitleBlock = (blockId: string): void => {
    setSubtitleBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              enabled: !block.enabled
            }
          : block
      )
    );
    touchProject();
  };

  const handleApplyTranslation = (translations: string[]): void => {
    if (subtitleBlocks.length === 0) {
      setProjectMessage('Crea bloques originales antes de agregar traduccion');
      return;
    }

    if (translations.length !== subtitleBlocks.length) {
      setProjectMessage(
        `La traduccion tiene ${translations.length} bloques, pero el texto original tiene ${subtitleBlocks.length}`
      );
      return;
    }

    applyTranslationsToBlocks(translations);
    setIsAddLyricsModalOpen(false);
    setProjectMessage(`${translations.length} bloques traducidos actualizados`);
  };

  return (
    <main className="editor-page">
      <TopBar
        activeProjectName={activeProject?.name}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenHistory={() => {
          void handleOpenHistory();
        }}
        onSaveProject={() => {
          void handleSaveProject();
        }}
        onExportProject={() => setIsExportModalOpen(true)}
      />

      <div className="editor-page__status" role="status">
        <span>{projectMessage}</span>
        <strong className={`editor-page__save-status is-${saveStatus}`}>{saveStatusLabel}</strong>
      </div>

      <section className="editor-page__workspace" aria-label="Editor de video musical">
        <div className="editor-page__main">
          <PreviewCanvas
            activeProject={activeProject}
            activeSubtitleBlock={activeSubtitleBlock}
            mediaRef={mediaRef}
          />
          <PlaybackControls
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            hasMedia={Boolean(mediaUrl)}
            onPlay={play}
            onPause={pause}
            onSeek={seek}
          />
          <SubtitleBlocksPanel
            blocks={subtitleBlocks}
            onAddText={handleOpenAddLyrics}
            onChangeBlock={handleChangeSubtitleBlock}
            onShiftBlockTime={handleShiftSubtitleBlockTime}
            onSplitBlock={handleSplitSubtitleBlock}
            onJoinWithNext={handleJoinSubtitleBlockWithNext}
            onDeleteBlock={handleDeleteSubtitleBlock}
            onToggleBlock={handleToggleSubtitleBlock}
          />
        </div>

        <SettingsPanel
          activeProject={activeProject}
          onSelectAudio={() => {
            void handleSelectMedia('audio');
          }}
          onSelectVideo={() => {
            void handleSelectMedia('video');
          }}
          onSelectBackground={() => {
            void handleSelectMedia('background');
          }}
          onSelectCover={() => {
            void handleSelectMedia('cover');
          }}
          onExtractCoverFrame={() => {
            void handleExtractCoverFrame();
          }}
          onChangeVideoFormat={handleChangeVideoFormat}
          onChangeSubtitleStyle={handleChangeSubtitleStyle}
          onCenterSubtitles={handleCenterSubtitles}
          onSendSubtitlesTop={handleSendSubtitlesTop}
          onSendSubtitlesBottom={handleSendSubtitlesBottom}
          onResetSubtitleStyle={handleResetSubtitleStyle}
          onApplySubtitleStylePreset={handleApplySubtitleStylePreset}
          customFonts={customFonts}
          onAddCustomFont={() => {
            void handleAddCustomFont();
          }}
          autoSaveEnabled={autoSaveEnabled}
          onChangeAutoSave={handleChangeAutoSave}
        />
      </section>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(input) => {
          createNewProject(input);
          setSubtitleBlocks([]);
          dirtyRevisionRef.current = 1;
          setLastSavedAt(null);
          setSaveStatus('dirty');
          setSaveError('');
          setProjectMessage('Proyecto creado en memoria');
          setIsNewProjectModalOpen(false);
        }}
      />

      <AddLyricsModal
        isOpen={isAddLyricsModalOpen}
        onClose={() => setIsAddLyricsModalOpen(false)}
        mediaDuration={duration}
        existingOriginalLines={subtitleBlocks.map((block) => block.originalText)}
        onCreateBlocks={handleCreateSubtitleBlocks}
        onApplyTranslation={handleApplyTranslation}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        project={activeProject}
        subtitleBlocks={subtitleBlocks}
        customFonts={customFonts}
        onClose={() => setIsExportModalOpen(false)}
      />

      {!isVideoPlayback && mediaUrl ? (
        <audio ref={mediaRef as RefObject<HTMLAudioElement>} src={mediaUrl} />
      ) : null}

      <HistoryModal
        isOpen={isHistoryModalOpen}
        projects={savedProjects}
        isLoading={isHistoryLoading}
        onClose={() => setIsHistoryModalOpen(false)}
        onOpenProject={(projectId) => {
          void handleOpenProject(projectId);
        }}
        onDeleteProject={(project) => {
          void handleDeleteProject(project);
        }}
      />
    </main>
  );
};
