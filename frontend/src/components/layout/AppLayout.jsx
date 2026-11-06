import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function AppLayout({ children }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const closeNavigation = () => setNavigationOpen(false);

  return (
    <div className="workspace-layout">
      <button
        className={`app-overlay${navigationOpen ? ' is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        tabIndex={navigationOpen ? 0 : -1}
        onClick={closeNavigation}
      />
      <Sidebar isOpen={navigationOpen} onNavigate={closeNavigation} />
      <div className="workspace-main">
        <Topbar
          navigationOpen={navigationOpen}
          onMenuClick={() => setNavigationOpen(true)}
        />
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
