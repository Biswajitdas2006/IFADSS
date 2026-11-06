import { FiMenu } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/invoices': 'Invoices',
  '/transactions': 'Transactions',
  '/anomalies': 'Anomalies',
  '/predictions': 'Predictions',
  '/settings': 'Settings',
};

function Topbar({ onMenuClick, navigationOpen }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const title = pageTitles[pathname] || (pathname.startsWith('/invoices/') ? 'Invoice details' : 'Workspace');

  return (
    <header className="workspace-topbar">
      <button
        className="mobile-menu-button"
        type="button"
        aria-label="Open navigation"
        aria-expanded={navigationOpen}
        aria-controls="workspace-sidebar"
        onClick={onMenuClick}
      >
        <FiMenu aria-hidden="true" />
      </button>
      <p className="workspace-topbar-title">{title}</p>
      <div className="workspace-user">
        <span className="workspace-user-email">{user?.email}</span>
        <span className="workspace-user-role">{user?.role}</span>
        <button className="workspace-signout" type="button" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Topbar;
