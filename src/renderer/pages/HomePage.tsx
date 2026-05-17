import { APP_NAME, APP_SUBTITLE } from '../../shared/constants/app';
import { AppShell } from '../components/AppShell';

export const HomePage = (): JSX.Element => {
  return (
    <AppShell>
      <section className="home-page" aria-label="Pantalla inicial">
        <p className="home-page__eyebrow">Editor de subtitulos bilingues sincronizados</p>
        <h1>{APP_NAME}</h1>
        <p className="home-page__subtitle">{APP_SUBTITLE}</p>
      </section>
    </AppShell>
  );
};
