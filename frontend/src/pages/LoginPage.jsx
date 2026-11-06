import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import AuthVisual from '../components/auth/AuthVisual';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="auth-page">
      <AuthVisual />
      <section className="auth-content" aria-label="Log in">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="auth-card__eyebrow">Welcome back</p>
          <h1 className="auth-card__title">Log in to your account</h1>
          <p className="auth-card__subtitle">Sign in to review your invoices, transactions, and financial activity.</p>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-input-icon" aria-hidden="true" />
                <input
                  className="auth-input"
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@business.com"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" aria-hidden="true" />
                <input
                  className="auth-input"
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading && <span className="auth-button__spinner" aria-hidden="true" />}
            {loading ? 'Logging in...' : 'Log in'}
            {!loading && <FiArrowRight aria-hidden="true" />}
          </button>

          <p className="auth-card__footer">
            Don&apos;t have an account? <Link className="auth-link" to="/register">Register</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
