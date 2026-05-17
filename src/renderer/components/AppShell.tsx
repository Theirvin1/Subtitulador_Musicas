import type { PropsWithChildren } from 'react';

export const AppShell = ({ children }: PropsWithChildren): JSX.Element => {
  return <main className="app-shell">{children}</main>;
};
