import {
  FiCheck,
  FiCheckCircle,
  FiKey,
  FiLock,
  FiShield,
  FiSliders,
  FiUserCheck,
} from 'react-icons/fi';

export default function TrustSection() {
  return (
    <section className="landing-section trust-section" id="governance">
      <div className="landing-container">
        {/* Main Trust Banner */}
        <div className="trust-main-card">
          <div className="trust-copy-col">
            <div className="trust-eyebrow-wrap">
              <FiShield className="trust-badge-icon" aria-hidden="true" />
              <span className="landing-eyebrow">Governance & Human-in-the-Loop</span>
            </div>
            <h2>Automation can help organize the work. Decisions stay with your team.</h2>
            <p className="trust-lead-text">
              IFAADS is architected as an intelligence layer that enhances decision quality rather than making opaque automated judgments. Your financial team retains full auditability and final sign-off authority.
            </p>

            <ul className="trust-principles-checklist">
              <li>
                <span className="check-bullet"><FiCheck aria-hidden="true" /></span>
                <div>
                  <strong>Category suggestions can be changed at any time</strong>
                  <p>Machine learning assists with initial classification, but any assigned category can be instantly corrected or remapped.</p>
                </div>
              </li>
              <li>
                <span className="check-bullet"><FiCheck aria-hidden="true" /></span>
                <div>
                  <strong>Anomaly flags serve as review signals, never verdicts</strong>
                  <p>Statistical deviations highlight transactions needing human attention before payment release, avoiding premature blocks.</p>
                </div>
              </li>
              <li>
                <span className="check-bullet"><FiCheck aria-hidden="true" /></span>
                <div>
                  <strong>Forecasts show estimates based strictly on verified history</strong>
                  <p>Projections are mathematically calculated from recorded cash cycles with confidence bands, not speculative speculation.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="trust-security-col">
            <div className="security-subcard">
              <div className="security-card-header">
                <FiLock className="sec-icon" aria-hidden="true" />
                <h4>Enterprise Security Architecture</h4>
              </div>
              <ul className="security-specs-list">
                <li>
                  <FiCheckCircle className="spec-check" aria-hidden="true" />
                  <span>Role-Based Access Control (Owner, Accountant, Viewer)</span>
                </li>
                <li>
                  <FiCheckCircle className="spec-check" aria-hidden="true" />
                  <span>AES-256 encryption at rest and TLS 1.3 in transit</span>
                </li>
                <li>
                  <FiCheckCircle className="spec-check" aria-hidden="true" />
                  <span>Immutable audit logs tracking all review decisions</span>
                </li>
                <li>
                  <FiCheckCircle className="spec-check" aria-hidden="true" />
                  <span>Isolated tenant workspace boundaries</span>
                </li>
              </ul>
            </div>

            <div className="security-subcard subcard-controls">
              <div className="security-card-header">
                <FiSliders className="sec-icon" aria-hidden="true" />
                <h4>Controlled Decision Support</h4>
              </div>
              <p className="security-caption">
                Designed specifically for mid-market and enterprise accounting teams requiring verifiable data provenance and strict compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

