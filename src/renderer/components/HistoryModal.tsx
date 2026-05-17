import type { ProjectSummary } from '../../shared/types/project';

type HistoryModalProps = {
  isOpen: boolean;
  projects: ProjectSummary[];
  isLoading: boolean;
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (project: ProjectSummary) => void;
};

const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

export const HistoryModal = ({
  isOpen,
  projects,
  isLoading,
  onClose,
  onOpenProject,
  onDeleteProject
}: HistoryModalProps): JSX.Element | null => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="history-modal__header">
          <div>
            <p id="history-title">Historial</p>
            <span>Proyectos guardados localmente</span>
          </div>
          <button type="button" aria-label="Cerrar historial" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="history-modal__content">
          {isLoading ? (
            <p className="history-modal__empty">Cargando proyectos...</p>
          ) : projects.length === 0 ? (
            <p className="history-modal__empty">Todavia no hay proyectos guardados.</p>
          ) : (
            <div className="history-modal__list">
              {projects.map((project) => (
                <article key={project.id} className="history-project">
                  <div className="history-project__main">
                    <strong>{project.name}</strong>
                    <span>
                      {project.width}x{project.height} · {project.fps} FPS
                    </span>
                  </div>
                  <div className="history-project__date">
                    <span>Creado</span>
                    <strong>{formatDate(project.createdAt)}</strong>
                  </div>
                  <div className="history-project__date">
                    <span>Editado</span>
                    <strong>{formatDate(project.updatedAt)}</strong>
                  </div>
                  <div className="history-project__actions">
                    <button type="button" onClick={() => onOpenProject(project.id)}>
                      Abrir
                    </button>
                    <button type="button" onClick={() => onDeleteProject(project)}>
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
