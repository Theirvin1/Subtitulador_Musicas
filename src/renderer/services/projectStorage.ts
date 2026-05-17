import type { Project, ProjectSummary } from '../../shared/types/project';

export const projectStorage = {
  saveProject(project: Project): Promise<Project> {
    return window.subMusic.projects.save(project);
  },
  listProjects(): Promise<ProjectSummary[]> {
    return window.subMusic.projects.list();
  },
  openProject(projectId: string): Promise<Project | null> {
    return window.subMusic.projects.open(projectId);
  },
  deleteProject(projectId: string): Promise<boolean> {
    return window.subMusic.projects.delete(projectId);
  }
};
