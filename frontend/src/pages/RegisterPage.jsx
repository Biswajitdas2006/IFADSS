import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLayers, FiLock, FiMail, FiUser } from 'react-icons/fi';
import AuthVisual from '../components/auth/AuthVisual';
import { useAuth } from '../context/AuthContext';

function AuthBrand() {
  return (
    <div className="auth-card__brand" aria-label="FinFlow by IFADSS">
      <span className="auth-card__brand-mark"><FiArrowRight aria-hidden="true" /></span>
      <span>FinFlow</span>
      <small>by IFADSS</small>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(fullName, email, password, companyName);
      setSuccess(true);
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page--register">
      <AuthVisual />
      <section className="auth-content" aria-label={success ? 'Registration complete' : 'Create an account'}>
        {success ? (
          <div className="auth-card auth-success">
            <AuthBrand />
            <span className="auth-success__icon"><FiCheck aria-hidden="true" /></span>
            <p className="auth-card__eyebrow">You&apos;re all set</p>
            <h1 className="auth-card__title">Account created</h1>
            <p className="auth-card__subtitle">Your account has been registered successfully.</p>
            <Link className="auth-button" to="/login">Go to Log in <FiArrowRight aria-hidden="true" /></Link>
          </div>
        ) : (
          <form className="auth-card" onSubmit={handleSubmit}>
            <AuthBrand />
            <p className="auth-card__eyebrow">Get started</p>
            <h1 className="auth-card__title">Create your account</h1>
            <p className="auth-card__subtitle">Set up your account to explore your financial workspace.</p>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="auth-form">
              <div className="auth-field">
                <label className="auth-field__label" htmlFor="register-full-name">Full Name</label>
                <div className="auth-input-wrap">
                  <FiUser className="auth-input-icon" aria-hidden="true" />
                  <input
                    className="auth-input"
                    id="register-full-name"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="register-email">Email</label>
                <div className="auth-input-wrap">
                  <FiMail className="auth-input-icon" aria-hidden="true" />
                  <input
                    className="auth-input"
                    id="register-email"
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
                <label className="auth-field__label" htmlFor="register-company">
                  Company Name <span className="auth-field__optional">(optional)</span>
                </label>
                <div className="auth-input-wrap">
                  <FiLayers className="auth-input-icon" aria-hidden="true" />
                  <input
                    className="auth-input"
                    id="register-company"
                    type="text"
                    name="companyName"
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Jane's Bakery"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="register-password">Password</label>
                <div className="auth-input-wrap">
                  <FiLock className="auth-input-icon" aria-hidden="true" />
                  <input
                    className="auth-input"
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
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

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="register-confirm-password">Confirm Password</label>
                <div className="auth-input-wrap">
                  <FiLock className="auth-input-icon" aria-hidden="true" />
                  <input
                    className="auth-input"
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-invalid={passwordsMismatch}
                    aria-describedby={passwordsMismatch ? 'register-password-mismatch' : undefined}
                    placeholder="Re-enter your password"
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  </button>
                </div>
                {passwordsMismatch && <p className="auth-match-message" id="register-password-mismatch" role="status">Passwords do not match yet.</p>}
              </div>
            </div>

            <button className="auth-button" type="submit" disabled={loading}>
              {loading && <span className="auth-button__spinner" aria-hidden="true" />}
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <FiArrowRight aria-hidden="true" />}
            </button>

            <p className="auth-card__footer">
              Already have an account? <Link className="auth-link" to="/login">Log in</Link>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}

export default RegisterPage;
