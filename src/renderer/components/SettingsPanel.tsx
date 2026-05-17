const videoFormats = ['Horizontal 16:9', 'Vertical 9:16', 'Cuadrado 1:1'];
const subtitleStyles = ['Cine limpio', 'Karaoke suave', 'Bilingue clasico'];

export const SettingsPanel = (): JSX.Element => {
  return (
    <aside className="settings-panel" aria-label="Configuracion del proyecto">
      <div className="settings-panel__header">
        <p>Configuracion</p>
        <span>Proyecto</span>
      </div>

      <section className="settings-panel__group">
        <h2>Formato</h2>
        <div className="settings-panel__options">
          {videoFormats.map((format, index) => (
            <button
              key={format}
              type="button"
              className={index === 0 ? 'settings-panel__option is-active' : 'settings-panel__option'}
            >
              {format}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-panel__group">
        <h2>Subtitulos</h2>
        <label className="settings-panel__field">
          <span>Estilo visual</span>
          <select defaultValue={subtitleStyles[0]}>
            {subtitleStyles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </label>
        <label className="settings-panel__field">
          <span>Tamano de texto</span>
          <input type="range" min="24" max="72" defaultValue="42" />
        </label>
        <label className="settings-panel__toggle">
          <input type="checkbox" defaultChecked />
          <span>Mostrar traduccion</span>
        </label>
      </section>

      <section className="settings-panel__group">
        <h2>Audio</h2>
        <div className="settings-panel__meter" aria-label="Nivel de audio simulado">
          <span style={{ height: '42%' }} />
          <span style={{ height: '68%' }} />
          <span style={{ height: '54%' }} />
          <span style={{ height: '82%' }} />
          <span style={{ height: '47%' }} />
          <span style={{ height: '64%' }} />
        </div>
      </section>
    </aside>
  );
};
