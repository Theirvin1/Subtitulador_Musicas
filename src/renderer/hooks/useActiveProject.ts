import { useCallback, useState } from 'react';
import { createDefaultSubtitleStyle } from '../../shared/constants/subtitleStyle';
import { DEFAULT_FPS, DEFAULT_VIDEO_FORMAT, getVideoFormatPreset } from '../../shared/constants/videoFormats';
import type { Project, VideoFormat } from '../../shared/types/project';

type CreateProjectInput = {
  name: string;
  videoFormat: VideoFormat;
};

type ActiveProjectState = {
  activeProject: Project | null;
  createNewProject: (input: CreateProjectInput) => Project;
  setActiveProject: (project: Project | null) => void;
  updateActiveProject: (updater: (project: Project) => Project) => Project | null;
};

const createProjectId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}`;
};

export const useActiveProject = (): ActiveProjectState => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const createNewProject = useCallback((input: CreateProjectInput): Project => {
    const name = input.name.trim();
    const videoFormat = input.videoFormat || DEFAULT_VIDEO_FORMAT;
    const preset = getVideoFormatPreset(videoFormat);
    const now = new Date().toISOString();

    const project: Project = {
      id: createProjectId(),
      name,
      videoFormat,
      width: preset.width,
      height: preset.height,
      fps: DEFAULT_FPS,
      subtitleStyle: createDefaultSubtitleStyle(preset.width, preset.height),
      subtitleBlocks: [],
      createdAt: now,
      updatedAt: now
    };

    setActiveProject(project);
    return project;
  }, []);

  const updateActiveProject = useCallback((updater: (project: Project) => Project): Project | null => {
    let updatedProject: Project | null = null;

    setActiveProject((currentProject) => {
      if (!currentProject) {
        return currentProject;
      }

      updatedProject = updater(currentProject);
      return updatedProject;
    });

    return updatedProject;
  }, []);

  return {
    activeProject,
    createNewProject,
    setActiveProject,
    updateActiveProject
  };
};
