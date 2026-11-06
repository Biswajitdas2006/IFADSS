import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function FinalCtaSection() {
  return (
    <section className="landing-cta" aria-label="Get started with IFADSS">
      <div className="landing-container landing-cta-inner">
        <div className="landing-cta-content">
          <p className="landing-eyebrow cta-eyebrow">INTELLIGENT FINANCIAL PLATFORM</p>
          <h2 className="cta-headline">Bring your financial activity into focus.</h2>
          <p className="cta-description">
            Create an account to start organizing invoices, reviewing categorized transaction activity, and exploring cash-flow forecasts.
          </p>

          <div className="cta-trust-items">
            <span><FiCheckCircle aria-hidden="true" /> Instant onboarding</span>
            <span><FiCheckCircle aria-hidden="true" /> PDF, JPG, PNG OCR ready</span>
            <span><FiCheckCircle aria-hidden="true" /> Full team control</span>
          </div>
        </div>

        <div className="landing-cta-actions">
          <Link className="landing-button landing-button-light cta-primary-btn" to="/register">
            <span>Create account</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link className="landing-button landing-button-ghost-light" to="/login">
            <span>Sign in to workspace</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

