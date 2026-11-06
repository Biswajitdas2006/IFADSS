import { Link } from 'react-router-dom';
import { FiArrowUp, FiCheckCircle, FiLock, FiShield, FiArrowRight } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer" id="footer">
      <div className="landing-container landing-footer-inner">
        {/* Brand & Purpose Column */}
        <div className="footer-brand-col">
          <Link className="landing-brand landing-brand--footer" to="/" aria-label="IFADSS home">
            <span className="landing-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path
                  d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8V16M8 12H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div className="brand-text-block">
              <strong className="brand-title">IFADSS</strong>
              <small className="footer-brand-full">
                Financial Intelligence Platform
              </small>
            </div>
          </Link>

          <p className="footer-mission-note">
            A unified fintech operations workspace combining autonomous multi-pass OCR extraction, continuous chart-of-accounts classification, and predictive cash-flow modeling with verified human-in-the-loop governance.
          </p>

          <div className="footer-status-pill">
            <span className="footer-status-dot" aria-hidden="true" />
            <span className="footer-status-text">All Systems Operational · Sub-400ms OCR</span>
          </div>
        </div>

        {/* Structured Navigation Columns */}
        <div className="footer-nav-columns">
          {/* Column 1: Platform */}
          <div className="footer-nav-group">
            <span className="footer-nav-heading">Platform</span>
            <a href="#product">Workspace Simulator</a>
            <a href="#workflow">5-Stage Pipeline</a>
            <a href="#capabilities">Capability Matrix</a>
            <a href="#metrics">Empirical Telemetry</a>
          </div>

          {/* Column 2: Intelligence */}
          <div className="footer-nav-group">
            <span className="footer-nav-heading">Intelligence</span>
            <a href="#hero">3D Neural Model</a>
            <a href="#workflow">Multi-pass OCR Engine</a>
            <a href="#workflow">COA Classification</a>
            <a href="#workflow">90-Day Cash Forecast</a>
          </div>

          {/* Column 3: Governance */}
          <div className="footer-nav-group">
            <span className="footer-nav-heading">Governance</span>
            <a href="#governance">Zero Auto-Verdicts</a>
            <a href="#governance">Cryptographic Checksums</a>
            <a href="#governance">SOC2 Type II Aligned</a>
            <a href="#governance">Audit Trail History</a>
          </div>

          {/* Column 4: Access */}
          <div className="footer-nav-group">
            <span className="footer-nav-heading">Access</span>
            <Link to="/login" className="footer-action-link">
              <span>Sign in</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
            <Link to="/register" className="footer-action-link">
              <span>Create account</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
            <Link to="/dashboard">Executive Dashboard</Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright, Compliance Badges, Back to Top */}
      <div className="landing-container footer-bottom-bar">
        <div className="footer-copyright-block">
          <p className="footer-copyright">
            © {currentYear} IFADSS Intelligence Systems Inc. All rights reserved. Built for informed financial review.
          </p>
          <div className="footer-badges-strip">
            <span className="footer-trust-badge">
              <FiShield aria-hidden="true" />
              <span>SOC2 Aligned</span>
            </span>
            <span className="footer-trust-badge">
              <FiLock aria-hidden="true" />
              <span>TLS 256-Bit Encrypted</span>
            </span>
            <span className="footer-trust-badge">
              <FiCheckCircle aria-hidden="true" />
              <span>Human Signed Off</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className="footer-back-to-top"
          onClick={scrollToTop}
          aria-label="Scroll back to top of page"
        >
          <span>Back to top</span>
          <FiArrowUp aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}

