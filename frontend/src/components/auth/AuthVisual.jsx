import { Link } from 'react-router-dom';
import './auth.css';

const capabilities = [
  'Process invoices with OCR extraction',
  'Organize and review transaction categories',
  'Monitor unusual activity and cash-flow trends',
];

function AuthVisual() {
  return (
    <aside className="auth-visual">
      <Link className="auth-brand" to="/" aria-label="IFADSS home">
        <span className="brand-mark" aria-hidden="true">I</span>
        <span className="brand-wordmark">IFADSS</span>
      </Link>

      <div className="auth-visual-copy">
        <p className="auth-kicker">FINANCIAL OPERATIONS WORKSPACE</p>
        <h2>Bring your financial activity into focus.</h2>
        <p>
          Keep invoice processing, transaction records, anomaly reviews, and
          forecasts in one place.
        </p>
        <ul className="auth-capabilities">
          {capabilities.map((capability, index) => (
            <li key={capability}>
              <span aria-hidden="true">0{index + 1}</span>
              {capability}
            </li>
          ))}
        </ul>
      </div>

      <p className="auth-visual-foot">
        Intelligent Financial Automation and Decision Support System
      </p>
    </aside>
  );
}

export default AuthVisual;
