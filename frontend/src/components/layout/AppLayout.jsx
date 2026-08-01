import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { theme } from '../../styles/theme';

function AppLayout({ children }) {
  return (
    <div style={styles.wrapper}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: theme.colors.surfaceWash },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  content: { padding: '32px' },
};

export default AppLayout;