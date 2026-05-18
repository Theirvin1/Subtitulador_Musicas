import { EditorPage } from './pages/EditorPage';

export const App = (): JSX.Element => {
  if (!window.subMusic) {
    return (
      <main className="runtime-notice">
        <section className="runtime-notice__panel" aria-label="Ejecutar como app de escritorio">
          <span className="runtime-notice__mark">LS</span>
          <div>
            <p>Esta app se ejecuta con Electron</p>
            <h1>Abrela como aplicacion de escritorio</h1>
            <span>
              La vista en localhost solo muestra el renderer. Para usar proyectos, archivos,
              SQLite y exportacion, ejecuta npm run dev desde la carpeta del proyecto.
            </span>
          </div>
          <code>npm run dev</code>
        </section>
      </main>
    );
  }

  return <EditorPage />;
};
