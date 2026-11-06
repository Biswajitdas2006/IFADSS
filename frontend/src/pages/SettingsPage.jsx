import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { getCurrentUser } from '../services/authService';
import './settings.css';

function getInitials(name, email) {
  const displayName = name?.trim();
  if (displayName) {
    return displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  return email?.[0]?.toUpperCase() || 'U';
}

export default function SettingsPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileRefresh, setProfileRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const result = await getCurrentUser(token);
        if (!cancelled) setProfile(result);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.error?.message ||
            'We could not load the latest account details.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token, profileRefresh]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const fullName = profile?.fullName || profile?.name || '';
  const email = profile?.email || user?.email || '';
  const role = profile?.role || user?.role || 'User';
  const companyName = profile?.companyName || '';
  const userId = profile?.id || user?.id || '';

  return (
    <AppLayout>
      <div className="settings-page">
        <header className="settings-header page-header">
          <div>
            <span className="settings-eyebrow">ACCOUNT & SECURITY</span>
            <h1>Settings</h1>
            <p>Review the account details and access associated with IFADSS.</p>
          </div>
        </header>

        {error && (
          <div className="settings-notice" role="status">
            <span>{error} Showing the account details available from your current session.</span>
            <button
              type="button"
              onClick={() => setProfileRefresh((current) => current + 1)}
            >
              Retry
            </button>
          </div>
        )}

        <section className="settings-card profile-card" aria-labelledby="profile-heading">
          <div className="settings-card-heading">
            <div>
              <span className="settings-section-kicker">PERSONAL INFORMATION</span>
              <h2 id="profile-heading">Your profile</h2>
              <p>Account details associated with your IFADSS login.</p>
            </div>
            {loading && <span className="settings-loading">Refreshing…</span>}
          </div>

          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">
              {getInitials(fullName, email)}
            </div>
            <div className="profile-name-block">
              <strong>{fullName || 'IFADSS user'}</strong>
              <span>{email || 'Email not available'}</span>
            </div>
            <span className="profile-role">{role}</span>
          </div>

          <div className="settings-fields">
            <div className="settings-field">
              <span>Full name</span>
              <strong>{fullName || 'Not provided'}</strong>
            </div>
            <div className="settings-field">
              <span>Email address</span>
              <strong>{email || 'Not available'}</strong>
            </div>
            <div className="settings-field">
              <span>Company</span>
              <strong>{companyName || 'Not provided'}</strong>
            </div>
            <div className="settings-field">
              <span>Account role</span>
              <strong>{role}</strong>
            </div>
          </div>

          <p className="settings-footnote">
            Profile details are managed by your account administrator. Profile editing is not available here yet.
          </p>
        </section>

        <section className="settings-card access-card" aria-labelledby="access-heading">
          <div className="settings-card-heading">
            <div>
              <span className="settings-section-kicker">ACCESS & SECURITY</span>
              <h2 id="access-heading">Account access</h2>
              <p>Review your current session and sign out when you are finished.</p>
            </div>
            <span className="access-status">
              <span className="access-status-dot" />
              Signed in
            </span>
          </div>

          <div className="access-details">
            <div className="access-detail-icon" aria-hidden="true">✓</div>
            <div>
              <strong>Signed-in session</strong>
              <p>Workspace access is associated with this signed-in account.</p>
            </div>
          </div>

          {userId && (
            <div className="settings-field account-id-field">
              <span>Account ID</span>
              <code>{userId}</code>
            </div>
          )}

          <div className="settings-card-footer">
            <p>Signing out will end this session on this device.</p>
            <button type="button" className="settings-logout-button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </section>

        <aside className="settings-help">
          <div className="settings-help-icon" aria-hidden="true">i</div>
          <div>
            <strong>Need to change your account details?</strong>
            <p>Contact your account administrator. Profile editing and password management are not available in this version.</p>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
