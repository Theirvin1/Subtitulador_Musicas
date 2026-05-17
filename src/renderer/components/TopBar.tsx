import { APP_ALIAS, APP_NAME } from '../../shared/constants/app';

const actions = ['Nuevo', 'Abrir', 'Historial', 'Guardar', 'Exportar'];

type TopBarProps = {
  activeProjectName?: string;
  onNewProject: () => void;
  onOpenHistory: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
};

export const TopBar = ({
  activeProjectName,
  onNewProject,
  onOpenHistory,
  onSaveProject,
  onExportProject
}: TopBarProps): JSX.Element => {
  const actionHandlers: Record<string, (() => void) | undefined> = {
    Nuevo: onNewProject,
    Historial: onOpenHistory,
    Guardar: onSaveProject,
    Exportar: onExportProject
  };

  return (
    <header className="top-bar">
      <div className="top-bar__brand">
        <span className="top-bar__mark">LS</span>
        <div>
          <strong>{APP_NAME}</strong>
          <span>{APP_ALIAS}</span>
        </div>
      </div>

      <div className="top-bar__project" aria-label="Proyecto activo">
        <span>Proyecto activo</span>
        <strong>{activeProjectName ?? 'Sin proyecto'}</strong>
      </div>

      <nav className="top-bar__actions" aria-label="Acciones del proyecto">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className="top-bar__button"
            onClick={actionHandlers[action]}
          >
            {action}
          </button>
        ))}
      </nav>
    </header>
  );
};
