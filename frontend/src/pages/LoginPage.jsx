import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.brand}>FinFlow</div>
        <h1 style={styles.title}>Log in to your account</h1>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
          placeholder="you@business.com"
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
          placeholder="••••••••"
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: theme.colors.surfaceWash,
    fontFamily: theme.fonts.body,
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: '40px',
    borderRadius: theme.radius.lg,
    width: '360px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadow.level2,
  },
  brand: {
    color: theme.colors.primaryEmerald,
    fontFamily: theme.fonts.display,
    fontSize: '20px',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '8px',
  },
  title: {
    color: theme.colors.inkBase,
    fontFamily: theme.fonts.display,
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '20px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    color: theme.colors.secondarySlate,
    fontSize: '13px',
    marginBottom: '6px',
    marginTop: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.white,
    color: theme.colors.inkBase,
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: theme.fonts.body,
  },
  button: {
    width: '100%',
    marginTop: '24px',
    padding: '12px',
    borderRadius: theme.radius.sm,
    border: 'none',
    backgroundColor: theme.colors.primaryEmerald,
    color: theme.colors.white,
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    color: theme.colors.error,
    padding: '10px',
    borderRadius: theme.radius.sm,
    fontSize: '13px',
    marginBottom: '10px',
    border: `1px solid ${theme.colors.error}`,
  },
  footerText: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '13px',
    color: theme.colors.textMuted,
  },
  link: {
    color: theme.colors.primaryEmerald,
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default LoginPage;