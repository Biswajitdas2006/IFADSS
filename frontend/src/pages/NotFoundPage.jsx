import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{ padding: '40px', color: '#F1F5F9', backgroundColor: '#0F172A', minHeight: '100vh', textAlign: 'center' }}>
      <h1>404 — Page not found</h1>
      <Link to="/login" style={{ color: '#10B981' }}>Go back to Login</Link>
    </div>
  );
}

export default NotFoundPage;