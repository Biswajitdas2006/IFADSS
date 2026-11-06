import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Link className="not-found-brand" to="/" aria-label="IFADSS home">
        <span className="brand-mark" aria-hidden="true">I</span>
        <span className="brand-wordmark">IFADSS</span>
      </Link>
      <p className="not-found-code">404</p>
      <h1>Page not found</h1>
      <p>The address may be incorrect, or the page may have moved.</p>
      <Link className="button" to="/">Return to IFADSS</Link>
    </main>
  );
}

export default NotFoundPage;
