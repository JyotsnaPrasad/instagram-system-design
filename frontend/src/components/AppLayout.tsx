import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ResetDemoButton } from './ResetDemoButton';
import { UserList } from './UserList';
import { UserSwitcher } from './UserSwitcher';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="logo">
            Instaclone
          </Link>
          <div className="header-switcher">
            <UserSwitcher />
          </div>
          <div className="header-reset">
            <ResetDemoButton />
          </div>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-aside">
          <UserList />
        </aside>
        <main id="main" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
}
