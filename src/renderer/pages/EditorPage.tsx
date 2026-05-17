import { useMemo, useState, type RefObject } from 'react';
import { AddLyricsModal } from '../components/AddLyricsModal';
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

export const EditorPage = (): JSX.Element => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAddLyricsModalOpen, setIsAddLyricsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<ProjectSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [projectMessage, setProjectMessage] = useState('Proyecto en memoria');
  const [subtitleBlocks, setSubtitleBlocks] = useState<SubtitleBlock[]>([]);
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
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de guardar');
      setIsNewProjectModalOpen(true);
      return;
    }

    const savedProject = await projectStorage.saveProject(activeProject);
    setActiveProject(savedProject);
    setProjectMessage('Proyecto guardado localmente');
  };

  const handleOpenProject = async (projectId: string): Promise<void> => {
    const project = await projectStorage.openProject(projectId);

    if (project) {
      setActiveProject(project);
      setSubtitleBlocks([]);
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
      updatedAt: new Date().toISOString()
    }));

    setProjectMessage(`${mediaFile.name} cargado en el proyecto`);
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
    setProjectMessage('Estilo de subtitulos aplicado');
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
      />

      <div className="editor-page__status" role="status">
        {projectMessage}
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
          onChangeVideoFormat={handleChangeVideoFormat}
          onChangeSubtitleStyle={handleChangeSubtitleStyle}
          onCenterSubtitles={handleCenterSubtitles}
          onSendSubtitlesTop={handleSendSubtitlesTop}
          onSendSubtitlesBottom={handleSendSubtitlesBottom}
          onResetSubtitleStyle={handleResetSubtitleStyle}
          onApplySubtitleStylePreset={handleApplySubtitleStylePreset}
        />
      </section>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(input) => {
          createNewProject(input);
          setSubtitleBlocks([]);
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
