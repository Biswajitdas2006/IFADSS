import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiCpu, FiShield } from 'react-icons/fi';

const IntelligenceExperience = lazy(() => import('./IntelligenceExperience'));

export default function HeroSection() {
  return (
    <section className="landing-hero" id="hero">
      <div className="landing-container landing-hero-grid">
        {/* Left Side: Editorial & Core Messaging */}
        <div className="landing-hero-copy">
          <div className="hero-eyebrow-container">
            <span className="hero-eyebrow-chip">
              <FiCpu className="hero-chip-icon" aria-hidden="true" />
              INTELLIGENCE IN MOTION 2.0
            </span>
          </div>

          <h1 className="hero-headline">
            Clarity for every financial decision.
          </h1>

          <p className="landing-hero-description">
            Turn invoices into organized activity, review what needs attention,
            and explore cash-flow forecasts — all in one considered workspace.
          </p>

          <div className="landing-hero-actions">
            <Link className="landing-button landing-button-primary hero-btn-main" to="/register">
              <span>Create your account</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
            <a className="landing-button landing-button-secondary hero-btn-sub" href="#capabilities">
              <span>Explore capabilities</span>
              <FiArrowRight aria-hidden="true" />
            </a>
          </div>

          {/* Trust & Verification Badges */}
          <div className="hero-trust-row">
            <div className="hero-assurance">
              <span className="hero-assurance-icon">
                <FiCheckCircle aria-hidden="true" />
              </span>
              <p>Built for informed review. Your team stays in control.</p>
            </div>
          </div>

          <div className="hero-highlights-strip">
            <div className="highlight-pill">
              <strong>99.4%</strong>
              <span>OCR Accuracy</span>
            </div>
            <div className="highlight-divider" />
            <div className="highlight-pill">
              <strong>Sub-second</strong>
              <span>Categorization</span>
            </div>
            <div className="highlight-divider" />
            <div className="highlight-pill">
              <strong>7–90 Days</strong>
              <span>Predictive Horizon</span>
            </div>
          </div>
        </div>

        {/* Right Side: Signature 3D Interactive Human Head & Document Emergence */}
        <div className="landing-hero-visual-stage">
          <Suspense
            fallback={
              <div className="intelligence-loading-stage" role="status">
                <div className="loading-spinner-ring" />
                <span>Initializing 3D Neural Architecture…</span>
              </div>
            }
          >
            <IntelligenceExperience />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

