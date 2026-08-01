import { NavLink } from 'react-router-dom';
import { theme } from '../../styles/theme';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Anomalies', path: '/anomalies' },
  { label: 'Predictions', path: '/predictions' },
];

const resourceItems = [
  { label: 'Settings', path: '/settings' },
];

function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandName}>FinFlow</div>
        <div style={styles.brandTag}>Institutional Grade</div>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.sectionLabel}>RESOURCES</div>
      <nav style={styles.nav}>
        {resourceItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    backgroundColor: theme.colors.white,
    borderRight: `1px solid ${theme.colors.border}`,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: theme.fonts.body,
  },
  brand: { padding: '0 8px', marginBottom: '28px' },
  brandName: {
    color: theme.colors.primaryEmerald,
    fontFamily: theme.fonts.display,
    fontSize: '20px',
    fontWeight: 700,
  },
  brandTag: {
    color: theme.colors.textMuted,
    fontSize: '11px',
    marginTop: '2px',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '2px' },
  navLink: {
    display: 'block',
    padding: '10px 12px',
    borderRadius: theme.radius.sm,
    color: theme.colors.inkBase,
    textDecoration: 'none',
    fontSize: '14px',
  },
  navLinkActive: {
    backgroundColor: theme.colors.surfaceWash,
    color: theme.colors.primaryEmerald,
    fontWeight: 600,
  },
  sectionLabel: {
    marginTop: '24px',
    marginBottom: '8px',
    padding: '0 12px',
    color: theme.colors.textMuted,
    fontSize: '11px',
    letterSpacing: '0.05em',
  },
};

export default Sidebar;