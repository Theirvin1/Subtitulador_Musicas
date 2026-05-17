import { useState } from 'react';
import { PlaybackControls } from '../components/PlaybackControls';
import { NewProjectModal } from '../components/NewProjectModal';
import { PreviewCanvas } from '../components/PreviewCanvas';
import { SettingsPanel } from '../components/SettingsPanel';
import { SubtitleBlocksPanel } from '../components/SubtitleBlocksPanel';
import { TopBar } from '../components/TopBar';
import { useActiveProject } from '../hooks/useActiveProject';

export const EditorPage = (): JSX.Element => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { activeProject, createNewProject } = useActiveProject();

  return (
    <main className="editor-page">
      <TopBar
        activeProjectName={activeProject?.name}
        onNewProject={() => setIsNewProjectModalOpen(true)}
      />

      <section className="editor-page__workspace" aria-label="Editor de video musical">
        <div className="editor-page__main">
          <PreviewCanvas />
          <PlaybackControls />
          <SubtitleBlocksPanel />
        </div>

        <SettingsPanel activeProject={activeProject} />
      </section>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(input) => {
          createNewProject(input);
          setIsNewProjectModalOpen(false);
        }}
      />
    </main>
  );
};
