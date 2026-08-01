import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header style={styles.topbar}>
      <div />
      <div style={styles.userSection}>
        <span style={styles.email}>{user?.email}</span>
        <span style={styles.roleBadge}>{user?.role}</span>
        <button onClick={logout} style={styles.logoutButton}>
          Log out
        </button>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: theme.colors.white,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  userSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  email: { color: theme.colors.inkBase, fontSize: '14px', fontFamily: theme.fonts.body },
  roleBadge: {
    backgroundColor: theme.colors.surfaceWash,
    color: theme.colors.primaryEmerald,
    padding: '4px 10px',
    borderRadius: theme.radius.sm,
    fontSize: '12px',
    fontWeight: 600,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.secondarySlate,
    padding: '6px 14px',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: theme.fonts.body,
  },
};

export default Topbar;