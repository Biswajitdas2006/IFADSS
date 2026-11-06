import { Link, NavLink } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiFileText,
  FiGrid,
  FiRepeat,
  FiSettings,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const primaryItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FiGrid },
  { label: 'Invoices', path: '/invoices', icon: FiFileText },
  { label: 'Transactions', path: '/transactions', icon: FiRepeat },
  { label: 'Anomalies', path: '/anomalies', icon: FiAlertTriangle, roles: ['Owner', 'Accountant'] },
  { label: 'Predictions', path: '/predictions', icon: FiTrendingUp, roles: ['Owner', 'Accountant'] },
];

function Sidebar({ isOpen, onNavigate }) {
  const { user } = useAuth();
  const visibleItems = primaryItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  );

  return (
    <aside
      className={`workspace-sidebar${isOpen ? ' is-open' : ''}`}
      aria-label="Workspace navigation"
      id="workspace-sidebar"
    >
      <Link className="workspace-brand" to="/dashboard" onClick={onNavigate} aria-label="IFADSS dashboard">
        <span className="brand-mark" aria-hidden="true">I</span>
        <span className="brand-wordmark">IFADSS</span>
      </Link>

      <button
        className="sidebar-close"
        type="button"
        aria-label="Close navigation"
        onClick={onNavigate}
      >
        <FiX aria-hidden="true" />
      </button>

      <p className="workspace-nav-label">Workspace</p>
      <nav className="workspace-nav" aria-label="Primary">
        {visibleItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            className={({ isActive }) => `workspace-nav-link${isActive ? ' active' : ''}`}
            key={path}
            to={path}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="workspace-nav-label">Account</p>
      <nav className="workspace-nav" aria-label="Account">
        <NavLink
          className={({ isActive }) => `workspace-nav-link${isActive ? ' active' : ''}`}
          to="/settings"
          onClick={onNavigate}
        >
          <FiSettings aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="workspace-sidebar-footer">
        Intelligent Financial Automation and Decision Support System
      </div>
    </aside>
  );
}

export default Sidebar;
