import { PlaybackControls } from '../components/PlaybackControls';
import { PreviewCanvas } from '../components/PreviewCanvas';
import { SettingsPanel } from '../components/SettingsPanel';
import { SubtitleBlocksPanel } from '../components/SubtitleBlocksPanel';
import { TopBar } from '../components/TopBar';

export const EditorPage = (): JSX.Element => {
  return (
    <main className="editor-page">
      <TopBar />

      <section className="editor-page__workspace" aria-label="Editor de video musical">
        <div className="editor-page__main">
          <PreviewCanvas />
          <PlaybackControls />
          <SubtitleBlocksPanel />
        </div>

        <SettingsPanel />
      </section>
    </main>
  );
};
