import { useState } from 'react';
import { AddLyricsModal } from '../components/AddLyricsModal';
import { HistoryModal } from '../components/HistoryModal';
import { PlaybackControls } from '../components/PlaybackControls';
import { NewProjectModal } from '../components/NewProjectModal';
import { PreviewCanvas } from '../components/PreviewCanvas';
import { SettingsPanel } from '../components/SettingsPanel';
import { SubtitleBlocksPanel } from '../components/SubtitleBlocksPanel';
import { TopBar } from '../components/TopBar';
import { useActiveProject } from '../hooks/useActiveProject';
import { mediaService } from '../services/mediaService';
import { projectStorage } from '../services/projectStorage';
import { getVideoFormatPreset } from '../../shared/constants/videoFormats';
import type { MediaKind } from '../../shared/types/media';
import type { ProjectSummary, SubtitleBlock, VideoFormat } from '../../shared/types/project';

const createSubtitleBlockId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `subtitle-block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

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
      updatedAt: new Date().toISOString()
    }));

    setProjectMessage(`Formato actualizado a ${preset.shortLabel} (${preset.width}x${preset.height})`);
  };

  const handleOpenAddLyrics = (): void => {
    if (!activeProject) {
      setProjectMessage('Crea un proyecto antes de agregar texto');
      setIsNewProjectModalOpen(true);
      return;
    }

    setIsAddLyricsModalOpen(true);
  };

  const handleCreateSubtitleBlocks = (lines: string[]): void => {
    if (!activeProject) {
      return;
    }

    const nextStartOrder = subtitleBlocks.length + 1;
    const nextBlocks = lines.map<SubtitleBlock>((line, index) => ({
      id: createSubtitleBlockId(),
      projectId: activeProject.id,
      order: nextStartOrder + index,
      startTime: 0,
      endTime: 0,
      originalText: line,
      translatedText: '',
      enabled: true
    }));

    setSubtitleBlocks((currentBlocks) => [...currentBlocks, ...nextBlocks]);
    updateActiveProject((project) => ({
      ...project,
      updatedAt: new Date().toISOString()
    }));
    setIsAddLyricsModalOpen(false);
    setProjectMessage(`${nextBlocks.length} bloques de letra original creados`);
  };

  const handleUpdateSubtitleBlock = (blockId: string, text: string): void => {
    setSubtitleBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              originalText: text
            }
          : block
      )
    );
    updateActiveProject((project) => ({
      ...project,
      updatedAt: new Date().toISOString()
    }));
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
          <PreviewCanvas activeProject={activeProject} />
          <PlaybackControls />
          <SubtitleBlocksPanel
            blocks={subtitleBlocks}
            onAddText={handleOpenAddLyrics}
            onUpdateBlock={handleUpdateSubtitleBlock}
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
        onCreateBlocks={handleCreateSubtitleBlocks}
      />

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
